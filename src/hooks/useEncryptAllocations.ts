import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";
import { api, toApiError } from "../lib/api";

const PAYROLL_VAULT_ADDRESS = import.meta.env.VITE_PAYROLLVAULT_ADDRESS as `0x${string}`;
const FEE_PER_EMPLOYEE_WEI = BigInt(import.meta.env.VITE_INCO_FEE_WEI || "0");

const payrollVaultAbi = [
  {
    type: "function",
    name: "uploadAllocations",
    stateMutability: "payable",
    inputs: [
      { name: "payrollId", type: "uint256" },
      { name: "employees", type: "address[]" },
      { name: "amountCiphertexts", type: "bytes[]" },
    ],
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

  const currentChainId = await walletClient.getChainId();
  if (currentChainId !== baseSepolia.id) {
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

export function useEncryptAllocations(runId: string | number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      allocations: Array<{ employee_address: string; amount_atomic: string }>;
      wallet: string;
      dappAddress: string;
      onProgress?: (current: number, total: number) => void;
    }) => {
      try {
        const total = params.allocations.length;
        for (let i = 0; i < total; i++) {
          params.onProgress?.(i + 1, total);
        }

        await api.post(`/api/inco/runs/${runId}/encrypt_and_save_allocations/`, {
          allocations: params.allocations,
          account_address: params.wallet,
          dapp_address: params.dappAddress,
        });

        const payloadRes = await api.get(`/api/inco/runs/${runId}/allocation_chunk_payload/`);
        const payload = payloadRes.data as {
          payroll_id: number;
          employees: `0x${string}`[];
          amount_ciphertexts: `0x${string}`[];
        };

        if (!payload?.employees?.length) {
          throw new Error("No encrypted employees available for upload.");
        }

        const { walletClient, publicClient, account } = await getWalletClients();

        const nonce = await publicClient.getTransactionCount({
          address: account,
          blockTag: "pending",
        });

        const totalFeeWei = FEE_PER_EMPLOYEE_WEI * BigInt(payload.employees.length);

        const { request } = await publicClient.simulateContract({
          account,
          address: PAYROLL_VAULT_ADDRESS,
          abi: payrollVaultAbi,
          functionName: "uploadAllocations",
          args: [
            BigInt(payload.payroll_id),
            payload.employees,
            payload.amount_ciphertexts,
          ],
          value: totalFeeWei,
          nonce,
        });

        const txHash = await walletClient.writeContract(request);

        await api.post(`/api/inco/runs/${runId}/submit_upload_allocations_chunk/`, {
          employees: payload.employees,
          fee_wei: totalFeeWei.toString(),
          tx_hash: txHash,
          sender: account,
          nonce,
        });

        return { encryptedCount: total, txHash };
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