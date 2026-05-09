import React from "react";
import { ArrowLeft, ArrowRight, CircleCheck, Clock } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { useToast } from "../../components/Toast";
import { api, apiError } from "../../lib/api";
import { env } from "../../lib/env";
import {
  sendPayrollVaultTransaction,
  sendSwapRouterTransaction,
} from "../../lib/payrollTransactions";
import { routes } from "../../lib/routes";
import type { Claim, SwapRouterWithdraw } from "../../lib/types";
import { useWallet } from "../../lib/wallet";
import {
  encryptedInputForApi,
  encryptedInputForContract,
  encryptUint64ForSwapRouter,
  publicDecryptForTx,
  publicDecryptManyForTx,
} from "../../lib/zama";

type ClaimDetailTab = "overview" | "transactions" | "details";
type ClaimDetailLiveAction =
  | "claim-request"
  | "claim-complete"
  | "withdraw"
  | null;

const ACTIVE_REFRESH_MS = 1_500;
const ACTIVE_WAIT_MS = 1_200;
const SHORT_WAIT_MS = 800;

function claimDetailTabFromSearch(value?: string | null): ClaimDetailTab | null {
  if (value === "overview" || value === "transactions" || value === "details") {
    return value;
  }

  return null;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function txUrl(txHash?: string | null) {
  if (!txHash) return "";

  /**
   * Zama deployment is on Ethereum Sepolia:
   * chainId 11155111.
   */
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

function normalizedStatus(value?: string | null) {
  return String(value ?? "not_started").toLowerCase();
}

function isHex32(value?: string | null) {
  return Boolean(value?.startsWith("0x") && value.length === 66);
}

function isZeroBytes32(value?: string | null) {
  return !value || /^0x0{64}$/i.test(String(value));
}

function getClaimRequestId(claim?: {
  pending_request_id?: string | null;
  request_id?: string | null;
} | null) {
  return claim?.pending_request_id || claim?.request_id || "";
}

function claimProofReady(claim?: {
  pending_ok_handle?: string | null;
  pending_request_id?: string | null;
  request_id?: string | null;
} | null) {
  return (
    !isZeroBytes32(claim?.pending_ok_handle) &&
    !isZeroBytes32(getClaimRequestId(claim))
  );
}

function isClaimFinalized(status: string) {
  return ["completed", "claimed", "finalized", "finalized_success"].includes(
    status,
  );
}

function isWithdrawFinalized(status: string) {
  return status === "finalized_success";
}

function isClaimRequested(status: string) {
  return [
    "requesting",
    "request_broadcasted",
    "pending_ready",
    "finalize_broadcasted",
    "finalized_success",
    "finalized_revert",
    "cancel_broadcasted",
    "cancelled",
    "failed",
  ].includes(status);
}

function isClaimWaitingForProof(status: string, claim?: Claim | null) {
  return (
    ["requesting", "request_broadcasted", "pending_ready"].includes(status) &&
    !claimProofReady(claim)
  );
}

function isWithdrawMoving(status: string) {
  /**
   * Do NOT include "pending_ready".
   * pending_ready is actionable because the user can click Withdraw to finalize.
   */
  return ["finalize_broadcasted", "loading"].includes(status);
}

function withdrawCanRequest(status: string) {
  return ["draft", "failed", "finalized_revert", "cancelled"].includes(status);
}

function withdrawCanSync(status: string) {
  return status === "request_broadcasted";
}

function withdrawCanFinalize(status: string) {
  return status === "pending_ready";
}

function shortHash(value?: string | null) {
  if (!value) return "—";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function getErrorMessage(error: unknown) {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return apiError(error);
}

function isHttpConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { response?: { status?: number } }).response?.status === 409
  );
}

function toBool(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "bigint") return value !== 0n;
  if (typeof value === "number") return value !== 0;

  const text = String(value ?? "").trim().toLowerCase();

  if (["true", "1", "yes"].includes(text)) return true;
  if (["false", "0", "", "no"].includes(text)) return false;

  return Boolean(value);
}

function toBigIntString(value: unknown) {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number") return BigInt(value).toString();

  const text = String(value ?? "").trim();
  if (!text) return "0";

  return (text.startsWith("0x") ? BigInt(text) : BigInt(text)).toString();
}

function normalizeWallet(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizeOptionalId(value: unknown) {
  const raw = String(value ?? "").trim().toLowerCase();

  if (!raw || raw === "null" || raw === "undefined" || raw === "none") {
    return "";
  }

  if (!/^\d+$/.test(raw)) {
    return "";
  }

  return raw;
}

function resolveRecordId(
  value: string | number | undefined | null,
  label: string,
) {
  const raw = String(value ?? "").trim();

  if (!raw || raw === "null" || raw === "undefined") {
    throw new Error(`${label} is missing.`);
  }

  return raw;
}

function normalizeHandleKey(handle: string) {
  return String(handle || "").trim();
}

function getDecryptValue(values: Record<string, unknown>, handle: string) {
  const key = normalizeHandleKey(handle);
  return values[key] ?? values[key.toLowerCase()] ?? values[key.toUpperCase()];
}

function normalizeAtomicAmount(value: unknown, label: string) {
  const raw = String(value ?? "").trim();

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${label} is missing or invalid.`);
  }

  if (BigInt(raw) <= 0n) {
    throw new Error(`${label} must be greater than zero.`);
  }

  return raw;
}

function withdrawUserStatus(status: string, claimFinalized: boolean) {
  if (!claimFinalized) return "Locked";
  if (status === "request_broadcasted") return "Withdrawing";
  if (["pending_ready", "finalize_broadcasted"].includes(status)) {
    return "Finalizing payout";
  }
  if (isWithdrawFinalized(status)) return "Withdrawn";
  if (["failed", "finalized_revert", "error"].includes(status)) {
    return "Needs attention";
  }
  return "Ready to withdraw";
}

function claimPollingInterval(claim?: Claim | null) {
  const status = normalizedStatus(claim?.status);

  if (!claim) return ACTIVE_REFRESH_MS;
  if (isClaimFinalized(status)) return 15_000;
  if (isClaimWaitingForProof(status, claim) || status === "finalize_broadcasted") {
    return ACTIVE_REFRESH_MS;
  }
  if (isClaimRequested(status)) return ACTIVE_REFRESH_MS;

  return 8_000;
}

function withdrawPollingInterval(withdraw?: SwapRouterWithdraw | null) {
  const status = normalizedStatus(withdraw?.status);

  if (!withdraw) return ACTIVE_REFRESH_MS;
  if (isWithdrawFinalized(status)) return 15_000;
  if (isWithdrawMoving(status) || withdrawCanSync(status) || withdrawCanFinalize(status)) {
    return ACTIVE_REFRESH_MS;
  }

  return 8_000;
}

export function ClaimDetailPage() {
  const { claimId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const { wallet, connect } = useWallet();

  const searchTab = searchParams.get("tab");
  const searchRunId = searchParams.get("runId") ?? "";
  const searchPayrollId = searchParams.get("payrollId") ?? "";

  const [activeTab] = React.useState<ClaimDetailTab>(
    () => claimDetailTabFromSearch(searchTab) ?? "overview",
  );
  const [liveAction, setLiveAction] =
    React.useState<ClaimDetailLiveAction>(null);
  const liveActionRef = React.useRef<ClaimDetailLiveAction>(null);
  const [withdrawProgressLabel, setWithdrawProgressLabel] = React.useState("");

  const [dismissedCompletionNotice, setDismissedCompletionNotice] =
    React.useState<"claim" | "withdrawal" | null>(null);

  const claimQuery = useQuery({
    queryKey: ["claim", claimId],
    queryFn: async () => {
      const { data } = await api.get(routes.claims.detail(claimId));
      return data as Claim;
    },
    enabled: Boolean(claimId),
    refetchInterval: (query) =>
      claimPollingInterval(query.state.data as Claim | undefined),
  });

  const currentClaim = claimQuery.data;
  const currentClaimId = currentClaim?.id ? String(currentClaim.id) : claimId;
  const currentWithdrawId = normalizeOptionalId(currentClaim?.withdraw_id);

  const withdrawQuery = useQuery({
    queryKey: ["withdraw", currentWithdrawId],
    queryFn: async () => {
      if (!currentWithdrawId) {
        throw new Error("Withdraw ID is missing.");
      }

      const { data } = await api.get(routes.withdraws.detail(currentWithdrawId));
      return data as SwapRouterWithdraw;
    },
    enabled: Boolean(currentWithdrawId),
    refetchInterval: (query) =>
      withdrawPollingInterval(query.state.data as SwapRouterWithdraw | undefined),
  });

  const currentWithdraw = withdrawQuery.data;

  const payrollId =
    searchPayrollId ||
    String(currentClaim?.run_onchain_payroll_id ?? "") ||
    "";

  function beginLiveAction(action: Exclude<ClaimDetailLiveAction, null>) {
    if (liveActionRef.current) {
      toast.push({
        kind: "info",
        title: "Transaction in progress",
        message: "Please wait for the current step to finish syncing.",
      });

      return false;
    }

    liveActionRef.current = action;
    setLiveAction(action);
    return true;
  }

  function endLiveAction(action?: Exclude<ClaimDetailLiveAction, null>) {
    if (action && liveActionRef.current !== action) return;

    liveActionRef.current = null;
    setLiveAction(null);
  }

  async function refetchAll() {
    const tasks: Promise<unknown>[] = [claimQuery.refetch()];

    if (currentWithdrawId) {
      tasks.push(withdrawQuery.refetch());
    }

    await Promise.allSettled(tasks);
  }

  async function requireEmployeeWallet() {
    const sender = normalizeWallet((await connect()) || wallet);

    if (!sender.startsWith("0x") || sender.length !== 42) {
      throw new Error("Connect the employee wallet before sending this transaction.");
    }

    const expected = normalizeWallet(currentClaim?.employee_address);

    if (expected && expected !== sender) {
      throw new Error(`Connected wallet does not match employee wallet ${expected}.`);
    }

    return sender as `0x${string}`;
  }

  function requireClaim() {
    if (!currentClaim) throw new Error("Claim is still loading.");
    return currentClaim;
  }

  function requirePayrollId() {
    const source =
      payrollId ||
      searchPayrollId ||
      requireClaim().run_onchain_payroll_id;

    if (
      source === undefined ||
      source === null ||
      String(source).trim() === "" ||
      String(source).trim().toLowerCase() === "null"
    ) {
      throw new Error("On-chain payroll ID is missing for this claim.");
    }

    return BigInt(source);
  }

  function requireClaimAmountAtomic() {
    const claim = requireClaim();

    return normalizeAtomicAmount(
      claim.claim_amount_atomic,
      "Claim salary amount",
    );
  }

  function requireClaimPendingFields() {
    const claim = requireClaim();

    const okHandle = claim.pending_ok_handle;
    const requestId = claim.pending_request_id || claim.request_id;

    if (!isHex32(okHandle)) {
      throw new Error("Pending ok handle is not ready yet.");
    }

    if (!isHex32(requestId)) {
      throw new Error("Pending request ID is not ready yet.");
    }

    return {
      okHandle: okHandle as string,
      requestId: requestId as string,
    };
  }

  function requireWithdraw() {
    if (!currentWithdraw) {
      throw new Error("Create or load the withdraw record first.");
    }

    if (!currentWithdraw.withdraw_key || !isHex32(currentWithdraw.withdraw_key)) {
      throw new Error("Withdraw key is not ready yet.");
    }

    return currentWithdraw;
  }

  function requireWithdrawPendingFields() {
    const withdraw = requireWithdraw();

    const amountHandle = withdraw.pending_amount_handle;
    const okHandle = withdraw.pending_ok_handle;
    const requestId = withdraw.pending_request_id || withdraw.request_id;

    if (!isHex32(amountHandle) || !isHex32(okHandle)) {
      throw new Error("Withdraw pending handles are not ready yet.");
    }

    if (!isHex32(requestId)) {
      throw new Error("Withdraw request ID is not ready yet.");
    }

    return {
      withdraw,
      withdrawKey: withdraw.withdraw_key as string,
      amountHandle: amountHandle as string,
      okHandle: okHandle as string,
      requestId: requestId as string,
    };
  }

  const requestClaim = useMutation({
    mutationFn: async () => {
      const sender = await requireEmployeeWallet();

      const tx = await sendPayrollVaultTransaction({
        from: sender,
        functionName: "requestClaim",
        args: [requirePayrollId()],
      });

      await api.post(routes.claims.request(currentClaimId), tx);

      return tx;
    },
    onSuccess: async (tx) => {
      toast.push({
        kind: "success",
        title: "Claim request submitted",
        message: shortHash(tx.tx_hash),
      });

      await refetchAll();
    },
    onError: (error) => {
      toast.push({
        kind: "error",
        title: "Request failed",
        message: getErrorMessage(error),
      });
    },
  });

  const syncPendingClaim = useMutation({
    mutationFn: () => api.post(routes.claims.syncPending(currentClaimId), {}),
    onSuccess: async () => {
      await refetchAll();
    },
    onError: (error) => {
      toast.push({
        kind: "error",
        title: "Sync failed",
        message: getErrorMessage(error),
      });
    },
  });

  const finalizeClaim = useMutation({
    mutationFn: async () => {
      const { okHandle, requestId } = requireClaimPendingFields();
      const sender = await requireEmployeeWallet();

      const decrypt = await publicDecryptForTx(okHandle, env.payrollVaultAddress);
      const okPlaintext = toBool(decrypt.decryptedValue);

      if (!okPlaintext) {
        throw new Error(
          "Claim proof decrypted to false. Cancel this pending claim instead.",
        );
      }

      const tx = await sendPayrollVaultTransaction({
        from: sender,
        functionName: "finalizeClaim",
        args: [requirePayrollId(), requestId, okPlaintext, decrypt.proof],
      });

      await api.post(routes.claims.finalize(currentClaimId), {
        ...tx,
        request_id: requestId,
        ok_plaintext: okPlaintext,
        ok_sig: decrypt.proof,
        decryption_proof: decrypt.proof,
      });

      return tx;
    },
    onSuccess: async (tx) => {
      toast.push({
        kind: "success",
        title: "Claim finalizing",
        message: shortHash(tx.tx_hash),
      });

      await refetchAll();
    },
    onError: (error) => {
      toast.push({
        kind: "error",
        title: "Completion failed",
        message: getErrorMessage(error),
      });
    },
  });

  const createWithdraw = useMutation({
    mutationFn: async () => {
      const id = resolveRecordId(currentClaimId, "Claim ID");

      const { data } = await api.post(routes.withdraws.create, {
        claim_id: id,
      });

      return data as SwapRouterWithdraw;
    },
    onSuccess: async () => {
      await claimQuery.refetch();
    },
    onError: (error) => {
      toast.push({
        kind: "error",
        title: "Withdrawal failed",
        message: getErrorMessage(error),
      });
    },
  });

  const requestWithdraw = useMutation({
    mutationFn: async () => {
      const withdraw = requireWithdraw();
      const sender = await requireEmployeeWallet();
      const amountAtomic = requireClaimAmountAtomic();

      const encryptedAmount = await encryptUint64ForSwapRouter(amountAtomic, sender);

      const tx = await sendSwapRouterTransaction({
        from: sender,
        functionName: "requestWithdraw",
        args: [
          withdraw.withdraw_key as string,
          encryptedInputForContract(encryptedAmount),
          encryptedAmount.inputProof,
        ],
      });

      await api.post(routes.withdraws.request(withdraw.id), {
        ...tx,
        amount_atomic: amountAtomic,
        encrypted_amount: encryptedInputForApi(encryptedAmount),
        inputProof: encryptedAmount.inputProof,
      });

      return tx;
    },
    onSuccess: async (tx) => {
      toast.push({
        kind: "success",
        title: "Withdrawal submitted",
        message: shortHash(tx.tx_hash),
      });

      await refetchAll();
    },
    onError: (error) => {
      toast.push({
        kind: "error",
        title: "Withdrawal failed",
        message: getErrorMessage(error),
      });
    },
  });

  const syncWithdraw = useMutation({
    mutationFn: async () => {
      const withdraw = requireWithdraw();
      return api.post(routes.withdraws.syncPending(withdraw.id), {});
    },
    onSuccess: async () => {
      await refetchAll();
    },
    onError: (error) => {
      toast.push({
        kind: "error",
        title: "Withdrawal sync failed",
        message: getErrorMessage(error),
      });
    },
  });

  const finalizeWithdraw = useMutation({
    mutationFn: async () => {
      const {
        withdraw,
        withdrawKey,
        amountHandle,
        okHandle,
        requestId,
      } = requireWithdrawPendingFields();

      const sender = await requireEmployeeWallet();

      const decrypt = await publicDecryptManyForTx(
        [amountHandle, okHandle],
        env.swapRouterAddress,
      );

      const amountPlaintext = toBigIntString(
        getDecryptValue(decrypt.values, amountHandle),
      );
      const okPlaintext = toBool(getDecryptValue(decrypt.values, okHandle));

      if (!okPlaintext) {
        throw new Error(
          "Withdraw proof decrypted to false. Cancel this pending withdrawal instead.",
        );
      }

      const expectedAmount = requireClaimAmountAtomic();

      if (amountPlaintext !== expectedAmount) {
        throw new Error(
          `Withdraw amount mismatch. Expected ${expectedAmount}, got ${amountPlaintext}.`,
        );
      }

      const tx = await sendSwapRouterTransaction({
        from: sender,
        functionName: "finalizeWithdraw",
        args: [
          withdrawKey,
          requestId,
          BigInt(amountPlaintext),
          okPlaintext,
          decrypt.proof,
        ],
      });

      await api.post(routes.withdraws.finalize(withdraw.id), {
        ...tx,
        request_id: requestId,
        amount_plaintext: amountPlaintext,
        ok_plaintext: okPlaintext,
        ok_sig: decrypt.proof,
        decryption_proof: decrypt.proof,
      });

      return tx;
    },
    onSuccess: async (tx) => {
      toast.push({
        kind: "success",
        title: "Withdrawal finalizing",
        message: shortHash(tx.tx_hash),
      });

      await refetchAll();
    },
    onError: (error) => {
      toast.push({
        kind: "error",
        title: "Withdrawal failed",
        message: getErrorMessage(error),
      });
    },
  });

  async function handleRequestClaim() {
    try {
      if (!beginLiveAction("claim-request")) return;

      setWithdrawProgressLabel("");

      if (!wallet) {
        await connect();
        throw new Error("Connect your wallet before requesting this claim.");
      }

      if (!payrollId && !currentClaim?.run_onchain_payroll_id) {
        throw new Error("Payroll ID is missing.");
      }

      await requestClaim.mutateAsync();
      await claimQuery.refetch();
    } catch (error) {
      endLiveAction("claim-request");

      toast.push({
        kind: "error",
        title: "Request failed",
        message: getErrorMessage(error),
      });
    }
  }

  async function handleCompleteClaim() {
    try {
      if (!beginLiveAction("claim-complete")) return;

      setWithdrawProgressLabel("");

      if (!wallet) {
        await connect();
        throw new Error("Connect your wallet before completing this claim.");
      }

      if (!currentClaim) {
        throw new Error("Claim record is missing.");
      }

      if (!claimProofReady(currentClaim)) {
        throw new Error("Your claim is not ready yet.");
      }

      await finalizeClaim.mutateAsync();
      await claimQuery.refetch();
    } catch (error) {
      endLiveAction("claim-complete");

      toast.push({
        kind: "error",
        title: "Completion failed",
        message: getErrorMessage(error),
      });
    }
  }

  async function loadLatestWithdraw(
    withdrawId: string,
  ): Promise<SwapRouterWithdraw> {
    const { data } = await api.get(routes.withdraws.detail(withdrawId));
    return data as SwapRouterWithdraw;
  }

  async function syncWithdrawPendingWhenReady(withdrawId: string | number) {
    try {
      await api.post(routes.withdraws.syncPending(withdrawId), {});
      return true;
    } catch (error) {
      if (isHttpConflict(error)) {
        return false;
      }

      throw error;
    }
  }

  async function handleWithdrawToWallet() {
    try {
      if (!beginLiveAction("withdraw")) return;

      setWithdrawProgressLabel("Preparing withdrawal");

      if (!wallet) {
        await connect();
        throw new Error("Connect your wallet before withdrawing.");
      }

      if (!currentClaimId) {
        throw new Error("Claim ID is missing.");
      }

      if (!claimFinalized) {
        throw new Error("Complete your claim before withdrawing.");
      }

      /**
       * CoFHE-style UX:
       * One visible button: Withdraw.
       * Internally advances:
       * create withdraw → request withdraw → sync pending → finalize withdraw.
       */
      let nextWithdrawId = currentWithdrawId;
      let latestWithdraw = currentWithdraw;

      if (!nextWithdrawId) {
        setWithdrawProgressLabel("Creating withdrawal record");

        const created = await createWithdraw.mutateAsync();

        nextWithdrawId = normalizeOptionalId(created?.id);
        latestWithdraw = created;

        await claimQuery.refetch();
        await wait(SHORT_WAIT_MS);
      }

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const latestClaimResult = await claimQuery.refetch();

        nextWithdrawId = normalizeOptionalId(
          latestClaimResult.data?.withdraw_id ?? latestWithdraw?.id ?? nextWithdrawId,
        );

        if (!nextWithdrawId) {
          await wait(ACTIVE_WAIT_MS);
          continue;
        }

        latestWithdraw = await loadLatestWithdraw(nextWithdrawId);

        const status = normalizedStatus(latestWithdraw.status);

        if (status === "finalized_success") {
          await refetchAll();
          endLiveAction("withdraw");
          setWithdrawProgressLabel("");

          toast.push({
            kind: "success",
            title: "Withdrawal complete",
            message: "Your salary has been withdrawn to your wallet.",
          });

          return;
        }

        if (withdrawCanRequest(status)) {
          setWithdrawProgressLabel("Preparing withdrawal request");

          const sender = await requireEmployeeWallet();
          const amountAtomic = requireClaimAmountAtomic();

          if (!latestWithdraw.withdraw_key || !isHex32(latestWithdraw.withdraw_key)) {
            throw new Error("Withdraw key is not ready yet.");
          }

          const encryptedAmount = await encryptUint64ForSwapRouter(
            amountAtomic,
            sender,
          );

          setWithdrawProgressLabel("Submitting withdrawal request");

          const tx = await sendSwapRouterTransaction({
            from: sender,
            functionName: "requestWithdraw",
            args: [
              latestWithdraw.withdraw_key,
              encryptedInputForContract(encryptedAmount),
              encryptedAmount.inputProof,
            ],
          });

          await api.post(routes.withdraws.request(latestWithdraw.id), {
            ...tx,
            amount_atomic: amountAtomic,
            encrypted_amount: encryptedInputForApi(encryptedAmount),
            inputProof: encryptedAmount.inputProof,
          });

          await wait(ACTIVE_WAIT_MS);
          continue;
        }

        if (withdrawCanSync(status)) {
          setWithdrawProgressLabel("Waiting for withdrawal proof");

          const synced = await syncWithdrawPendingWhenReady(latestWithdraw.id);

          if (!synced) {
            setWithdrawProgressLabel("Waiting for chain confirmation");
          }

          await wait(ACTIVE_WAIT_MS);
          continue;
        }

        if (withdrawCanFinalize(status)) {
          setWithdrawProgressLabel("Decrypting withdrawal");

          const sender = await requireEmployeeWallet();

          const amountHandle = latestWithdraw.pending_amount_handle;
          const okHandle = latestWithdraw.pending_ok_handle;
          const requestId =
            latestWithdraw.pending_request_id || latestWithdraw.request_id;

          if (!isHex32(amountHandle) || !isHex32(okHandle) || !isHex32(requestId)) {
            await wait(ACTIVE_WAIT_MS);
            continue;
          }

          if (!latestWithdraw.withdraw_key || !isHex32(latestWithdraw.withdraw_key)) {
            throw new Error("Withdraw key is not ready yet.");
          }

          const pendingAmountHandle = amountHandle as string;
          const pendingOkHandle = okHandle as string;
          const pendingRequestId = requestId as string;
          const withdrawKey = latestWithdraw.withdraw_key as string;

          const decrypt = await publicDecryptManyForTx(
            [pendingAmountHandle, pendingOkHandle],
            env.swapRouterAddress,
          );

          const amountPlaintext = toBigIntString(
            getDecryptValue(decrypt.values, pendingAmountHandle),
          );
          const okPlaintext = toBool(
            getDecryptValue(decrypt.values, pendingOkHandle),
          );

          setWithdrawProgressLabel("Finalizing withdrawal");

          if (!okPlaintext) {
            throw new Error("Withdrawal proof is not valid yet.");
          }

          const expectedAmount = requireClaimAmountAtomic();

          if (amountPlaintext !== expectedAmount) {
            throw new Error(
              `Withdraw amount mismatch. Expected ${expectedAmount}, got ${amountPlaintext}.`,
            );
          }

          const tx = await sendSwapRouterTransaction({
            from: sender,
            functionName: "finalizeWithdraw",
            args: [
              withdrawKey,
              pendingRequestId,
              BigInt(amountPlaintext),
              okPlaintext,
              decrypt.proof,
            ],
          });

          await api.post(routes.withdraws.finalize(latestWithdraw.id), {
            ...tx,
            request_id: pendingRequestId,
            amount_plaintext: amountPlaintext,
            ok_plaintext: okPlaintext,
            ok_sig: decrypt.proof,
            decryption_proof: decrypt.proof,
          });

          await refetchAll();
          setWithdrawProgressLabel("Waiting for confirmation");

          toast.push({
            kind: "success",
            title: "Withdrawal submitted",
            message: "Your withdrawal finalization has been submitted.",
          });

          return;
        }

        await wait(ACTIVE_WAIT_MS);
      }

      await refetchAll();
      setWithdrawProgressLabel("Still processing");

      toast.push({
        kind: "success",
        title: "Withdrawal processing",
        message: "Your withdrawal is being processed. This page will update automatically.",
      });
    } catch (error) {
      endLiveAction("withdraw");
      setWithdrawProgressLabel("");

      toast.push({
        kind: "error",
        title: "Withdrawal failed",
        message: getErrorMessage(error),
      });
    }
  }

  const claimStatus = normalizedStatus(
    currentClaim?.status ?? (claimQuery.isError ? "error" : null),
  );

  const withdrawStatus = normalizedStatus(
    currentWithdraw?.status ??
      currentClaim?.withdraw_status ??
      (currentWithdrawId
        ? withdrawQuery.isError
          ? "error"
          : "loading"
        : "not_started"),
  );

  const proofReady = claimProofReady(currentClaim);
  const waitingForProof = isClaimWaitingForProof(claimStatus, currentClaim);
  const claimFinalized = isClaimFinalized(claimStatus);
  const withdrawFinalized = isWithdrawFinalized(withdrawStatus);

  const requestPending = requestClaim.isPending;
  const finalizePending = finalizeClaim.isPending;

  const claimStateLoading = Boolean(currentClaimId && claimQuery.isLoading);
  const withdrawStateLoading = Boolean(
    currentWithdrawId && withdrawQuery.isLoading,
  );

  const claimRequestTx = currentClaim?.request_tx_hash;
  const claimFinalizeTx = currentClaim?.finalize_tx_hash;
  const claimCancelTx = currentClaim?.cancel_tx_hash;

  const withdrawRequestTx = currentWithdraw?.request_tx_hash;
  const withdrawFinalizeTx = currentWithdraw?.finalize_tx_hash;
  const withdrawCancelTx = currentWithdraw?.cancel_tx_hash;

  const hasTxLinks =
    claimRequestTx ||
    claimFinalizeTx ||
    claimCancelTx ||
    withdrawRequestTx ||
    withdrawFinalizeTx ||
    withdrawCancelTx;

  const userWithdrawStatus = withdrawUserStatus(withdrawStatus, claimFinalized);

  const canShowRequestButton =
    !claimFinalized &&
    !isClaimRequested(claimStatus) &&
    !proofReady &&
    !waitingForProof;

  const canShowCompleteButton =
    !claimFinalized &&
    proofReady &&
    !waitingForProof &&
    claimStatus !== "finalize_broadcasted";

  const claimIsCompleting =
    liveAction === "claim-complete" ||
    finalizePending ||
    claimStatus === "finalize_broadcasted";

  const claimIsPreparing =
    liveAction === "claim-request" ||
    waitingForProof ||
    Boolean(claimRequestTx) ||
    requestPending;

  const withdrawalBusy =
    liveAction === "withdraw" ||
    createWithdraw.isPending ||
    requestWithdraw.isPending ||
    syncWithdraw.isPending ||
    finalizeWithdraw.isPending ||
    withdrawStateLoading ||
    isWithdrawMoving(withdrawStatus);

  const claimHistoryStatus = claimFinalized
    ? "Claimed"
    : claimIsCompleting || claimFinalizeTx
      ? "Finalizing"
      : claimIsPreparing
        ? "Preparing"
        : "Not started";

  const withdrawHistoryStatus = withdrawFinalized
    ? "Withdrawn"
    : withdrawalBusy || withdrawFinalizeTx || withdrawRequestTx
      ? "Withdrawing"
      : claimFinalized
        ? userWithdrawStatus
        : "Locked";

  const claimStepStatus = claimFinalized
    ? "Completed"
    : claimIsCompleting
      ? "Completing"
      : claimIsPreparing
        ? "Preparing"
        : canShowCompleteButton
          ? "Ready to complete"
          : canShowRequestButton
            ? "Ready to claim"
            : !wallet
              ? "Wallet required"
              : "Unavailable";

  const withdrawStepStatus = withdrawFinalized
    ? "Completed"
    : withdrawalBusy
      ? "Withdrawing"
      : claimFinalized
        ? "Ready"
        : "Locked";

  const anyActionBusy = Boolean(liveAction);

  const progressNotice =
    liveAction === "claim-request"
      ? {
          title: requestPending
            ? "Waiting for wallet confirmation"
            : "Preparing claim",
          description:
            "After the transaction is submitted, this page will sync the private proof automatically.",
        }
      : liveAction === "claim-complete"
        ? {
            title: finalizePending
              ? "Completing claim"
              : "Waiting for claim confirmation",
            description:
              "We are watching the claim status and will update this page as soon as it changes.",
          }
        : liveAction === "withdraw"
          ? {
              title: withdrawProgressLabel || "Processing withdrawal",
              description:
                "Withdrawal can take a few steps. Keep this page open while we sync the latest state.",
            }
          : waitingForProof
            ? {
                title: "Preparing claim",
                description:
                  "Your claim request is submitted. We are syncing the private proof in the background.",
              }
            : claimIsCompleting
              ? {
                  title: "Completing claim",
                  description:
                    "The claim transaction is being confirmed. This page is checking for updates.",
                }
              : withdrawalBusy
                ? {
                    title: withdrawProgressLabel || "Processing withdrawal",
                    description:
                      "We are checking the withdrawal status and finalizing the next step when it is ready.",
                  }
                : null;

  const shouldFastRefresh = Boolean(
    progressNotice ||
      waitingForProof ||
      claimIsCompleting ||
      withdrawalBusy ||
      claimQuery.isFetching ||
      withdrawQuery.isFetching,
  );

  React.useEffect(() => {
    if (!currentClaimId || !shouldFastRefresh) return;

    let alive = true;
    let busy = false;

    const refreshNow = async () => {
      if (!alive || busy) return;

      busy = true;

      try {
        if (waitingForProof) {
          await api.post(routes.claims.syncPending(currentClaimId), {});
        }

        const tasks: Promise<unknown>[] = [claimQuery.refetch()];

        if (currentWithdrawId) {
          tasks.push(withdrawQuery.refetch());
        }

        await Promise.allSettled(tasks);
      } catch (error) {
        console.warn("[CLAIM DETAIL] background refresh failed:", error);
      } finally {
        busy = false;
      }
    };

    void refreshNow();

    const intervalId = window.setInterval(() => {
      void refreshNow();
    }, ACTIVE_REFRESH_MS);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, [
    currentClaimId,
    currentWithdrawId,
    shouldFastRefresh,
    waitingForProof,
    claimStatus,
    withdrawStatus,
  ]);

  React.useEffect(() => {
    if (liveAction === "claim-request" && (canShowCompleteButton || claimFinalized)) {
      endLiveAction("claim-request");
    }

    if (liveAction === "claim-complete" && claimFinalized) {
      endLiveAction("claim-complete");
    }

    if (liveAction === "withdraw" && withdrawFinalized) {
      endLiveAction("withdraw");
      setWithdrawProgressLabel("");
    }
  }, [
    liveAction,
    canShowCompleteButton,
    claimFinalized,
    withdrawFinalized,
  ]);

  const activityItems: Array<{
    key: string;
    label: string;
    title: string;
    txHash: string;
  }> = [];

  if (claimFinalizeTx || claimRequestTx) {
    activityItems.push({
      key: "claim",
      label: "Claim",
      title: claimHistoryStatus,
      txHash: claimFinalizeTx || claimRequestTx || "",
    });
  }

  if (withdrawFinalizeTx || withdrawRequestTx) {
    activityItems.push({
      key: "withdrawal",
      label: "Withdrawal",
      title: withdrawHistoryStatus,
      txHash: withdrawFinalizeTx || withdrawRequestTx || "",
    });
  }

  if (claimCancelTx) {
    activityItems.push({
      key: "claim-cancellation",
      label: "Claim cancellation",
      title: "Submitted",
      txHash: claimCancelTx,
    });
  }

  if (withdrawCancelTx) {
    activityItems.push({
      key: "withdrawal-cancellation",
      label: "Withdrawal cancellation",
      title: "Submitted",
      txHash: withdrawCancelTx,
    });
  }

  const currentError =
    claimQuery.error ??
    withdrawQuery.error ??
    requestClaim.error ??
    syncPendingClaim.error ??
    finalizeClaim.error ??
    createWithdraw.error ??
    requestWithdraw.error ??
    syncWithdraw.error ??
    finalizeWithdraw.error;

  const completionNotice =
    withdrawFinalized && dismissedCompletionNotice !== "withdrawal"
      ? {
          kind: "withdrawal" as const,
          title: "Withdrawal complete",
          message: "Your salary is now in your wallet.",
        }
      : claimFinalized &&
          !withdrawFinalized &&
          dismissedCompletionNotice !== "claim"
        ? {
            kind: "claim" as const,
            title: "Claim complete",
            message: "You can now withdraw your salary.",
          }
        : null;

  const completionDialog = completionNotice ? (
    <div
      className="claim-completion-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-completion-title"
      aria-describedby="claim-completion-message"
    >
      <div className="claim-completion-popover">
        <div className="claim-completion-icon" aria-hidden="true">
          <CircleCheck size={34} strokeWidth={1.8} />
        </div>

        <div className="claim-completion-copy">
          <h2 id="claim-completion-title">{completionNotice.title}</h2>
          <p id="claim-completion-message">{completionNotice.message}</p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setDismissedCompletionNotice(completionNotice.kind)}
        >
          Close
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="stack claim-detail-page claim-detail-simple-page dashboard-shell dashboard-shell-employee">
      <div className="page-header employee-claims-header-card">
        <div>
          <div className="page-header-eyebrow">Employee</div>
          <h1>Claim Detail</h1>
        </div>
      </div>

      {completionDialog && createPortal(completionDialog, document.body)}

      <div data-tour="employee-claims-card">
        <Card className="claim-detail-card claim-detail-simple-card employee-claims-card">
          <div className="card-head">
            <div className="employee-claims-title-block">
              <h3>Salary Claim</h3>
              <div className="muted employee-claims-count">
                Claim and withdraw salary
              </div>
            </div>

            <button
              type="button"
              className="claim-detail-back-link"
              onClick={() => nav("/employee/claims")}
            >
              <ArrowLeft size={15} strokeWidth={2} />
              <span>Back</span>
            </button>
          </div>

          <div className="stack claim-detail-content-stack">
            {currentError && (
              <p className="text-danger employee-claims-message claim-detail-simple-error">
                {getErrorMessage(currentError)}
              </p>
            )}

            {waitingForProof && (
              <div className="claim-detail-simple-note">
                Your claim is being prepared. This page updates automatically.
              </div>
            )}

            {searchRunId && !payrollId && (
              <div className="claim-detail-simple-note">
                Payroll reference is loading for run #{searchRunId}.
              </div>
            )}

            {progressNotice && (
              <div
                className="claim-detail-progress-note"
                role="status"
                aria-live="polite"
              >
                <span className="claim-detail-progress-spinner" aria-hidden="true" />

                <div>
                  <strong>{progressNotice.title}</strong>
                  <p>{progressNotice.description}</p>
                </div>
              </div>
            )}

            <div className="claim-detail-flow-grid claim-detail-two-step-flow">
              <section
                className={`claim-detail-flow-section claim-detail-flow-section-claim ${
                  claimFinalized ? "is-complete" : ""
                } ${
                  !claimFinalized &&
                  (claimIsPreparing || claimIsCompleting)
                    ? "is-busy"
                    : ""
                }`}
              >
                <div className="claim-detail-step-copy">
                  <span className="claim-detail-step-kicker">Step 1</span>
                  <h4>Claim salary</h4>
                  <p>Complete the private salary claim for this payroll.</p>
                  <span
                    className={`claim-detail-step-status ${
                      claimFinalized ? "is-complete" : ""
                    }`}
                  >
                    {claimFinalized && <CircleCheck size={15} strokeWidth={1.9} />}
                    {claimStepStatus}
                  </span>
                </div>

                <div className="claim-detail-flow-section-action">
                  {!wallet && (
                    <Button type="button" onClick={() => void connect()}>
                      Connect Wallet
                    </Button>
                  )}

                  {wallet && claimFinalized && (
                    <Button type="button" variant="secondary" disabled>
                      <CircleCheck size={16} strokeWidth={1.9} />
                      Claim Completed
                    </Button>
                  )}

                  {wallet && canShowRequestButton && (
                    <Button
                      type="button"
                      onClick={() => void handleRequestClaim()}
                      disabled={
                        !payrollId ||
                        requestPending ||
                        claimStateLoading ||
                        anyActionBusy
                      }
                    >
                      {liveAction === "claim-request" || requestPending
                        ? "Requesting claim..."
                        : "Request Claim"}
                    </Button>
                  )}

                  {wallet && canShowCompleteButton && (
                    <Button
                      type="button"
                      onClick={() => void handleCompleteClaim()}
                      disabled={
                        !payrollId ||
                        finalizePending ||
                        claimStateLoading ||
                        anyActionBusy
                      }
                    >
                      {liveAction === "claim-complete" || finalizePending
                        ? "Completing claim..."
                        : "Complete Claim"}
                    </Button>
                  )}

                  {wallet &&
                    !claimFinalized &&
                    !canShowRequestButton &&
                    !canShowCompleteButton && (
                      <Button type="button" variant="secondary" disabled>
                        {claimIsCompleting
                          ? "Completing Claim"
                          : claimIsPreparing
                            ? "Preparing Claim"
                            : "Claim Unavailable"}
                      </Button>
                    )}
                </div>
              </section>

              <section
                className={`claim-detail-flow-section claim-detail-flow-section-withdraw ${
                  withdrawFinalized ? "is-complete" : !claimFinalized ? "is-locked" : ""
                } ${
                  !withdrawFinalized && withdrawalBusy
                    ? "is-busy"
                    : ""
                }`}
              >
                <div className="claim-detail-step-copy">
                  <span className="claim-detail-step-kicker">Step 2</span>
                  <h4>Withdraw to wallet</h4>
                  <p>Move the claimed salary from private balance to your wallet.</p>
                  <span
                    className={`claim-detail-step-status ${
                      withdrawFinalized ? "is-complete" : ""
                    }`}
                  >
                    {withdrawFinalized && <CircleCheck size={15} strokeWidth={1.9} />}
                    {withdrawStepStatus}
                  </span>
                </div>

                <div className="claim-detail-flow-section-action">
                  {withdrawFinalized && (
                    <Button type="button" variant="secondary" disabled>
                      <CircleCheck size={16} strokeWidth={1.9} />
                      Withdrawal Complete
                    </Button>
                  )}

                  {!withdrawFinalized && !claimFinalized && (
                    <Button type="button" variant="secondary" disabled>
                      Complete Claim First
                    </Button>
                  )}

                  {!withdrawFinalized && claimFinalized && (
                    <Button
                      type="button"
                      onClick={() => void handleWithdrawToWallet()}
                      disabled={
                        !wallet ||
                        !currentClaimId ||
                        withdrawalBusy ||
                        anyActionBusy
                      }
                    >
                      {withdrawalBusy
                        ? withdrawProgressLabel || "Withdrawing..."
                        : "Withdraw"}
                    </Button>
                  )}
                </div>
              </section>
            </div>

            {(hasTxLinks || activeTab === "transactions") && (
              <section
                className="claim-detail-activity-card"
                aria-labelledby="claim-detail-activity-title"
              >
                <div className="claim-detail-activity-head">
                  <Clock size={22} strokeWidth={1.9} aria-hidden="true" />
                  <h4 id="claim-detail-activity-title">Activity</h4>
                </div>

                <div className="claim-detail-simple-activity">
                  {activityItems.map((item) => (
                    <div className="claim-detail-simple-activity-row" key={item.key}>
                      <span
                        className="claim-detail-activity-marker"
                        aria-hidden="true"
                      />

                      <div className="claim-detail-activity-copy">
                        <span>{item.label}</span>
                        <strong>{item.title}</strong>
                      </div>

                      <a
                        className="claim-detail-activity-link"
                        href={txUrl(item.txHash)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>View transaction</span>
                        <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
                      </a>
                    </div>
                  ))}

                  {activityItems.length === 0 && (
                    <p className="claim-detail-simple-empty">No activity yet.</p>
                  )}
                </div>
              </section>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
