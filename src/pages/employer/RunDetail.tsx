import React from "react";
import { useParams, Link } from "react-router-dom";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";

import SkeletonLoader from "../../ui/SkeletonLoader";
import StatusBadge from "../../ui/StatusBadge";
import Modal from "../../ui/Modal";
import { useToast } from "../../ui/Toast";

import { useRun, useUploadAllocations } from "../../hooks/useRuns";
import { useTemplate, useTemplatePreviewRuns } from "../../hooks/useTemplates";
import { useRunFundingQuote } from "../../hooks/useRunFundingQuote";
import { useCreateOnchainPayroll } from "../../hooks/useCreateOnchainPayroll";
import { useEncryptAllocations } from "../../hooks/useEncryptAllocations";
import { useFinalizeAllocations } from "../../hooks/useFinalizeAllocations";
import { useFundPayroll, useActivatePayroll } from "../../hooks/useFundPayroll";

import AllocationTable from "../../features/runs/AllocationTable";
import CSVUploader from "../../features/runs/CSVUploader";
import { isValidAddress, parseToAtomic } from "../../features/runs/amounts";
import EmpFooter from "../../ui/EmpFooter";
import "../../styles/employer-pages.css";

const USDC_DECIMALS = 6;
const PAYROLL_VAULT_ADDRESS = import.meta.env.VITE_PAYROLLVAULT_ADDRESS as `0x${string}`;

const payrollVaultAbi = [
  { type:"function", name:"createPayroll", stateMutability:"nonpayable",
    inputs:[{name:"token",type:"address"},{name:"deadline",type:"uint64"},{name:"employeeCount",type:"uint32"}], outputs:[] },
  { type:"function", name:"finalizeAllocations", stateMutability:"nonpayable",
    inputs:[{name:"payrollId",type:"uint256"}], outputs:[] },
  { type:"function", name:"activatePayroll", stateMutability:"nonpayable",
    inputs:[{name:"payrollId",type:"uint256"}], outputs:[] },
] as const;

/* ── Statuses that mean "tx submitted, waiting for backend to confirm" ── */
const PENDING_STATUSES = new Set([
  "creating",
  "alloc_uploading",
  "alloc_finalizing",
  "funding",
  "activating",
]);

/* ── utils ── */
function dedupe(rows: any[]) {
  const seen = new Set<string>();
  return rows.filter(r => {
    const k = (r.walletAddress||"").trim().toLowerCase();
    if (!k) return false;
    if (seen.has(k)) throw new Error(`Duplicate wallet: ${r.walletAddress}`);
    seen.add(k); return true;
  });
}
function err(e: any) {
  return e?.response?.data?.detail || e?.response?.data?.error || e?.message || "Please try again.";
}
async function getWalletClients() {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet found. Install MetaMask.");
  const wc = createWalletClient({ chain: baseSepolia, transport: custom(eth) });
  const pc = createPublicClient({ chain: baseSepolia, transport: http() });
  const [account] = await wc.requestAddresses();
  if (!account) throw new Error("Wallet connection failed.");
  if (await wc.getChainId() !== baseSepolia.id)
    throw new Error("Please switch to Base Sepolia.");
  return { walletClient: wc, publicClient: pc, account };
}
function shortTx(h?: string|null) {
  if (!h) return "—";
  return `${h.slice(0,8)}…${h.slice(-6)}`;
}

/* ═══════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap');

.pg *, .pg *::before, .pg *::after { box-sizing: border-box; }

/* ── page shell ── */
.pg {
  min-height: 100vh;
  background: rgb(3,5,9);
  color: rgba(210,222,255,0.88);
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  position: relative;
}

.pg-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 60% 50% at 80% 15%, rgba(47,107,255,0.08) 0%, transparent 70%),
    radial-gradient(ellipse 35% 40% at 5%  85%, rgba(26,255,140,0.03) 0%, transparent 70%);
}

.pg-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  padding: 2.5rem 0 2rem;
  position: relative;
  z-index: 1;
}

.pg-hero-l { flex: 1; }
.pg-hero-r {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding-top: .35rem;
  flex-shrink: 0;
}

.pg-tag {
  display: flex;
  align-items: center;
  gap: .55rem;
  font-family: 'Space Mono', monospace;
  font-size: .6rem;
  letter-spacing: .18em;
  color: rgba(47,107,255,0.7);
  text-transform: uppercase;
  margin-bottom: 1rem;
}
.pg-tag-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(47,107,255,0.8);
  box-shadow: 0 0 7px rgba(47,107,255,0.55);
  flex-shrink: 0;
}

.pg-h1 {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: clamp(2.4rem, 5.5vw, 5rem);
  letter-spacing: -0.035em;
  line-height: 0.93;
  color: rgba(210,222,255,0.97);
  margin: 0 0 .75rem;
}
.pg-h1 .blue {
  color: rgba(47,107,255,0.95);
  display: block;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .07em;
}
.chip-gray {
  background: rgba(210,222,255,0.05);
  border: 1px solid rgba(210,222,255,0.13);
  color: rgba(210,222,255,0.5);
}
.chip-blue {
  background: rgba(47,107,255,0.08);
  border: 1px solid rgba(47,107,255,0.26);
  color: rgba(47,107,255,0.88);
}
.chip-green {
  background: rgba(26,255,140,0.07);
  border: 1px solid rgba(26,255,140,0.25);
  color: rgba(26,255,140,0.85);
}

.wallet-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  background: rgba(47,107,255,0.85);
  border: 1px solid rgba(47,107,255,1);
  border-radius: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(210,222,255,0.97);
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
}
.wallet-btn:hover {
  background: rgba(47,107,255,1);
  box-shadow: 0 0 18px rgba(47,107,255,0.3);
}
.wallet-btn.connected {
  background: rgba(26,255,140,0.1);
  border-color: rgba(26,255,140,0.35);
  color: rgba(26,255,140,0.9);
}
.wallet-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(210,222,255,0.5);
  flex-shrink: 0;
}
.wallet-btn.connected .wallet-dot {
  background: rgba(26,255,140,0.9);
  box-shadow: 0 0 6px rgba(26,255,140,0.65);
}

.pg-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  border: 1px solid rgba(210,222,255,0.13);
  border-radius: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: .1em;
  color: rgba(210,222,255,0.45);
  text-decoration: none;
  white-space: nowrap;
  transition: all .2s;
}
.pg-back:hover {
  border-color: rgba(210,222,255,0.28);
  color: rgba(210,222,255,0.78);
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  border: 1px solid rgba(47,107,255,0.12);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(47,107,255,0.07);
  gap: 1px;
  position: relative;
  z-index: 1;
}
.stat-cell {
  background: rgb(8,11,20);
  padding: 22px 24px 20px;
}
.stat-v {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 19px;
  color: rgba(47,107,255,0.9);
  letter-spacing: -0.025em;
  line-height: 1;
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.stat-v em {
  font-family: 'Syne', sans-serif;
  font-style: normal;
  font-weight: 800;
  font-size: 12px;
  color: rgba(47,107,255,0.6);
}
.stat-l {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: .15em;
  color: rgba(210,222,255,0.24);
  text-transform: uppercase;
  margin-top: 8px;
}

.panel {
  background: rgb(8,11,20);
  border: 1px solid rgba(47,107,255,0.14);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}
.panel-scan {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(47,107,255,0.55), transparent);
  animation: pg-scan 4s ease-in-out infinite;
}
@keyframes pg-scan {
  0%   { opacity:0; transform:scaleX(0); transform-origin:left; }
  50%  { opacity:1; transform:scaleX(1); transform-origin:left; }
  100% { opacity:0; transform:scaleX(1); transform-origin:right; }
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 16px;
  border-bottom: 1px solid rgba(47,107,255,0.09);
}
.panel-title {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 13px;
  color: rgba(210,222,255,0.85);
  letter-spacing: .02em;
}
.panel-body { padding: 20px 24px; }
.panel-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 16px 24px;
  border-top: 1px solid rgba(47,107,255,0.09);
  background: rgba(47,107,255,0.02);
}

.run-steps {
  display: grid;
  grid-template-columns: repeat(6,1fr);
  gap: 10px;
}
.run-step {
  background: rgb(3,5,9);
  border: 1px solid rgba(47,107,255,0.1);
  border-radius: 8px;
  padding: 18px 10px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: all .25s;
}
.run-step.rs-active {
  border-color: rgba(47,107,255,0.5);
  background: rgba(47,107,255,0.05);
}
.run-step.rs-done {
  border-color: rgba(26,255,140,0.2);
  background: rgba(26,255,140,0.02);
}
.run-step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(210,222,255,0.1);
  background: rgba(210,222,255,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  color: rgba(210,222,255,0.25);
  flex-shrink: 0;
  transition: all .25s;
}
.run-step.rs-active .run-step-icon {
  border-color: rgba(47,107,255,0.55);
  background: rgba(47,107,255,0.12);
  color: rgba(47,107,255,0.9);
  box-shadow: 0 0 14px rgba(47,107,255,0.2);
}
.run-step.rs-done .run-step-icon {
  border-color: rgba(26,255,140,0.4);
  background: rgba(26,255,140,0.08);
  box-shadow: 0 0 10px rgba(26,255,140,0.15);
}
.run-step-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(210,222,255,0.22);
  text-align: center;
  transition: color .25s;
}
.run-step.rs-active .run-step-label { color: rgba(47,107,255,0.7); }
.run-step.rs-done   .run-step-label { color: rgba(26,255,140,0.6); }

.action-card {
  background: rgb(8,11,20);
  border: 1px solid rgba(47,107,255,0.1);
  border-left: 3px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: all .25s;
}
.action-card.active-step {
  border-color: rgba(47,107,255,0.2);
  border-left-color: rgba(47,107,255,0.85);
  background: rgba(47,107,255,0.04);
}
.action-card.done-step {
  border-color: rgba(26,255,140,0.12);
  border-left-color: rgba(26,255,140,0.5);
}
.action-card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
}
.action-num {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgba(210,222,255,0.1);
  background: rgba(210,222,255,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: rgba(210,222,255,0.25);
  flex-shrink: 0;
  transition: all .25s;
}
.action-card.active-step .action-num {
  border-color: rgba(47,107,255,0.5);
  background: rgba(47,107,255,0.12);
  color: rgba(47,107,255,0.9);
  box-shadow: 0 0 12px rgba(47,107,255,0.18);
}
.action-card.done-step .action-num {
  border-color: rgba(26,255,140,0.35);
  background: rgba(26,255,140,0.07);
  color: rgba(26,255,140,0.85);
}
.action-body { flex: 1; min-width: 0; }
.action-title {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 12px;
  color: rgba(210,222,255,0.88);
  letter-spacing: .01em;
  margin-bottom: 4px;
}
.action-desc {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: rgba(210,222,255,0.32);
  letter-spacing: .02em;
  line-height: 1.55;
}
.action-desc code {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(47,107,255,0.78);
  background: rgba(47,107,255,0.08);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid rgba(47,107,255,0.14);
}

.pg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
  border: none;
  background: rgba(47,107,255,0.85);
  color: rgba(210,222,255,0.97);
}
.pg-btn:hover:not(:disabled) {
  background: rgba(47,107,255,1);
  box-shadow: 0 0 22px rgba(47,107,255,0.3);
}
.pg-btn:disabled {
  opacity: .22;
  cursor: not-allowed;
  pointer-events: none;
}
.pg-btn.green {
  background: rgba(26,255,140,0.12);
  border: 1px solid rgba(26,255,140,0.35);
  color: rgba(26,255,140,0.95);
}
.pg-btn.green:hover:not(:disabled) {
  background: rgba(26,255,140,0.2);
  box-shadow: 0 0 18px rgba(26,255,140,0.14);
}

.dg {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid rgba(47,107,255,0.1);
  border-radius: 8px;
  overflow: hidden;
  gap: 1px;
  background: rgba(47,107,255,0.08);
}
.dg-cell {
  background: rgb(8,11,20);
  padding: 13px 16px;
}
.dg-key {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: .16em;
  color: rgba(210,222,255,0.28);
  text-transform: uppercase;
  margin-bottom: 5px;
}
.dg-val {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  color: rgba(210,222,255,0.75);
  word-break: break-all;
  line-height: 1.4;
}
.dg-val.blue {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 15px;
  letter-spacing: -0.02em;
  color: rgba(47,107,255,0.9);
}
.dg-val.mono  { font-size: 10px; color: rgba(210,222,255,0.55); }

.enc-progress {
  padding: 13px 15px;
  background: rgba(47,107,255,0.04);
  border: 1px solid rgba(47,107,255,0.15);
  border-radius: 7px;
}
.enc-progress-label {
  display: flex;
  justify-content: space-between;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: .1em;
  color: rgba(47,107,255,0.65);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.enc-bar {
  height: 2px;
  background: rgba(47,107,255,0.12);
  border-radius: 1px;
  overflow: hidden;
}
.enc-bar-fill {
  height: 100%;
  background: linear-gradient(90deg,rgba(47,107,255,0.9),rgba(26,255,140,0.8));
  border-radius: 1px;
  transition: width .4s ease;
}
.enc-count {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(210,222,255,0.28);
  letter-spacing: .06em;
  margin-top: 6px;
}

/* polling indicator */
.pg-polling {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(47,107,255,0.65);
}
.pg-polling-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(47,107,255,0.8);
  animation: pgPoll 1s ease-in-out infinite;
}
@keyframes pgPoll {
  0%,100% { opacity: 1; transform: scale(1); }
  50%     { opacity: .3; transform: scale(.5); }
}

/* ── page padding ── */
.sh-page.pg {
  padding-left:  clamp(1rem, 4vw, 2.5rem);
  padding-right: clamp(1rem, 4vw, 2.5rem);
}

/* ══════════════════════════════════════
   RESPONSIVE — matches employer-pages.css
══════════════════════════════════════ */

/* 1024px — tablet landscape */
@media (max-width: 1024px) {
  .pg-h1     { font-size: clamp(2.2rem, 5vw, 4rem); }
  .stat-row  { grid-template-columns: 1fr 1fr; }
  .run-steps { grid-template-columns: repeat(3, 1fr); }
}

/* 860px — tablet portrait */
@media (max-width: 860px) {
  .pg-hero   { flex-direction: column; gap: 1.25rem; padding: 1.75rem 0 1.5rem; }
  .pg-hero-r { padding-top: 0; width: 100%; flex-wrap: wrap; }
  .two-col   { grid-template-columns: 1fr !important; }
}

/* 640px — mobile large */
@media (max-width: 640px) {
  .pg-h1          { font-size: clamp(1.85rem, 8vw, 2.8rem); }
  .stat-row       { grid-template-columns: 1fr 1fr; }
  .stat-cell      { padding: 14px 14px 12px; }
  .stat-v         { font-size: 15px; }
  .stat-l         { font-size: 8px; margin-top: 5px; }
  .run-steps      { grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .run-step       { padding: 12px 6px 10px; gap: 7px; }
  .run-step-icon  { width: 28px; height: 28px; font-size: 10px; }
  .run-step-label { font-size: 8px; letter-spacing: .07em; }
  .panel-head     { padding: 13px 14px 11px; flex-wrap: wrap; gap: .5rem; }
  .panel-body     { padding: 14px; }
  .panel-foot     { padding: 12px 14px; flex-wrap: wrap; }
  .panel-title    { font-size: 12px; }
  .action-card-inner { padding: 13px 14px; gap: 10px; flex-wrap: wrap; }
  .action-num     { width: 32px; height: 32px; font-size: 11px; }
  .action-title   { font-size: 11px; }
  .action-desc    { font-size: 9px; line-height: 1.5; }
  .dg             { grid-template-columns: 1fr; }
  .dg-val         { font-size: 11px; }
  .dg-val.blue    { font-size: 14px; }
  .pg-back        { font-size: .56rem; padding: 7px 11px; }
  .pg-btn         { font-size: .58rem; padding: 8px 14px; }
  .chip           { font-size: .56rem; padding: 3px 10px; }
}

/* 480px — mobile small */
@media (max-width: 480px) {
  .sh-page.pg     { padding-left: .875rem; padding-right: .875rem; }
  .pg-hero        { padding: 1.25rem 0; gap: 1rem; }
  .pg-h1          { font-size: clamp(1.65rem, 9vw, 2.4rem); }
  .stat-row       { grid-template-columns: 1fr 1fr; }
  .stat-cell      { padding: 12px; }
  .stat-v         { font-size: 14px; }
  .run-steps      { grid-template-columns: repeat(2, 1fr); }
  .panel-head     { padding: 11px 12px 10px; }
  .panel-body     { padding: 12px; }
  .panel-foot     { padding: 10px 12px; gap: 8px; }
  .action-card-inner { padding: 12px; gap: 8px; }
  .action-num     { width: 30px; height: 30px; font-size: 10px; }
  .pg-back        { font-size: .54rem; padding: 6px 10px; }
  .pg-btn         { font-size: .56rem; padding: 7px 12px; }
  .chip           { font-size: .54rem; padding: 3px 8px; }
}

/* 360px — mobile xs */
@media (max-width: 360px) {
  .sh-page.pg     { padding-left: .75rem; padding-right: .75rem; }
  .pg-h1          { font-size: clamp(1.5rem, 10vw, 2rem); }
  .run-steps      { grid-template-columns: repeat(2, 1fr); gap: 4px; }
  .run-step       { padding: 10px 4px 8px; }
  .stat-cell      { padding: 10px; }
  .stat-v         { font-size: 13px; }
  .panel-body     { padding: 10px; }
  .dg-cell        { padding: 10px 12px; }
  .action-card-inner { padding: 10px; }
}
`;

function useStyles() {
  React.useEffect(() => {
    const id = "incopayroll-run-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function RunDetail() {
  useStyles();

  const { runId = "" } = useParams();
  const toast = useToast();

  const runQ            = useRun(runId);
  const uploadAlloc     = useUploadAllocations(runId);
  const createOnchain   = useCreateOnchainPayroll(runId);
  const encryptAlloc    = useEncryptAllocations(runId);
  const finalizeAlloc   = useFinalizeAllocations(runId);
  const fundPayroll     = useFundPayroll(runId);
  const activatePayroll = useActivatePayroll(runId);

  const [open, setOpen]         = React.useState(false);
  const [rows, setRows]         = React.useState<any[]>([]);
  const [wallet, setWallet]     = React.useState("");
  const [progress, setProgress] = React.useState({ current: 0, total: 0 });

  const templateId = String(runQ.data?.template ?? "");
  const tplQ    = useTemplate(templateId);
  const previewQ = useTemplatePreviewRuns(templateId, Boolean(templateId));
  const fundingQ = useRunFundingQuote(runId);

  /* ── AUTO-POLL: time-based after any action + status-based ── */
  const status = String(runQ.data?.status || "").toLowerCase();

  // After any action button, poll for up to 90s regardless of status
  const pollUntilRef = React.useRef<number>(0);
  const [activePoll, setActivePoll] = React.useState(false);

  function startPolling() {
    pollUntilRef.current = Date.now() + 90_000;
    setActivePoll(true);
  }

  const isStatusPending = PENDING_STATUSES.has(status);
  const waitingForOnchainId =
    Boolean(runQ.data?.create_tx_hash) && runQ.data?.onchain_payroll_id == null;
  const shouldPoll = activePoll || isStatusPending || waitingForOnchainId;

  React.useEffect(() => {
    if (!shouldPoll) return;
    const id = setInterval(() => {
      if (activePoll && Date.now() > pollUntilRef.current) {
        setActivePoll(false);
      }
      runQ.refetch();
      fundingQ.refetch();
    }, 2500);
    return () => clearInterval(id);
  }, [shouldPoll]);

  /* ── loading / error ── */
  if (runQ.isLoading) return (
    <div className="sh-page pg">
      <div className="pg-bg" />
      <div className="panel"><div className="panel-body"><SkeletonLoader lines={10} /></div></div>
    </div>
  );
  if (runQ.isError) return (
    <div className="sh-page pg">
      <div className="pg-bg" />
      <div className="panel">
        <div className="panel-body">
          <p style={{color:"#fca5a5",fontSize:".84rem"}}>{err(runQ.error)}</p>
        </div>
      </div>
    </div>
  );

  /* ── derived state ── */
  const run          = runQ.data as any;
  const template     = tplQ.data as any;
  const templateName = template?.title ?? `Template #${run.template}`;

  const hasOnchainId    = run.onchain_payroll_id != null;
  const allocationsDone = Number(run.employee_count_u32??0) > 0 && Number(run.required_total_atomic??0) > 0;
  // onchainCreated only true when CONFIRMED (onchain_payroll_id exists), not just tx submitted
  const onchainCreated  = hasOnchainId;
  const txSubmitted     = Boolean(run.create_tx_hash) && !hasOnchainId; // submitted but not yet confirmed
  const payrollSecured  = onchainCreated && ["alloc_uploading","alloc_uploaded","alloc_finalizing","alloc_finalized","funding","funded","active"].includes(status);
  const payrollFinalized = payrollSecured && ["alloc_finalized","funding","funded","active"].includes(status);
  const isFunded        = ["funded","active"].includes(status);
  const isActive        = status === "active";

  // Each step only unlocks when the previous step is fully confirmed
  const canCreateOnchain = allocationsDone && !onchainCreated && !txSubmitted;
  const canSecure        = onchainCreated && !payrollSecured;
  const canFinalize      = payrollSecured && !payrollFinalized && status === "alloc_uploaded";
  const canFund          = hasOnchainId && status === "alloc_finalized";
  const canActivate      = hasOnchainId && status === "funded";

  const currentTotal   = Number(run.required_total_atomic??0) / 1_000_000;
  const cycleCount     = Math.max(Number(previewQ.data?.future_count??1), 1);
  const scheduleBudget = currentTotal * cycleCount;
  const fundingTxHash  = run.fund_tx_hash || run.funding_tx_hash || null;

  /* ── steps config ── */
  const steps = [
    { label: "Allocations", done: allocationsDone,  active: !allocationsDone },
    { label: "On-Chain",    done: onchainCreated,   active: allocationsDone && !onchainCreated },
    { label: "Encrypt",     done: payrollSecured,   active: onchainCreated && !payrollSecured },
    { label: "Finalize",    done: payrollFinalized, active: payrollSecured && !payrollFinalized },
    { label: "Fund",        done: isFunded,         active: canFund },
    { label: "Active",      done: isActive,         active: canActivate },
  ];

  /* ── handlers ── */
  async function connectWallet() {
    try { const {account} = await getWalletClients(); setWallet(account); toast.push({kind:"success",title:"Wallet connected"}); }
    catch(e:any) { toast.push({kind:"error",title:"Connection failed",message:err(e)}); }
  }

  async function saveAllocations() {
    let cleaned: any[];
    try { cleaned = dedupe(rows); }
    catch(e:any) { toast.push({kind:"error",title:"Duplicate wallets",message:err(e)}); return; }
    if (!cleaned.length) { toast.push({kind:"error",title:"No allocations added"}); return; }
    for (const r of cleaned) {
      if (!isValidAddress((r.walletAddress||"").trim())) { toast.push({kind:"error",title:"Invalid address",message:r.walletAddress}); return; }
      try { parseToAtomic(r.amount, USDC_DECIMALS); }
      catch(e:any) { toast.push({kind:"error",title:"Invalid amount",message:err(e)}); return; }
    }
    try {
      await uploadAlloc.mutateAsync({
        allocations: cleaned.map(r => ({
          employee_address: r.walletAddress.trim(),
          amount_atomic: parseToAtomic(r.amount, USDC_DECIMALS),
          amount_ciphertext_hex: "0x01",
        }))
      });
      toast.push({kind:"success",title:"Allocations saved"});
      setOpen(false); runQ.refetch(); fundingQ.refetch();
    } catch(e:any) { toast.push({kind:"error",title:"Upload failed",message:err(e)}); }
  }

  async function handleCreateOnchain() {
    try {
      const {walletClient,publicClient,account} = await getWalletClients(); setWallet(account);
      const nonce = await publicClient.getTransactionCount({address:account,blockTag:"pending"});
      const {request} = await publicClient.simulateContract({
        account, address:PAYROLL_VAULT_ADDRESS, abi:payrollVaultAbi,
        functionName:"createPayroll",
        args:[template?.token_address as `0x${string}`, BigInt(run.deadline_u64), Number(run.employee_count_u32)],
        nonce,
      });
      const txHash = await walletClient.writeContract(request);
      await createOnchain.mutateAsync({tx_hash:txHash,sender:account,nonce});
      toast.push({kind:"success",title:"Payroll creation submitted"});
      startPolling(); runQ.refetch();
    } catch(e:any) { toast.push({kind:"error",title:"Failed",message:err(e)}); }
  }

  async function handleSecure() {
    try {
      const {account} = await getWalletClients(); setWallet(account);
      const breakdown = fundingQ.data?.breakdown ?? [];
      if (!breakdown.length) { toast.push({kind:"error",title:"No allocations"}); return; }
      setProgress({current:0,total:breakdown.length});
      await encryptAlloc.mutateAsync({
        allocations: breakdown.map((r:any) => ({employee_address:r.employee,amount_atomic:String(r.amount_atomic)})),
        wallet:account, dappAddress:PAYROLL_VAULT_ADDRESS,
        onProgress:(c:number,t:number) => setProgress({current:c,total:t}),
      } as any);
      toast.push({kind:"success",title:"Payroll data secured"});
      startPolling(); runQ.refetch(); fundingQ.refetch();
    } catch(e:any) { toast.push({kind:"error",title:"Failed",message:err(e)}); }
  }

  async function handleFinalize() {
    try {
      const {walletClient,publicClient,account} = await getWalletClients(); setWallet(account);
      const nonce = await publicClient.getTransactionCount({address:account,blockTag:"pending"});
      const {request} = await publicClient.simulateContract({
        account, address:PAYROLL_VAULT_ADDRESS, abi:payrollVaultAbi,
        functionName:"finalizeAllocations", args:[BigInt(run.onchain_payroll_id)], nonce,
      });
      const txHash = await walletClient.writeContract(request);
      await finalizeAlloc.mutateAsync({tx_hash:txHash,sender:account,nonce});
      toast.push({kind:"success",title:"Finalization submitted"});
      startPolling(); runQ.refetch();
    } catch(e:any) { toast.push({kind:"error",title:"Failed",message:err(e)}); }
  }

  async function handleFund() {
    try {
      const {account} = await getWalletClients(); setWallet(account);
      await fundPayroll.mutateAsync();
      toast.push({kind:"success",title:"Funding submitted"});
      startPolling(); runQ.refetch(); fundingQ.refetch(); previewQ.refetch();
    } catch(e:any) { toast.push({kind:"error",title:"Failed",message:err(e)}); }
  }

  async function handleActivate() {
    try {
      const {account} = await getWalletClients(); setWallet(account);
      await activatePayroll.mutateAsync();
      toast.push({kind:"success",title:"Payroll activated"});
      startPolling(); runQ.refetch(); fundingQ.refetch(); previewQ.refetch();
    } catch(e:any) { toast.push({kind:"error",title:"Failed",message:err(e)}); }
  }

  return (
    <div className="sh-page pg">
      <div className="pg-bg" />

      <div className="pg-hero">
        <div className="pg-hero-l">
          <div className="pg-tag">
            <span className="pg-tag-dot" />
            Payroll Run · #{run.id}
          </div>
          <h1 className="pg-h1">
            {templateName}<br />
            <span className="blue">Run Detail</span>
          </h1>
          <div style={{display:"flex",alignItems:"center",gap:".65rem",flexWrap:"wrap",marginTop:".5rem"}}>
            <StatusBadge status={run.status} />
            <span className="chip chip-gray">{Number(run.employee_count_u32??0)} employees</span>
            <span className="chip chip-blue">{currentTotal.toLocaleString()} USDC</span>
            {isActive && <span className="chip chip-green">Active</span>}
            {/* polling indicator */}
            {(shouldPoll || txSubmitted) && (
              <span className="pg-polling">
                <span className="pg-polling-dot" />
                Confirming…
              </span>
            )}
          </div>
        </div>
        <div className="pg-hero-r">
          <Link to={`/employer/templates/${run.template}`} className="pg-back">
            ← Template
          </Link>
        </div>
      </div>

      {/* ── stat bar ── */}
      <div className="stat-row" style={{marginBottom:"2rem"}}>
        <div className="stat-cell">
          <div className="stat-v">{Number(run.employee_count_u32??0)}</div>
          <div className="stat-l">Employees</div>
        </div>
        <div className="stat-cell">
          <div className="stat-v">{currentTotal.toLocaleString()}<em> USDC</em></div>
          <div className="stat-l">Run Total</div>
        </div>
        <div className="stat-cell">
          <div className="stat-v">{cycleCount}</div>
          <div className="stat-l">Remaining Runs</div>
        </div>
        <div className="stat-cell">
          <div className="stat-v">{scheduleBudget.toLocaleString()}<em> USDC</em></div>
          <div className="stat-l">Est. Schedule Budget</div>
        </div>
      </div>

      {/* ── step track ── */}
      <div className="panel" style={{marginBottom:"2rem",position:"relative",zIndex:1}}>
        <div className="panel-scan" />
        <div className="panel-head">
          <div className="panel-title">Setup Progress</div>
          <div style={{display:"flex",alignItems:"center",gap:".75rem"}}>
            {(shouldPoll || txSubmitted) && (
              <span className="pg-polling">
                <span className="pg-polling-dot" />
                Waiting for confirmation
              </span>
            )}
            <StatusBadge status={run.status} />
          </div>
        </div>
        <div className="panel-body">
          <div className="run-steps">
            {steps.map((s,i) => (
              <div key={i} className={`run-step${s.done?" rs-done":s.active?" rs-active":""}`}>
                <div className="run-step-icon">
                  {s.done ? (
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none"
                      stroke="rgba(26,255,140,0.9)" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 10 8 14 16 6"/>
                    </svg>
                  ) : String(i+1)}
                </div>
                <div className="run-step-label">{s.label}</div>
              </div>
            ))}
          </div>

          {run.last_error && (
            <div style={{
              marginTop:"1rem",padding:".875rem 1rem",borderRadius:"6px",
              background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.2)",
              color:"#fca5a5",fontSize:".82rem",lineHeight:1.5,
            }}>
              <strong style={{fontFamily:"'Space Mono',monospace",fontSize:".62rem",letterSpacing:".07em",textTransform:"uppercase"}}>
                Last error
              </strong>
              <div style={{marginTop:".35rem"}}>{run.last_error}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── two-col layout: setup | funding ── */}
      <div className="two-col" style={{gap:"1.25rem",alignItems:"start",position:"relative",zIndex:1}}>

        {/* ═══ LEFT: SETUP ACTIONS ═══ */}
        <div style={{display:"flex",flexDirection:"column",gap:".875rem"}}>

          {/* Allocations */}
          <div className={`action-card${allocationsDone?" done-step":!allocationsDone?" active-step":""}`}>
            <div className="action-card-inner">
              <div className="action-num">{allocationsDone?"✓":"01"}</div>
              <div className="action-body">
                <div className="action-title">Upload Allocations</div>
                <div className="action-desc">
                  {allocationsDone
                    ? `${Number(run.employee_count_u32??0)} employees · ${currentTotal.toLocaleString()} USDC total`
                    : "Add employee wallet addresses and salary amounts."}
                </div>
              </div>
              <button
                className="pg-btn"
                style={{padding:".6rem 1.1rem",fontSize:".65rem"}}
                disabled={isFunded}
                onClick={() => setOpen(true)}
              >
                {allocationsDone ? "Edit" : "Add"}
              </button>
            </div>
          </div>

          {/* Create on-chain */}
          <div className={`action-card${onchainCreated?" done-step":txSubmitted?" active-step":canCreateOnchain?" active-step":""}`}>
            <div className="action-card-inner">
              <div className="action-num">{onchainCreated?"✓":txSubmitted?"…":"02"}</div>
              <div className="action-body">
                <div className="action-title">Create On-Chain Payroll</div>
                <div className="action-desc">
                  {onchainCreated
                    ? `Payroll ID: ${run.onchain_payroll_id}`
                    : txSubmitted
                    ? "Waiting for blockchain confirmation…"
                    : "Deploys the payroll escrow to PayrollVault."}
                </div>
              </div>
              <button
                className="pg-btn"
                style={{padding:".6rem 1.1rem",fontSize:".65rem"}}
                disabled={!canCreateOnchain || createOnchain.isPending || txSubmitted}
                onClick={handleCreateOnchain}
              >
                {createOnchain.isPending || txSubmitted ? "…" : onchainCreated ? "Done" : "Create"}
              </button>
            </div>
          </div>

          {/* Encrypt */}
          <div className={`action-card${payrollSecured?" done-step":canSecure?" active-step":""}`}>
            <div className="action-card-inner">
              <div className="action-num">{payrollSecured?"✓":"03"}</div>
              <div className="action-body">
                <div className="action-title">Encrypt &amp; Upload</div>
                <div className="action-desc">
                  {payrollSecured
                    ? "All salary amounts encrypted as euint256 handles."
                    : "Converts salaries to ciphertexts using Inco Lightning."}
                </div>
              </div>
              <button
                className="pg-btn"
                style={{padding:".6rem 1.1rem",fontSize:".65rem"}}
                disabled={!canSecure || encryptAlloc.isPending}
                onClick={handleSecure}
              >
                {encryptAlloc.isPending ? "…" : payrollSecured ? "Done" : "Encrypt"}
              </button>
            </div>
            {encryptAlloc.isPending && progress.total > 0 && (
              <div style={{padding:"0 1.5rem 1.25rem"}}>
                <div className="enc-progress">
                  <div className="enc-progress-label">
                    <span>Encrypting allocations</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                  <div className="enc-bar">
                    <div className="enc-bar-fill" style={{width:`${Math.round(progress.current/progress.total*100)}%`}} />
                  </div>
                  <div className="enc-count">{Math.round(progress.current/progress.total*100)}% complete</div>
                </div>
              </div>
            )}
          </div>

          {/* Finalize */}
          <div className={`action-card${payrollFinalized?" done-step":canFinalize?" active-step":""}`}>
            <div className="action-card-inner">
              <div className="action-num">{payrollFinalized?"✓":"04"}</div>
              <div className="action-body">
                <div className="action-title">Finalize Allocations</div>
                <div className="action-desc">
                  {payrollFinalized
                    ? "Allocations finalized on-chain."
                    : "Locks encrypted allocations in PayrollVault."}
                </div>
              </div>
              <button
                className="pg-btn"
                style={{padding:".6rem 1.1rem",fontSize:".65rem"}}
                disabled={!canFinalize || finalizeAlloc.isPending || status === "alloc_finalizing"}
                onClick={handleFinalize}
              >
                {finalizeAlloc.isPending || status === "alloc_finalizing" ? "…" : payrollFinalized ? "Done" : "Finalize"}
              </button>
            </div>
          </div>

        </div>

        {/* ═══ RIGHT: FUNDING + ACTIVATION ═══ */}
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

          <div className="panel">
            <div className="panel-scan" />
            <div className="panel-head">
              <div className="panel-title">Funding</div>
              <StatusBadge status={run.status} />
            </div>
            <div className="panel-body" style={{padding:"1.25rem"}}>
              <div className="dg">
                <div className="dg-cell">
                  <div className="dg-key">Run Total</div>
                  <div className="dg-val blue">{currentTotal.toLocaleString()} USDC</div>
                </div>
                <div className="dg-cell">
                  <div className="dg-key">Est. Budget</div>
                  <div className="dg-val">{scheduleBudget.toLocaleString()} USDC</div>
                </div>
                <div className="dg-cell">
                  <div className="dg-key">Token</div>
                  <div className="dg-val mono">cUSDC</div>
                </div>
                <div className="dg-cell">
                  <div className="dg-key">Next Run</div>
                  <div className="dg-val" style={{fontSize:".8rem"}}>
                    {previewQ.data?.next_run_at
                      ? new Date(previewQ.data.next_run_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})
                      : "—"}
                  </div>
                </div>
                <div className="dg-cell" style={{gridColumn:"1/-1"}}>
                  <div className="dg-key">Contract</div>
                  <div className="dg-val mono" style={{fontSize:".68rem"}}>{PAYROLL_VAULT_ADDRESS}</div>
                </div>
                {fundingTxHash && (
                  <div className="dg-cell" style={{gridColumn:"1/-1"}}>
                    <div className="dg-key">Funding Tx</div>
                    <div className="dg-val mono">{shortTx(fundingTxHash)}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="panel-foot">
              <button
                className="pg-btn"
                disabled={!canFund || isFunded || fundPayroll.isPending || status === "funding"}
                onClick={handleFund}
              >
                {fundPayroll.isPending || status === "funding" ? "Funding…" : isFunded ? "Funded ✓" : "Fund Payroll"}
              </button>
              <button
                className={`pg-btn${canActivate || isActive ? " green" : ""}`}
                disabled={!canActivate || activatePayroll.isPending || isActive || status === "activating"}
                onClick={handleActivate}
              >
                {activatePayroll.isPending || status === "activating" ? "Activating…" : isActive ? "Active ✓" : "Activate"}
              </button>
            </div>
          </div>

          {(status === "funded" || isActive) && (
            <div style={{
              padding:"1rem 1.25rem",borderRadius:"8px",
              background: isActive ? "rgba(26,255,140,.06)" : "rgba(47,107,255,.06)",
              border: `1px solid ${isActive ? "rgba(26,255,140,.2)" : "rgba(47,107,255,.2)"}`,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:".6rem"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:isActive?"rgba(26,255,140,0.9)":"rgba(47,107,255,0.9)",boxShadow:`0 0 7px ${isActive?"rgba(26,255,140,0.6)":"rgba(47,107,255,0.6)"}`,flexShrink:0}} />
                <span style={{fontSize:".875rem",color:isActive?"rgba(26,255,140,0.82)":"rgba(47,107,255,0.82)"}}>
                  {isActive
                    ? "Payroll is active — employees can now claim their salaries."
                    : "Payroll funded. Activate to open the employee claim window."}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      <EmpFooter />

      {/* ── allocations modal ── */}
      <Modal
        open={open}
        title="Upload Employee Allocations"
        description="Add employees manually or upload a CSV file."
        confirmText={uploadAlloc.isPending ? "Saving…" : "Save Allocations"}
        cancelText="Cancel"
        onClose={() => setOpen(false)}
        onConfirm={saveAllocations}
      >
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <AllocationTable rows={rows} onChange={setRows} tokenLabel="USDC" />
          <CSVUploader
            onParsed={(parsed) => {
              setRows(parsed);
              toast.push({kind:"success",title:"CSV loaded",message:`${parsed.length} rows loaded.`});
            }}
          />
        </div>
      </Modal>

    </div>
  );
}