import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";
import { api, toApiError } from "../lib/api";
import SwapRouterArtifact from "../abi/SwapRouter.json";

const SWAP_ROUTER_ADDRESS = import.meta.env.VITE_SWAP_ROUTER_ADDRESS as `0x${string}`;
const ENCRYPTOR_BASE_URL =
  (import.meta.env.VITE_ENCRYPTOR_BASE_URL as string) || "http://127.0.0.1:8788";
const SWAP_ROUTER_ABI = (SwapRouterArtifact as any).abi;
const WITHDRAW_FEE_WEI = 100000000000000n;

export type WithdrawRecord = {
  id: number;
  status: string;
};

export type WithdrawPendingResponse = {
  pendingOkHandle: string;
  pendingAmountHandle: string;
  pendingRequestId: string;
};

type RequestWithdrawArgs = {
  withdrawId: number | string;
  amountAtomic: string;
};

type RequestWithdrawPayload = {
  tx_hash: string;
  sender: string;
  nonce: number;
  amount_ciphertext_hex: `0x${string}`;
  fee_wei: string;
};

type SyncWithdrawArgs = {
  withdrawId: number | string;
};

type FinalizeWithdrawArgs = {
  withdrawId: number | string;
  pending: WithdrawPendingResponse;
};

type FinalizeWithdrawPayload = {
  tx_hash: string;
  sender: string;
  nonce: number;
  amountAtt: { handle: string; value: string };
  amountSigs: string[];
  okAtt: { handle: string; value: string };
  okSigs: string[];
  requestId: string;
};

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
  return new Error(apiErr?.message || "Something went wrong. Please try again.");
}

async function readJsonOrThrow(res: Response, fallbackLabel: string) {
  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    if (!res.ok) {
      throw new Error(
        `${fallbackLabel} returned a non-JSON response. Check ENCRYPTOR_BASE_URL and restart the helper server.`
      );
    }
    throw new Error(`${fallbackLabel} returned invalid JSON.`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `${fallbackLabel} failed.`);
  }

  return data;
}

export function useCreateWithdraw() {
  return useMutation({
    mutationFn: async (userAddress: string): Promise<WithdrawRecord> => {
      try {
        const res = await api.post("/api/inco/swaprouter/withdraws/", {
          chain_id: 84532,
          user_address: userAddress,
        });
        return res.data;
      } catch (e) {
        throw toApiError(e);
      }
    },
  });
}

export function useWithdrawPending(withdrawId?: number | string) {
  return useQuery<WithdrawPendingResponse>({
    queryKey: ["swaprouterWithdrawPending", String(withdrawId || "")],
    queryFn: async () => {
      throw new Error("Use sync mutation instead.");
    },
    enabled: false,
  });
}

export function useRequestWithdraw() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ withdrawId, amountAtomic }: RequestWithdrawArgs) => {
      try {
        const { walletClient, publicClient, account } = await getWalletClients();

        const encryptRes = await fetch(`${ENCRYPTOR_BASE_URL}/encrypt`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            plaintext: amountAtomic,
            accountAddress: account,
            dappAddress: SWAP_ROUTER_ADDRESS,
            handleType: "euint256",
          }),
        });

        const encryptData = await readJsonOrThrow(encryptRes, "Encrypt endpoint");
        const amountCiphertextHex = encryptData.amount_ciphertext_hex as `0x${string}`;

        const nonce = await publicClient.getTransactionCount({
          address: account,
          blockTag: "pending",
        });

        const { request } = await publicClient.simulateContract({
          account,
          address: SWAP_ROUTER_ADDRESS,
          abi: SWAP_ROUTER_ABI,
          functionName: "requestWithdraw",
          args: [amountCiphertextHex],
          value: WITHDRAW_FEE_WEI,
          nonce,
        });

        const txHash = await walletClient.writeContract(request);

        const payload: RequestWithdrawPayload = {
          tx_hash: txHash,
          sender: account,
          nonce,
          amount_ciphertext_hex: amountCiphertextHex,
          fee_wei: WITHDRAW_FEE_WEI.toString(),
        };

        const res = await api.post(
          `/api/inco/swaprouter/withdraws/${withdrawId}/submit_request/`,
          payload
        );

        return res.data as { tx_hash: string };
      } catch (e) {
        throw normalizeError(e);
      }
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: ["swaprouterWithdrawPending", String(vars.withdrawId)],
      });
    },
  });
}

export function useSyncWithdrawPending() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ withdrawId }: SyncWithdrawArgs) => {
      try {
        const res = await api.post(
          `/api/inco/swaprouter/withdraws/${withdrawId}/sync_pending/`,
          {}
        );
        return res.data as WithdrawPendingResponse;
      } catch (e) {
        throw toApiError(e);
      }
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: ["swaprouterWithdrawPending", String(vars.withdrawId)],
      });
    },
  });
}

export function useFinalizeWithdraw() {
  return useMutation({
    mutationFn: async ({ withdrawId, pending }: FinalizeWithdrawArgs) => {
      try {
        const { walletClient, publicClient, account } = await getWalletClients();

        const attRes = await fetch(`${ENCRYPTOR_BASE_URL}/withdraw-attestations`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            amountHandle: pending.pendingAmountHandle,
            okHandle: pending.pendingOkHandle,
            chainId: 84532,
          }),
        });

        const attData = await readJsonOrThrow(attRes, "Withdraw attestations endpoint");

        const { amountAtt, amountSigs, okAtt, okSigs } = attData as {
          amountAtt: { handle: string; value: string };
          amountSigs: string[];
          okAtt: { handle: string; value: string };
          okSigs: string[];
        };

        const nonce = await publicClient.getTransactionCount({
          address: account,
          blockTag: "pending",
        });

        const { request } = await publicClient.simulateContract({
          account,
          address: SWAP_ROUTER_ADDRESS,
          abi: SWAP_ROUTER_ABI,
          functionName: "finalizeWithdraw",
          args: [amountAtt, amountSigs, okAtt, okSigs, pending.pendingRequestId],
          nonce,
        });

        const txHash = await walletClient.writeContract(request);

        const payload: FinalizeWithdrawPayload = {
          tx_hash: txHash,
          sender: account,
          nonce,
          amountAtt,
          amountSigs,
          okAtt,
          okSigs,
          requestId: pending.pendingRequestId,
        };

        const res = await api.post(
          `/api/inco/swaprouter/withdraws/${withdrawId}/submit_finalize_with_payload/`,
          payload
        );

        return res.data as { tx_hash: string };
      } catch (e) {
        throw normalizeError(e);
      }
    },
  });
}