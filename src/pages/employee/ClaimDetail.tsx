import React from "react";
import { Link, useParams } from "react-router-dom";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";

import SkeletonLoader from "../../ui/SkeletonLoader";
import StatusBadge from "../../ui/StatusBadge";
import { useToast } from "../../ui/Toast";
import { useWallet } from "../../lib/WalletContext";

import {
  useClaim,
  useRequestClaim,
  useSyncPending,
  useFinalizeClaim,
  type ClaimRecord,
} from "../../hooks/useClaims";
import {
  useCreateWithdraw,
  useRequestWithdraw,
  useSyncWithdrawPending,
  useFinalizeWithdraw,
} from "../../hooks/useSwapRouterWithdraw";
import PayrollVaultArtifact from "../../abi/PayrollVault.json";

const PAYROLL_VAULT_ADDRESS = import.meta.env.VITE_PAYROLLVAULT_ADDRESS as `0x${string}`;
const BASE_RPC_URL = (import.meta.env.VITE_BASE_SEPOLIA_RPC_URL as string) || "https://sepolia.base.org";
const ENCRYPTOR_BASE_URL = (import.meta.env.VITE_ENCRYPTOR_BASE_URL as string) || "http://127.0.0.1:8788";
const PAYROLL_VAULT_ABI = (PayrollVaultArtifact as any).abi;

const SWAP_ROUTER_ADDRESS = import.meta.env.VITE_SWAPROUTER_ADDRESS as `0x${string}`;
const SWAP_ROUTER_ABI = [
  {
    type: "function", name: "finalizeWithdraw", stateMutability: "nonpayable",
    inputs: [
      { name: "amountAtt", type: "tuple", components: [{ name: "handle", type: "bytes32" }, { name: "value", type: "bytes32" }] },
      { name: "amountSigs", type: "bytes[]" },
      { name: "okAtt",     type: "tuple", components: [{ name: "handle", type: "bytes32" }, { name: "value", type: "bytes32" }] },
      { name: "okSigs",    type: "bytes[]" },
      { name: "requestId", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;

/* statuses that mean "tx submitted, backend processing" */
const CLAIM_PENDING_STATUSES = new Set([
  "request_broadcasted",
  "finalize_broadcasted",
]);

async function fetchAttestationPayload(
  handle: string,
  userAddress: string
): Promise<{ payload: any; sessionId: string }> {
  const res = await fetch(`${ENCRYPTOR_BASE_URL}/claim-eip712-payload`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ handle, userAddress, chainId: 84532 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch attestation payload");
  return { payload: data.payload, sessionId: data.sessionId };
}

async function fetchWithdrawPayload(
  amountHandle: string,
  okHandle: string,
  userAddress: string
): Promise<{ payload: any; sessionId: string }> {
  const res = await fetch(`${ENCRYPTOR_BASE_URL}/withdraw-eip712-payload`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amountHandle, okHandle, userAddress, chainId: 84532 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch withdrawal payload");
  return { payload: data.payload, sessionId: data.sessionId };
}

async function signAttestationPayload(
  walletClient: any,
  account: `0x${string}`,
  payload: any
): Promise<`0x${string}`> {
  return walletClient.signTypedData({
    account,
    domain: { ...payload.domain, chainId: BigInt(payload.domain.chainId) },
    types:       payload.types,
    primaryType: payload.primaryType,
    message:     payload.message,
  });
}

type WithdrawUiStatus = "not_started" | "request_submitted" | "pending_ready" | "finalized";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap');
.cl-step{border:1px solid rgba(47,107,255,0.1);border-left:3px solid transparent;border-radius:8px;background:rgb(8,11,20);overflow:hidden;transition:all 0.25s}
.cl-step.active-step{border-color:rgba(47,107,255,0.22);border-left-color:rgba(47,107,255,0.85);background:rgba(47,107,255,0.04)}
.cl-step.done-step{border-color:rgba(26,255,140,0.12);border-left-color:rgba(26,255,140,0.5)}
.cl-step-inner{display:flex;align-items:center;gap:16px;padding:18px 20px}
.cl-step-num{width:38px;height:38px;border-radius:50%;border:1px solid rgba(210,222,255,0.1);background:rgba(210,222,255,0.03);display:flex;align-items:center;justify-content:center;font-family:'Space Mono',monospace;font-size:12px;font-weight:700;color:rgba(210,222,255,0.25);flex-shrink:0;transition:all 0.25s}
.cl-step.active-step .cl-step-num{border-color:rgba(47,107,255,0.5);background:rgba(47,107,255,0.12);color:rgba(47,107,255,0.9);box-shadow:0 0 12px rgba(47,107,255,0.18)}
.cl-step.done-step .cl-step-num{border-color:rgba(26,255,140,0.35);background:rgba(26,255,140,0.07);color:rgba(26,255,140,0.85)}
.cl-step-body{flex:1;min-width:0}
.cl-step-title{font-family:'Space Mono',monospace;font-weight:700;font-size:12px;color:rgba(210,222,255,0.88);margin-bottom:3px}
.cl-step-desc{font-family:'Space Mono',monospace;font-size:10px;color:rgba(210,222,255,0.32);letter-spacing:0.02em;line-height:1.55}
.cl-warn{display:flex;align-items:flex-start;gap:12px;padding:16px 20px;background:rgba(255,180,50,0.05);border:1px solid rgba(255,180,50,0.2);border-radius:8px}
.cl-warn-ico{color:rgba(255,180,50,0.75);flex-shrink:0;margin-top:1px}
.cl-warn-text{font-family:'Space Mono',monospace;font-size:11px;color:rgba(255,180,50,0.78);letter-spacing:0.02em;line-height:1.6}
.cl-warn-text strong{color:rgba(255,180,50,0.95)}
.cl-polling{display:inline-flex;align-items:center;gap:5px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:rgba(47,107,255,.65)}
.cl-polling-dot{width:5px;height:5px;border-radius:50%;background:rgba(47,107,255,.8);animation:clPoll 1s ease-in-out infinite}
@keyframes clPoll{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.5)}}
`;

function useStyles() {
  React.useEffect(() => {
    const id = "rd-claim-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

function claimStatusTone(status?: string): "gray" | "green" | "red" | "yellow" | "blue" {
  const s = String(status || "").toLowerCase();
  if (s === "finalized_success") return "green";
  if (["failed", "finalized_revert"].includes(s)) return "red";
  if (["request_broadcasted", "pending_ready", "finalize_broadcasted"].includes(s)) return "blue";
  if (["draft", "not_started"].includes(s)) return "yellow";
  return "gray";
}
function claimStatusLabel(status?: string) {
  const s = String(status || "").toLowerCase();
  if (["draft", "not_started"].includes(s)) return "Claim Ready";
  if (s === "request_broadcasted") return "Request Submitted";
  if (s === "pending_ready") return "Ready To Finalize";
  if (s === "finalize_broadcasted") return "Finalizing";
  if (s === "finalized_success") return "Claimed";
  if (s === "finalized_revert") return "Finalize Reverted";
  if (s === "failed") return "Failed";
  return status || "Unknown";
}
function withdrawStatusLabel(status: WithdrawUiStatus) {
  if (status === "not_started") return "Not Started";
  if (status === "request_submitted") return "Request Submitted";
  if (status === "pending_ready") return "Ready To Withdraw";
  if (status === "finalized") return "USDC Withdrawn";
  return "Unknown";
}
function withdrawStatusTone(status: WithdrawUiStatus): "gray" | "green" | "yellow" | "blue" {
  if (status === "finalized") return "green";
  if (status === "pending_ready" || status === "request_submitted") return "blue";
  if (status === "not_started") return "yellow";
  return "gray";
}
function shortHash(value?: string | null) {
  if (!value) return "—";
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}
function sameAddress(a?: string | null, b?: string | null) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}
function atomicToToken(amountAtomic?: string | number | bigint | null) {
  if (amountAtomic == null) return "—";
  const raw = BigInt(String(amountAtomic));
  const whole = raw / 1000000n;
  const frac = raw % 1000000n;
  if (frac === 0n) return whole.toString();
  return `${whole.toString()}.${frac.toString().padStart(6, "0").replace(/0+$/, "")}`;
}
async function getWalletClients() {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Install MetaMask or another EVM wallet.");
  const walletClient = createWalletClient({ chain: baseSepolia, transport: custom(eth) });
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(BASE_RPC_URL) });
  const [account] = await walletClient.requestAddresses();
  if (!account) throw new Error("Wallet connection failed.");
  if (await walletClient.getChainId() !== baseSepolia.id)
    throw new Error("Please switch wallet network to Base Sepolia.");
  return { walletClient, publicClient, account };
}
function getPayrollId(claim: ClaimRecord): bigint {
  const raw = claim.run_onchain_payroll_id;
  if (raw == null) throw new Error("run_onchain_payroll_id missing");
  return BigInt(raw);
}
function getErrorMessage(e: any): string {
  if (e?.shortMessage) return e.shortMessage;
  if (e?.cause?.shortMessage) return e.cause.shortMessage;
  if (e?.cause?.message) return e.cause.message;
  if (e?.response?.data?.detail) return e.response.data.detail;
  if (e?.response?.data?.error)  return e.response.data.error;
  if (e?.message) return e.message;
  return "Please try again.";
}
function toBytes32Hex(value: string, label: string): `0x${string}` {
  const h = (value.startsWith("0x") ? value : `0x${value}`) as `0x${string}`;
  if (h.length !== 66)
    throw new Error(`${label} must be 32 bytes (66 hex chars incl 0x). Got ${h.length} chars.`);
  return h;
}
function normalizeSigs(sigs: string[], label: string): `0x${string}`[] {
  if (!Array.isArray(sigs) || sigs.length === 0)
    throw new Error(`${label} is empty — server did not return valid attestation signatures.`);
  return sigs.map((s, i) => {
    const h = (s.startsWith("0x") ? s : `0x${s}`) as `0x${string}`;
    if (!/^0x[0-9a-fA-F]*$/.test(h)) throw new Error(`${label}[${i}] is not valid hex: "${s}"`);
    return h;
  });
}

export default function ClaimDetail() {
  useStyles();
  const { claimId } = useParams();
  const toast = useToast();

  // Guard — don't proceed if claimId is missing or invalid
  if (!claimId || claimId === "undefined") {
    return (
      <div className="sh-page pg">
        <div className="pg-bg" />
        <div className="panel">
          <div className="panel-body">
            <p style={{ color:"rgba(252,165,165,0.85)", fontSize:12, margin:0 }}>
              Invalid claim ID. Please go back and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { wallet: contextWallet, connect } = useWallet();
  const [connectedWallet, setConnectedWallet] = React.useState("");

  React.useEffect(() => {
    if (contextWallet) setConnectedWallet(contextWallet);
  }, [contextWallet]);

  const [aclDenied, setAclDenied] = React.useState(false);

  /* withdrawal state */
 const WITHDRAW_KEY = `withdraw_state_claim_${claimId}`;

function loadSaved() {
  try { const r = localStorage.getItem(WITHDRAW_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveState(patch: object) {
  try { localStorage.setItem(WITHDRAW_KEY, JSON.stringify({ ...loadSaved(), ...patch })); } catch {}
}

const [withdrawId,             setWithdrawIdRaw]             = React.useState<number | null>(null);
const [withdrawPending,        setWithdrawPendingRaw]        = React.useState<any>(null);
const [withdrawUiStatus,       setWithdrawUiStatusRaw]       = React.useState<WithdrawUiStatus>("not_started");
const [withdrawRequestTxHash,  setWithdrawRequestTxHashRaw]  = React.useState<string | null>(null);
const [withdrawFinalizeTxHash, setWithdrawFinalizeTxHashRaw] = React.useState<string | null>(null);
const [stateRestored,          setStateRestored]             = React.useState(false);

// Only restore withdrawal state if claim is truly finalized
// For any other status, wipe stale localStorage so new claims start clean
React.useEffect(() => {
  if (stateRestored) return;
  const claim = claimQ.data;
  if (!claim) return;
  if (claim.status === "finalized_success") {
    const saved = loadSaved();
    if (saved) {
      if (saved.withdrawId)             setWithdrawIdRaw(saved.withdrawId);
      if (saved.withdrawPending)        setWithdrawPendingRaw(saved.withdrawPending);
      if (saved.withdrawUiStatus)       setWithdrawUiStatusRaw(saved.withdrawUiStatus);
      if (saved.withdrawRequestTxHash)  setWithdrawRequestTxHashRaw(saved.withdrawRequestTxHash);
      if (saved.withdrawFinalizeTxHash) setWithdrawFinalizeTxHashRaw(saved.withdrawFinalizeTxHash);
    }
  } else {
    localStorage.removeItem(WITHDRAW_KEY);
  }
  setStateRestored(true);
}, [claimQ.data, stateRestored]);

  const setWithdrawId            = (v: number | null)    => { setWithdrawIdRaw(v);            saveState({ withdrawId: v }); };
  const setWithdrawPending       = (v: any)              => { setWithdrawPendingRaw(v);        saveState({ withdrawPending: v }); };
  const setWithdrawUiStatus      = (v: WithdrawUiStatus) => { setWithdrawUiStatusRaw(v);       saveState({ withdrawUiStatus: v }); };
  const setWithdrawRequestTxHash = (v: string | null)    => { setWithdrawRequestTxHashRaw(v);  saveState({ withdrawRequestTxHash: v }); };
  const setWithdrawFinalizeTxHash= (v: string | null)    => { setWithdrawFinalizeTxHashRaw(v); saveState({ withdrawFinalizeTxHash: v }); };

  const claimQ = useClaim(claimId);
  const claim  = claimQ.data;

  const requestClaim        = useRequestClaim(claimId, claim?.employee_address);
  const syncPending         = useSyncPending(claimId, claim?.employee_address);
  const finalizeClaim       = useFinalizeClaim(claimId, claim?.employee_address);
  const createWithdraw      = useCreateWithdraw();
  const requestWithdraw     = useRequestWithdraw();
  const syncWithdrawPending = useSyncWithdrawPending();
  const finalizeWithdraw    = useFinalizeWithdraw();

  /* ── AUTO-POLL ── */
  const pollUntilRef = React.useRef<number>(0);
  const [activePoll, setActivePoll] = React.useState(false);

  function startPolling() {
    pollUntilRef.current = Date.now() + 90_000;
    setActivePoll(true);
  }

  const claimStatus = String(claim?.status || "").toLowerCase();
  const isStatusPending = CLAIM_PENDING_STATUSES.has(claimStatus);
  const shouldPoll = activePoll || isStatusPending;

  React.useEffect(() => {
    if (!shouldPoll) return;
    const id = setInterval(() => {
      if (activePoll && Date.now() > pollUntilRef.current) setActivePoll(false);
      claimQ.refetch();
    }, 2500);
    return () => clearInterval(id);
  }, [shouldPoll]);

  if (claimQ.isLoading) return (
    <div className="sh-page pg"><div className="pg-bg" />
      <div className="panel"><div className="panel-body"><SkeletonLoader lines={8} /></div></div>
    </div>
  );
  if (claimQ.isError || !claimQ.data) return (
    <div className="sh-page pg"><div className="pg-bg" />
      <div className="panel"><div className="panel-body">
        <p style={{ color:"rgba(252,165,165,0.85)", fontSize:12, margin:0 }}>{getErrorMessage(claimQ.error)}</p>
      </div></div>
    </div>
  );

  const status    = String(claim.status || "").toLowerCase();
  const runStatus = String(claim.run_status || "").toLowerCase();
  const canRequest  = ["draft", "not_started"].includes(status) && runStatus === "active";
  const canSync     = status === "request_broadcasted";
  const canFinalize = status === "pending_ready";
  const isComplete  = status === "finalized_success";
  const isAwaitingActivation = ["draft", "not_started"].includes(status) && runStatus !== "active";
  const withdrawAmountAtomic  = claim.employee_amount_atomic || null;
  const withdrawAmountDisplay = atomicToToken(withdrawAmountAtomic);
  const walletMatchesEmployee = !connectedWallet || sameAddress(connectedWallet, claim.employee_address);
  const claimStep1Done = ["request_broadcasted","pending_ready","finalize_broadcasted","finalized_success"].includes(status);
  const claimStep2Done = ["pending_ready","finalize_broadcasted","finalized_success"].includes(status);
  const claimStep3Done = ["finalize_broadcasted","finalized_success"].includes(status);
  const disableClaimRequest  = !canRequest  || requestClaim.isPending  || !walletMatchesEmployee || isComplete;
  const disableClaimSync     = !canSync     || syncPending.isPending    || isComplete;
  const disableClaimFinalize = !canFinalize || finalizeClaim.isPending  || isComplete;
  const disableWithdrawStart    = !isComplete || !withdrawAmountAtomic || createWithdraw.isPending || requestWithdraw.isPending || withdrawUiStatus !== "not_started";
  const disableWithdrawSync     = !withdrawId || syncWithdrawPending.isPending || withdrawUiStatus !== "request_submitted";
  const disableWithdrawFinalize = !withdrawPending || finalizeWithdraw.isPending || withdrawUiStatus !== "pending_ready";

  async function requireEmployeeWallet() {
    if (contextWallet && sameAddress(contextWallet, claim.employee_address)) {
      const eth = (window as any).ethereum;
      const wc = createWalletClient({ chain: baseSepolia, transport: custom(eth) });
      const pc = createPublicClient({ chain: baseSepolia, transport: http(BASE_RPC_URL) });
      return { walletClient: wc, publicClient: pc, account: contextWallet as `0x${string}` };
    }
    const clients = await getWalletClients();
    setConnectedWallet(clients.account);
    if (!sameAddress(clients.account, claim.employee_address))
      throw new Error(`Wrong wallet. This claim belongs to ${claim.employee_address}.`);
    return clients;
  }

  async function handleRequestClaim() {
    try {
      if (runStatus !== "active") throw new Error("Payroll is awaiting employer activation.");
      const { walletClient, publicClient, account } = await requireEmployeeWallet();
      const payrollId = getPayrollId(claim);
      const { encodeFunctionData } = await import("viem");
      const calldata = encodeFunctionData({ abi: PAYROLL_VAULT_ABI, functionName: "requestClaim", args: [payrollId] });
      const nonce = await publicClient.getTransactionCount({ address: account, blockTag: "pending" });
      const txHash = await walletClient.sendTransaction({ account, to: PAYROLL_VAULT_ADDRESS, data: calldata, nonce, chain: baseSepolia });
      await requestClaim.mutateAsync({ tx_hash: txHash, sender: account, nonce });
      toast.push({ kind: "success", title: "Claim request submitted", message: "Waiting for blockchain confirmation…" });
      startPolling();
      await claimQ.refetch();
    } catch (e: any) { toast.push({ kind: "error", title: "Could not request claim", message: getErrorMessage(e) }); }
  }

  async function handleSyncPending() {
    try {
      await syncPending.mutateAsync();
      toast.push({ kind: "success", title: "Claim updated", message: "Pending claim data loaded." });
      startPolling();
      await claimQ.refetch();
    } catch (e: any) { toast.push({ kind: "error", title: "Could not sync claim", message: getErrorMessage(e) }); }
  }

  async function handleFinalizeClaim() {
    setAclDenied(false);
    try {
      const { walletClient, publicClient, account } = await requireEmployeeWallet();
      const payrollId = getPayrollId(claim);
      const handle    = claim.pending_ok_handle || "";
      const requestId = claim.request_id || claim.pending_request_id || "";
      if (!handle)    throw new Error("pending_ok_handle missing — retry Step 2 (Sync Claim Status).");
      if (!requestId) throw new Error("requestId missing — retry Sync Claim Status.");
      const normalizedHandle = (handle.startsWith("0x") ? handle : `0x${handle}`) as `0x${string}`;
      if (normalizedHandle.length !== 66) throw new Error(`handle must be 32 bytes, got ${normalizedHandle.length}`);
      toast.push({ kind: "success", title: "Building payload…", message: "Fetching attestation payload from server." });
      const { payload: eip712Payload, sessionId } = await fetchAttestationPayload(normalizedHandle, account);
      toast.push({ kind: "success", title: "Signature required", message: "MetaMask will ask you to approve the decryption request." });
      const signature = await signAttestationPayload(walletClient, account, eip712Payload);
      toast.push({ kind: "success", title: "Calling server…", message: "Getting KMS attestation." });
      const attRes = await fetch(`${ENCRYPTOR_BASE_URL}/claim-ok-attestation`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, handle: normalizedHandle, signature, userAddress: account, chainId: 84532 }),
      });
      const attData = await attRes.json();
      if (!attRes.ok) {
        const msg = attData?.error || "Could not get claim attestation from server";
        if (msg.toLowerCase().includes("acl") || msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("disallowed")) {
          setAclDenied(true);
          throw new Error("ACL Permission Denied — employer must re-run Encrypt & Upload (Step 3) and Finalize Allocations (Step 4).");
        }
        throw new Error(`Server error: ${msg}`);
      }
      const { okAtt, okSigs } = attData as { okAtt: { handle: string; value: string }; okSigs: string[] };
      const safeOkAtt = { handle: toBytes32Hex(String(okAtt.handle), "okAtt.handle"), value: toBytes32Hex(String(okAtt.value), "okAtt.value") };
      const safeOkSigs = normalizeSigs(okSigs, "okSigs");
      const normalizedClaimRequestId = toBytes32Hex(String(requestId), "claim requestId");
      toast.push({ kind: "success", title: "Submitting transaction…", message: "Sending finalizeClaim to Base Sepolia." });
      const { encodeFunctionData } = await import("viem");
      const claimCalldata = encodeFunctionData({ abi: PAYROLL_VAULT_ABI, functionName: "finalizeClaim", args: [payrollId, safeOkAtt, safeOkSigs, normalizedClaimRequestId] });
      const nonce = await publicClient.getTransactionCount({ address: account, blockTag: "pending" });
      const txHash = await walletClient.sendTransaction({ account, to: PAYROLL_VAULT_ADDRESS, data: claimCalldata, nonce, chain: baseSepolia });
      await finalizeClaim.mutateAsync({ tx_hash: txHash, sender: account, nonce, okAtt: safeOkAtt, okSigs: safeOkSigs, requestId: normalizedClaimRequestId });
      toast.push({ kind: "success", title: "Claim finalization submitted", message: "Waiting for blockchain confirmation." });
      startPolling();
      await claimQ.refetch();
    } catch (e: any) { toast.push({ kind: "error", title: "Could not finalize claim", message: getErrorMessage(e) }); }
  }

  async function handleStartWithdraw() {
    try {
      if (!withdrawAmountAtomic) throw new Error("Claim amount missing.");
      const { account } = await requireEmployeeWallet();
      const created = await createWithdraw.mutateAsync(account);
      setWithdrawId(created.id);
      const result = await requestWithdraw.mutateAsync({ withdrawId: created.id, amountAtomic: withdrawAmountAtomic });
      setWithdrawRequestTxHash(result.tx_hash);
      setWithdrawUiStatus("request_submitted");
      toast.push({ kind: "success", title: "Withdrawal requested", message: "Now sync the pending withdrawal state." });
    } catch (e: any) { toast.push({ kind: "error", title: "Could not start withdrawal", message: getErrorMessage(e) }); }
  }

  async function handleSyncWithdraw() {
    try {
      if (!withdrawId) throw new Error("Withdrawal not started yet.");
      const pending = await syncWithdrawPending.mutateAsync({ withdrawId });
      setWithdrawPending(pending);
      setWithdrawUiStatus("pending_ready");
      toast.push({ kind: "success", title: "Withdrawal synced" });
    } catch (e: any) { toast.push({ kind: "error", title: "Could not sync withdrawal", message: getErrorMessage(e) }); }
  }

  async function handleFinalizeWithdraw() {
    try {
      if (!withdrawId)      throw new Error("Withdrawal not started yet.");
      if (!withdrawPending) throw new Error("Sync withdrawal first.");
      const { walletClient, publicClient, account } = await requireEmployeeWallet();
      const amountHandle = withdrawPending.pendingAmountHandle;
      const okHandle     = withdrawPending.pendingOkHandle;
      const requestId    = withdrawPending.pendingRequestId;
      if (!amountHandle) throw new Error("pendingAmountHandle missing — sync withdrawal again.");
      if (!okHandle)     throw new Error("pendingOkHandle missing — sync withdrawal again.");
      if (!requestId)    throw new Error("pendingRequestId missing — sync withdrawal again.");
      toast.push({ kind: "success", title: "Building payload…", message: "Fetching withdrawal attestation payload." });
      const { payload: eip712Payload, sessionId } = await fetchWithdrawPayload(amountHandle, okHandle, account);
      toast.push({ kind: "success", title: "Signature required", message: "MetaMask will ask you to approve the withdrawal." });
      const signature = await signAttestationPayload(walletClient, account, eip712Payload);
      toast.push({ kind: "success", title: "Getting attestation…", message: "Server calling KMS for withdrawal proof." });
      const attRes = await fetch(`${ENCRYPTOR_BASE_URL}/withdraw-attestations`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, signature, userAddress: account, amountHandle, okHandle, chainId: 84532 }),
      });
      const attData = await attRes.json();
      if (!attRes.ok) throw new Error(attData?.error || "Could not get withdrawal attestation");
      const { amountAtt, amountSigs, okAtt, okSigs } = attData as { amountAtt: { handle: string; value: string }; amountSigs: string[]; okAtt: { handle: string; value: string }; okSigs: string[] };
      const normalizedRequestId = toBytes32Hex(String(requestId), "requestId");
      const safeAmountSigs = normalizeSigs(amountSigs, "amountSigs");
      const safeOkSigs     = normalizeSigs(okSigs, "okSigs");
      const safeAmountAtt  = { handle: toBytes32Hex(String(amountAtt.handle), "amountAtt.handle"), value: toBytes32Hex(String(amountAtt.value), "amountAtt.value") };
      const safeOkAtt      = { handle: toBytes32Hex(String(okAtt.handle), "okAtt.handle"), value: toBytes32Hex(String(okAtt.value), "okAtt.value") };
      if (!SWAP_ROUTER_ADDRESS || SWAP_ROUTER_ADDRESS === "undefined" as any)
        throw new Error("VITE_SWAPROUTER_ADDRESS is not set in your .env file.");
      toast.push({ kind: "success", title: "Submitting transaction…", message: "Finalizing withdrawal on Base Sepolia." });
      const { encodeFunctionData } = await import("viem");
      const calldata = encodeFunctionData({ abi: SWAP_ROUTER_ABI, functionName: "finalizeWithdraw", args: [safeAmountAtt, safeAmountSigs, safeOkAtt, safeOkSigs, normalizedRequestId] });
      const nonce = await publicClient.getTransactionCount({ address: account, blockTag: "pending" });
      const txHash = await walletClient.sendTransaction({ account, to: SWAP_ROUTER_ADDRESS, data: calldata, nonce, chain: baseSepolia });
      setWithdrawFinalizeTxHash(txHash);
      setWithdrawUiStatus("finalized");
      toast.push({ kind: "success", title: "Withdrawal finalized", message: "USDC transferred to your wallet." });
      try { await finalizeWithdraw.mutateAsync({ withdrawId, pending: withdrawPending, tx_hash: txHash }); } catch {}
    } catch (e: any) { toast.push({ kind: "error", title: "Could not finalize withdrawal", message: getErrorMessage(e) }); }
  }

  const stepCircle = (done: boolean, label: string) => (
    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:".06em", width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:done?"rgba(26,255,140,.1)":"rgba(210,222,255,.04)", border:`1px solid ${done?"rgba(26,255,140,.3)":"rgba(210,222,255,.08)"}`, color:done?"rgba(26,255,140,.8)":"rgba(210,222,255,.2)" }}>
      {done ? "✓" : label}
    </span>
  );

  return (
    <div className="sh-page pg">
      <div className="pg-bg" />
      <div className="pg-hero">
        <div className="pg-hero-l">
          <div className="pg-tag"><span className="pg-tag-dot" />Employee · Claim #{claimId} · Run #{claim.run}</div>
          <h1 className="pg-h1">
            {isComplete && withdrawUiStatus === "finalized" ? <><span>All</span><br /><span className="blue">Done</span></> : isComplete ? <><span>Claim</span><br /><span className="blue">Convert</span></> : <><span>Claim</span><br /><span className="blue">Payment</span></>}
          </h1>
          <div style={{ display:"flex", alignItems:"center", gap:".65rem", flexWrap:"wrap", marginTop:".75rem" }}>
            <StatusBadge tone={claimStatusTone(claim.status)}>{claimStatusLabel(claim.status)}</StatusBadge>
            {isComplete && withdrawUiStatus !== "finalized" && <StatusBadge tone={withdrawStatusTone(withdrawUiStatus) as any}>{withdrawStatusLabel(withdrawUiStatus)}</StatusBadge>}
            {withdrawUiStatus === "finalized" && <span className="chip chip-green">✓ USDC Received</span>}
            <span className="chip chip-gray">{withdrawAmountDisplay} cUSDC</span>
            <span className="chip chip-gray">Run #{claim.run_onchain_payroll_id ?? "—"}</span>
            {shouldPoll && (
              <span className="cl-polling">
                <span className="cl-polling-dot" />
                Confirming…
              </span>
            )}
          </div>
        </div>
        <div className="pg-hero-r">
          <Link to="/employee/claims" className="pg-back">← Claims</Link>
        </div>
      </div>

      {/* metadata strip */}
      <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:6, padding:"10px 16px", background:"rgba(47,107,255,0.03)", border:"1px solid rgba(47,107,255,0.1)", borderRadius:8, marginBottom:"1.25rem", position:"relative", zIndex:1 }}>
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:".1em", color:"rgba(210,222,255,.3)", textTransform:"uppercase" }}>Wallet</span>
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(47,107,255,.7)", background:"rgba(47,107,255,.08)", border:"1px solid rgba(47,107,255,.16)", padding:"2px 8px", borderRadius:4 }}>
          {claim.employee_address ? `${claim.employee_address.slice(0,8)}…${claim.employee_address.slice(-6)}` : "—"}
        </span>
        {claim.request_tx_hash && <><span style={{ width:1, height:14, background:"rgba(47,107,255,.15)", flexShrink:0, margin:"0 4px" }} /><span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:".1em", color:"rgba(210,222,255,.3)", textTransform:"uppercase" }}>Req TX</span><span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(210,222,255,.5)" }}>{shortHash(claim.request_tx_hash)}</span></>}
        {claim.finalize_tx_hash && <><span style={{ width:1, height:14, background:"rgba(47,107,255,.1)", flexShrink:0, margin:"0 4px" }} /><span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:".1em", color:"rgba(210,222,255,.3)", textTransform:"uppercase" }}>Fin TX</span><span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(210,222,255,.5)" }}>{shortHash(claim.finalize_tx_hash)}</span></>}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
          {stepCircle(claimStep1Done,"01")}{stepCircle(claimStep2Done,"02")}{stepCircle(claimStep3Done,"03")}
          {stepCircle(["request_submitted","pending_ready","finalized"].includes(withdrawUiStatus),"W1")}
          {stepCircle(["pending_ready","finalized"].includes(withdrawUiStatus),"W2")}
          {stepCircle(withdrawUiStatus==="finalized","W3")}
        </div>
      </div>

      {/* ACL denied banner */}
      {aclDenied && (
        <div style={{ marginBottom:".875rem", padding:"16px 20px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.28)", borderLeft:"3px solid rgba(239,68,68,0.8)", borderRadius:8, position:"relative", zIndex:1 }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:".14em", textTransform:"uppercase", color:"rgba(252,165,165,.6)", marginBottom:8 }}>KMS · ACL Permission Denied</div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(252,165,165,.85)", lineHeight:1.75, marginBottom:12 }}>Your wallet is not authorized to decrypt this salary handle.</div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(210,222,255,.4)", lineHeight:1.8 }}>
            <div style={{ color:"rgba(210,222,255,.55)", fontWeight:700, marginBottom:4 }}>Employer must:</div>
            <div>1 · Re-run <span style={{ color:"rgba(47,107,255,.8)" }}>Step 3 — Encrypt &amp; Upload</span></div>
            <div>2 · Re-run <span style={{ color:"rgba(47,107,255,.8)" }}>Step 4 — Finalize Allocations</span></div>
            <div style={{ marginTop:8, color:"rgba(26,255,140,.5)" }}>After both steps, retry this claim ✓</div>
          </div>
        </div>
      )}

      {/* guards */}
      {!walletMatchesEmployee && connectedWallet && (
        <div className="cl-warn" style={{ marginBottom:".875rem" }}>
          <svg className="cl-warn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,180,50,0.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div className="cl-warn-text">Wrong wallet — connect <strong>{`${claim.employee_address.slice(0,8)}…${claim.employee_address.slice(-6)}`}</strong> via the navbar button to continue.</div>
        </div>
      )}
      {isAwaitingActivation && (
        <div className="cl-warn" style={{ marginBottom:".875rem" }}>
          <svg className="cl-warn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,180,50,0.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          <div className="cl-warn-text">Payroll funded — awaiting employer activation.</div>
        </div>
      )}
      {canFinalize && (
        <div className="cl-warn" style={{ marginBottom:".875rem", background:"rgba(47,107,255,0.04)", borderColor:"rgba(47,107,255,0.2)" }}>
          <svg className="cl-warn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(47,107,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          <div className="cl-warn-text" style={{ color:"rgba(147,197,253,0.85)" }}>
            <strong style={{ color:"rgba(147,197,253,1)" }}>Note:</strong> Your wallet must have been included in the employer's Encrypt &amp; Upload step.
          </div>
        </div>
      )}
      {!!claim.last_error && ["failed","finalized_revert"].includes(status) && (
        <div className="cl-warn" style={{ marginBottom:".875rem", borderColor:"rgba(239,68,68,0.2)", background:"rgba(239,68,68,0.05)" }}>
          <svg className="cl-warn-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <div className="cl-warn-text" style={{ color:"rgba(252,165,165,0.85)" }}>{claim.last_error}</div>
        </div>
      )}

      {/* ALL DONE */}
      {isComplete && withdrawUiStatus === "finalized" && (
        <div style={{ position:"relative", zIndex:1 }}>
          <div className="panel">
            <div className="panel-scan" />
            <div style={{ padding:"44px 40px 36px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:18 }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(26,255,140,0.08)", border:"1px solid rgba(26,255,140,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(26,255,140,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"clamp(1.5rem,3vw,2rem)", color:"rgba(210,222,255,.97)", letterSpacing:"-.025em", lineHeight:1 }}>All Steps Complete</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(210,222,255,.32)", letterSpacing:".04em", lineHeight:1.75, maxWidth:480 }}>Claim finalized and cUSDC converted to USDC. All transactions confirmed on Base Sepolia.</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
                <span className="chip chip-green">✓ Claim Finalized</span>
                <span className="chip chip-green">✓ USDC Withdrawn</span>
                <span className="chip chip-blue">{withdrawAmountDisplay} USDC</span>
              </div>
            </div>
            <div style={{ borderTop:"1px solid rgba(47,107,255,0.1)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, background:"rgba(47,107,255,0.08)" }}>
              {[
                { label:"Claim · Request TX",       hash:claim.request_tx_hash,  color:"rgba(47,107,255,.8)" },
                { label:"Claim · Finalize TX",      hash:claim.finalize_tx_hash, color:"rgba(26,255,140,.75)" },
                { label:"Withdrawal · Request TX",  hash:withdrawRequestTxHash,  color:"rgba(47,107,255,.8)" },
                { label:"Withdrawal · Finalize TX", hash:withdrawFinalizeTxHash, color:"rgba(26,255,140,.75)" },
              ].map((tx,i) => (
                <div key={i} style={{ background:"rgb(8,11,20)", padding:"18px 24px", borderTop:i>=2?"1px solid rgba(47,107,255,0.08)":undefined }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(210,222,255,.25)", marginBottom:8 }}>{tx.label}</div>
                  {tx.hash ? <a href={`https://sepolia.basescan.org/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, fontFamily:"'Space Mono',monospace", fontSize:11, color:tx.color, textDecoration:"none" }}>{shortHash(tx.hash)}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>
                  : <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(210,222,255,.2)" }}>—</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTION GRID */}
      {withdrawUiStatus !== "finalized" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", alignItems:"start", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:8, borderBottom:"1px solid rgba(47,107,255,0.08)" }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:".16em", textTransform:"uppercase", color:"rgba(47,107,255,.55)" }}>Claim Steps</span>
              {isComplete && <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(26,255,140,.65)" }}>— All done ✓</span>}
            </div>
            {[
              { num:"01", done:claimStep1Done, active:canRequest,  title:"Request Claim",     desc:runStatus==="active"?"Submit your claim request to PayrollVault.":"Payroll must be activated by employer first.", disable:disableClaimRequest,  loading:requestClaim.isPending,  label:"Request",  onClick:handleRequestClaim },
              { num:"02", done:claimStep2Done, active:canSync,     title:"Sync Claim Status", desc:"Load pending claim data after request confirmation.",                                                                disable:disableClaimSync,     loading:syncPending.isPending,   label:"Sync",     onClick:handleSyncPending },
              { num:"03", done:claimStep3Done, active:canFinalize, title:"Finalize Claim",    desc:"Your wallet signs a decryption request. Server calls KMS with your signature.",                                    disable:disableClaimFinalize, loading:finalizeClaim.isPending, label:"Finalize", onClick:handleFinalizeClaim },
            ].map(s => (
              <div key={s.num} className={`cl-step${s.done?" done-step":s.active?" active-step":""}`}>
                <div className="cl-step-inner">
                  <div className="cl-step-num">{s.done?"✓":shouldPoll&&s.active?"…":s.num}</div>
                  <div className="cl-step-body"><div className="cl-step-title">{s.title}</div><div className="cl-step-desc">{s.desc}</div></div>
                  <button className="pg-btn" style={{ padding:".55rem 1rem", fontSize:".65rem", flexShrink:0 }} disabled={s.disable} onClick={s.onClick}>
                    {s.loading?"…":s.done?"Done":s.label}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:8, borderBottom:"1px solid rgba(47,107,255,0.08)" }}>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:".16em", textTransform:"uppercase", color:isComplete?"rgba(47,107,255,.55)":"rgba(210,222,255,.18)" }}>USDC Withdrawal</span>
              {!isComplete && <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"rgba(210,222,255,.2)" }}>— unlocks after claim</span>}
            </div>
            {[
              { num:"W1", done:["request_submitted","pending_ready","finalized"].includes(withdrawUiStatus), active:isComplete&&withdrawUiStatus==="not_started",   title:"Request Withdrawal",  desc:isComplete?"Initiate cUSDC → USDC via SwapRouter.":"Complete your claim first.", disable:disableWithdrawStart,    loading:createWithdraw.isPending||requestWithdraw.isPending, label:withdrawUiStatus!=="not_started"&&isComplete?"Done":!isComplete?"Locked":"Request", onClick:handleStartWithdraw },
              { num:"W2", done:["pending_ready","finalized"].includes(withdrawUiStatus),                    active:withdrawUiStatus==="request_submitted",           title:"Sync Withdrawal",     desc:"Load pending withdrawal state from the network.",        disable:disableWithdrawSync,     loading:syncWithdrawPending.isPending,                          label:["pending_ready","finalized"].includes(withdrawUiStatus)?"Done":"Sync",            onClick:handleSyncWithdraw },
              { num:"W3", done:withdrawUiStatus==="finalized",                                              active:withdrawUiStatus==="pending_ready",               title:"Finalize Withdrawal", desc:"Submit attestation to complete the USDC transfer.",      disable:disableWithdrawFinalize, loading:finalizeWithdraw.isPending,                             label:"Finalize",                                                                        onClick:handleFinalizeWithdraw },
            ].map(s => (
              <div key={s.num} className={`cl-step${s.done?" done-step":s.active?" active-step":""}`} style={{ opacity:isComplete?1:0.35 }}>
                <div className="cl-step-inner">
                  <div className="cl-step-num">{s.done?"✓":s.num}</div>
                  <div className="cl-step-body"><div className="cl-step-title">{s.title}</div><div className="cl-step-desc">{s.desc}</div></div>
                  <button className="pg-btn" style={{ padding:".55rem 1rem", fontSize:".65rem", flexShrink:0 }} disabled={s.disable} onClick={s.onClick}>
                    {s.loading?"…":s.label}
                  </button>
                </div>
              </div>
            ))}
            {isComplete && (withdrawRequestTxHash||withdrawFinalizeTxHash) && (
              <div style={{ padding:"12px 14px", borderRadius:7, background:"rgba(47,107,255,0.04)", border:"1px solid rgba(47,107,255,0.12)", display:"flex", flexDirection:"column", gap:6 }}>
                {withdrawRequestTxHash && <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, textTransform:"uppercase", color:"rgba(210,222,255,.28)" }}>Request TX</span><span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(210,222,255,.55)" }}>{shortHash(withdrawRequestTxHash)}</span></div>}
                {withdrawFinalizeTxHash && <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, textTransform:"uppercase", color:"rgba(210,222,255,.28)" }}>Finalize TX</span><span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"rgba(26,255,140,.7)" }}>{shortHash(withdrawFinalizeTxHash)}</span></div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}