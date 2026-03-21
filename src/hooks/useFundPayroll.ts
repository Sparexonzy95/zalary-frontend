import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";
import { api, toApiError } from "../lib/api";
import PayrollVaultArtifact from "../abi/PayrollVault.json";

const SWAP_ROUTER_ADDRESS = import.meta.env.VITE_SWAP_ROUTER_ADDRESS as `0x${string}`;
const PAYROLL_VAULT_ABI = PayrollVaultArtifact.abi as any;

const FUND_FEE_WEI = 100000000000000n;

const ERC20_ABI = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const SWAP_ROUTER_ABI = [
  {
    type: "function",
    name: "usdc",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "cToken",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

async function getWalletClients() {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Install MetaMask or another EVM wallet.");

  const walletClient = createWalletClient({
    chain: baseSepolia,
    transport: custom(eth),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const [account] = await walletClient.requestAddresses();
  if (!account) throw new Error("Wallet connection failed.");

  const chainId = await walletClient.getChainId();
  if (chainId !== baseSepolia.id) {
    throw new Error("Please switch wallet network to Base Sepolia.");
  }

  return { walletClient, publicClient, account };
}

function normalizeError(e: unknown): Error {
  if (e instanceof Error) return e;
  const apiErr = toApiError(e);
  if (apiErr?.message) return new Error(apiErr.message);
  return new Error("Something went wrong. Please try again.");
}

export function useFundPayroll(runId: string | number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const fundingCtxRes = await api.get(`/api/inco/runs/${runId}/funding_context/`);
        const fundingCtx = fundingCtxRes.data as {
          onchain_payroll_id: number;
          employee_count: number;
          required_total_atomic: string;
          token_address: `0x${string}`;
          payrollvault_address: `0x${string}`;
          chain_id: number;
        };

        const runRes = await api.get(`/api/inco/runs/${runId}/`);
        const run = runRes.data as { status?: string };
        const status = String(run.status || "").toLowerCase();
        if (status !== "alloc_finalized") {
          throw new Error("Payroll must be finalized before funding.");
        }

        const { walletClient, publicClient, account } = await getWalletClients();

        const usdcAddress = (await publicClient.readContract({
          address: SWAP_ROUTER_ADDRESS,
          abi: SWAP_ROUTER_ABI,
          functionName: "usdc",
        })) as `0x${string}`;

        const routerCToken = (await publicClient.readContract({
          address: SWAP_ROUTER_ADDRESS,
          abi: SWAP_ROUTER_ABI,
          functionName: "cToken",
        })) as `0x${string}`;

        if (routerCToken.toLowerCase() !== fundingCtx.token_address.toLowerCase()) {
          throw new Error("Router confidential token does not match payroll token.");
        }

        const amountAtomic = BigInt(fundingCtx.required_total_atomic);

        const routerAllowance = await publicClient.readContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [account, SWAP_ROUTER_ADDRESS],
        });

        if (BigInt(String(routerAllowance)) < amountAtomic) {
          const approveNonce = await publicClient.getTransactionCount({
            address: account,
            blockTag: "pending",
          });

          const { request: approveReq } = await publicClient.simulateContract({
            account,
            address: usdcAddress,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [SWAP_ROUTER_ADDRESS, amountAtomic],
            nonce: approveNonce,
          });

          const approveTxHash = await walletClient.writeContract(approveReq);
          await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
        }

        const depositNonce = await publicClient.getTransactionCount({
          address: account,
          blockTag: "pending",
        });

        const { request: depositReq } = await publicClient.simulateContract({
          account,
          address: SWAP_ROUTER_ADDRESS,
          abi: SWAP_ROUTER_ABI,
          functionName: "deposit",
          args: [amountAtomic],
          nonce: depositNonce,
        });

        const depositTxHash = await walletClient.writeContract(depositReq);
        await publicClient.waitForTransactionReceipt({ hash: depositTxHash });

        const encryptRes = await api.post(`/api/inco/runs/${runId}/encrypt_funding_amount/`, {
          account_address: account,
          dapp_address: fundingCtx.payrollvault_address,
        });

        const fundingPayload = encryptRes.data as {
          amount_atomic: string;
          amount_ciphertext_hex: `0x${string}`;
        };

        const nonce = await publicClient.getTransactionCount({
          address: account,
          blockTag: "pending",
        });

        const { request } = await publicClient.simulateContract({
          account,
          address: fundingCtx.payrollvault_address,
          abi: PAYROLL_VAULT_ABI,
          functionName: "fundPayroll",
          args: [
            BigInt(fundingCtx.onchain_payroll_id),
            fundingPayload.amount_ciphertext_hex,
          ],
          value: FUND_FEE_WEI,
          nonce,
        });

        const txHash = await walletClient.writeContract(request);

        await api.post(`/api/inco/runs/${runId}/submit_fund/`, {
          amount_atomic: fundingPayload.amount_atomic,
          amount_ciphertext_hex: fundingPayload.amount_ciphertext_hex,
          fee_wei: FUND_FEE_WEI.toString(),
          tx_hash: txHash,
          sender: account,
          nonce,
        });

        return { txHash, depositTxHash };
      } catch (e) {
        throw normalizeError(e);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["run", String(runId)] });
      await qc.invalidateQueries({ queryKey: ["runFundingQuote", String(runId)] });
    },
  });
}

export function useActivatePayroll(runId: string | number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const runRes = await api.get(`/api/inco/runs/${runId}/`);
        const run = runRes.data as {
          status?: string;
          onchain_payroll_id?: number | string | null;
          chain?: { payrollvault_address?: `0x${string}` };
        };

        const status = String(run.status || "").toLowerCase();
        if (status !== "funded") {
          throw new Error("Payroll must be funded before activation.");
        }

        if (!run.onchain_payroll_id) {
          throw new Error("On-chain payroll ID is missing.");
        }

        const fundingCtxRes = await api.get(`/api/inco/runs/${runId}/funding_context/`);
        const fundingCtx = fundingCtxRes.data as {
          payrollvault_address: `0x${string}`;
        };

        const { walletClient, publicClient, account } = await getWalletClients();

        const nonce = await publicClient.getTransactionCount({
          address: account,
          blockTag: "pending",
        });

        const { request } = await publicClient.simulateContract({
          account,
          address: fundingCtx.payrollvault_address,
          abi: PAYROLL_VAULT_ABI,
          functionName: "activatePayroll",
          args: [BigInt(run.onchain_payroll_id)],
          nonce,
        });

        const txHash = await walletClient.writeContract(request);

        await api.post(`/api/inco/runs/${runId}/submit_activate/`, {
          tx_hash: txHash,
          sender: account,
          nonce,
        });

        return { txHash };
      } catch (e) {
        throw normalizeError(e);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["run", String(runId)] });
      await qc.invalidateQueries({ queryKey: ["runFundingQuote", String(runId)] });
      await qc.invalidateQueries({ queryKey: ["employeeClaimables"] });
    },
  });
}