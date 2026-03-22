import React from "react";
import { useNavigate } from "react-router-dom";

import SkeletonLoader from "../../ui/SkeletonLoader";
import StatusBadge from "../../ui/StatusBadge";
import { useToast } from "../../ui/Toast";
import { useWallet } from "../../lib/WalletContext";

import {
  useEmployeeClaimables,
  type EmployeeClaimable,
} from "../../hooks/useEmployeeClaimables";
import { useCreateClaim } from "../../hooks/useClaims";

type ClaimableItem = EmployeeClaimable;
const PER_PAGE = 3;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap');
.cld-bloom{position:fixed;pointer-events:none;z-index:0;width:900px;height:700px;top:-200px;right:-200px;background:radial-gradient(ellipse at center,rgba(47,107,255,.05) 0%,transparent 65%)}
.cld-gate{position:relative;overflow:hidden;border:1px solid rgba(47,107,255,.14);border-radius:12px;background:rgb(8,11,20);padding:72px 40px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:24px}
.cld-gate::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(47,107,255,.5),transparent)}
.cld-gate-icon{width:64px;height:64px;border-radius:14px;border:1px solid rgba(47,107,255,.22);background:rgba(47,107,255,.07);display:flex;align-items:center;justify-content:center;color:rgba(47,107,255,.8);box-shadow:0 0 40px rgba(47,107,255,.08)}
.cld-gate-title{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(1.5rem,3vw,2.2rem);color:rgba(210,222,255,.97);letter-spacing:-.03em;line-height:1}
.cld-gate-sub{font-family:'Space Mono',monospace;font-size:11px;color:rgba(210,222,255,.3);letter-spacing:.04em;line-height:1.75;max-width:380px}
.cld-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(47,107,255,.1);border:1px solid rgba(47,107,255,.12);border-radius:10px;overflow:hidden;margin-bottom:2.5rem;position:relative;z-index:1}
.cld-stat{background:rgb(8,11,20);padding:24px 28px;display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden;transition:background .2s}
.cld-stat:hover{background:rgba(47,107,255,.04)}
.cld-stat::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;transform:scaleX(0);transform-origin:left;transition:transform .35s}
.cld-stat.blue::after{background:rgba(47,107,255,.7)}.cld-stat.amber::after{background:rgba(255,180,50,.7)}.cld-stat.green::after{background:rgba(26,255,140,.7)}
.cld-stat:hover::after{transform:scaleX(1)}
.cld-stat-num{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(2rem,4vw,3rem);line-height:1;letter-spacing:-.04em}
.cld-stat.blue .cld-stat-num{color:rgba(47,107,255,.9)}.cld-stat.amber .cld-stat-num{color:rgba(255,180,50,.9)}.cld-stat.green .cld-stat-num{color:rgba(26,255,140,.9)}
.cld-stat-lbl{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:rgba(210,222,255,.25)}
.cld-stat-bar{height:2px;border-radius:1px;margin-top:4px;background:rgba(210,222,255,.05)}
.cld-stat-bar-fill{height:100%;border-radius:1px;transition:width .6s ease}
.cld-stat.blue .cld-stat-bar-fill{background:rgba(47,107,255,.45)}.cld-stat.amber .cld-stat-bar-fill{background:rgba(255,180,50,.45)}.cld-stat.green .cld-stat-bar-fill{background:rgba(26,255,140,.45)}
.cld-section{position:relative;z-index:1;margin-bottom:2.5rem}
.cld-section-head{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1.25rem;border:1px solid rgba(47,107,255,.1);border-bottom:none;border-radius:10px 10px 0 0;background:rgba(47,107,255,.03)}
.cld-section-left{display:flex;align-items:center;gap:10px}
.cld-section-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.cld-section-dot.blue{background:rgba(47,107,255,.9);box-shadow:0 0 7px rgba(47,107,255,.55)}.cld-section-dot.amber{background:rgba(255,180,50,.9);box-shadow:0 0 7px rgba(255,180,50,.55)}.cld-section-dot.green{background:rgba(26,255,140,.9);box-shadow:0 0 7px rgba(26,255,140,.55)}
.cld-section-title{font-family:'Space Mono',monospace;font-weight:700;font-size:11px;color:rgba(210,222,255,.8);letter-spacing:.04em}
.cld-section-badge{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;color:rgba(210,222,255,.3);background:rgba(47,107,255,.07);border:1px solid rgba(47,107,255,.13);padding:2px 8px;border-radius:20px}
.cld-section-sub{font-family:'Space Mono',monospace;font-size:9px;color:rgba(210,222,255,.25);letter-spacing:.06em}
.cld-table{width:100%;border:1px solid rgba(47,107,255,.1);border-top:none;border-radius:0 0 10px 10px;overflow:hidden}
.cld-row{display:grid;grid-template-columns:56px 200px 160px 100px auto 130px;align-items:center;padding:0 1.25rem;min-height:72px;border-bottom:1px solid rgba(47,107,255,.06);background:rgb(8,11,20);transition:background .18s;position:relative;cursor:default}
.cld-row:last-child{border-bottom:none}.cld-row:hover{background:rgba(47,107,255,.035)}
.cld-row::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:transparent;transition:background .18s}
.cld-row.available:hover::before{background:rgba(47,107,255,.75)}.cld-row.in-progress:hover::before{background:rgba(255,180,50,.75)}.cld-row.completed:hover::before{background:rgba(26,255,140,.6)}
.cld-col-head{display:grid;grid-template-columns:56px 200px 160px 100px auto 130px;padding:0 1.25rem;height:36px;align-items:center;border-left:1px solid rgba(47,107,255,.1);border-right:1px solid rgba(47,107,255,.1);border-top:none;border-bottom:1px solid rgba(47,107,255,.08);background:rgba(47,107,255,.03)}
.cld-th{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:rgba(210,222,255,.2)}.cld-th.right{text-align:right}
.cld-cell{display:flex;flex-direction:column;gap:3px}.cld-cell.right{align-items:flex-end}.cld-cell.center{align-items:center}
.cld-cell .rd-badge,.cld-cell .badge{width:fit-content!important;max-width:100%!important;flex-shrink:0}
.cld-run-num{font-family:'Space Mono',monospace;font-size:10px;color:rgba(47,107,255,.75);background:rgba(47,107,255,.08);border:1px solid rgba(47,107,255,.16);padding:3px 7px;border-radius:4px;letter-spacing:.02em}
.cld-wallet{font-family:'Space Mono',monospace;font-size:10px;color:rgba(210,222,255,.72);letter-spacing:.02em;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.cld-wallet-sub{font-family:'Space Mono',monospace;font-size:8px;color:rgba(210,222,255,.22);letter-spacing:.06em}
.cld-date{font-family:'Space Mono',monospace;font-size:10px;color:rgba(210,222,255,.65);white-space:nowrap}
.cld-date-sub{font-family:'Space Mono',monospace;font-size:9px;color:rgba(210,222,255,.25);letter-spacing:.04em}
.cld-payroll-id{font-family:'Space Mono',monospace;font-size:10px;color:rgba(210,222,255,.5);letter-spacing:.04em}
.cld-action-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:6px 14px;font-family:'Space Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;border-radius:5px;cursor:pointer;transition:all .18s;white-space:nowrap;width:100%}
.cld-action-btn.primary{background:rgba(47,107,255,.85);border:1px solid rgba(47,107,255,1);color:rgba(210,222,255,.97)}
.cld-action-btn.primary:hover{background:rgba(47,107,255,1);box-shadow:0 0 16px rgba(47,107,255,.28)}
.cld-action-btn.ghost{background:transparent;border:1px solid rgba(210,222,255,.1);color:rgba(210,222,255,.4)}
.cld-action-btn.ghost:hover{border-color:rgba(210,222,255,.22);color:rgba(210,222,255,.7)}
.cld-action-btn:disabled{opacity:.35;cursor:not-allowed;pointer-events:none}
.cld-pager{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1.25rem;border:1px solid rgba(47,107,255,.1);border-top:none;border-radius:0 0 10px 10px;background:rgba(47,107,255,.02);flex-wrap:wrap;gap:.75rem}
.cld-pager-info{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:rgba(210,222,255,.25)}
.cld-pager-btns{display:flex;align-items:center;gap:4px}
.cld-pager-btn{display:flex;align-items:center;justify-content:center;min-width:30px;height:30px;padding:0 6px;background:rgba(255,255,255,.025);border:1px solid rgba(47,107,255,.1);border-radius:5px;font-family:'Space Mono',monospace;font-size:9px;font-weight:700;color:rgba(210,222,255,.4);cursor:pointer;transition:all .15s}
.cld-pager-btn:hover:not(:disabled){background:rgba(47,107,255,.1);border-color:rgba(47,107,255,.35);color:rgba(210,222,255,.9)}
.cld-pager-btn.on{background:rgba(47,107,255,.18);border-color:rgba(47,107,255,.45);color:rgba(47,107,255,.95)}
.cld-pager-btn:disabled{opacity:.25;cursor:not-allowed}
.cld-empty-row{padding:40px 24px;border:1px solid rgba(47,107,255,.1);border-top:none;border-radius:0 0 10px 10px;background:rgb(8,11,20);display:flex;align-items:center;justify-content:center;font-family:'Space Mono',monospace;font-size:10px;color:rgba(210,222,255,.18);letter-spacing:.1em;text-transform:uppercase}
.cld-err{padding:16px 20px;border-radius:8px;background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.2);font-family:'Space Mono',monospace;font-size:11px;color:rgba(252,165,165,.85);letter-spacing:.02em;line-height:1.55}
@media(max-width:900px){.cld-row,.cld-col-head{grid-template-columns:44px 180px auto 110px}.cld-row>*:nth-child(3),.cld-col-head>*:nth-child(3),.cld-row>*:nth-child(5),.cld-col-head>*:nth-child(5){display:none}.cld-summary{grid-template-columns:1fr}}
@media(max-width:640px){.cld-row,.cld-col-head{grid-template-columns:1fr 1fr 110px}.cld-row>*:nth-child(1),.cld-col-head>*:nth-child(1),.cld-row>*:nth-child(4),.cld-col-head>*:nth-child(4){display:none}}
`;

function useStyles() {
  React.useEffect(() => {
    const id = "rd-cld-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

function normalizeWallet(wallet?: string) {
  if (!wallet) return "";
  return wallet.trim().toLowerCase();
}
function claimStatusLabel(status?: string) {
  const s = String(status || "").toLowerCase();
  if (s === "not_started") return "Available to Claim";
  if (s === "draft") return "Claim Started";
  if (s === "request_broadcasted") return "Request Submitted";
  if (s === "pending_ready") return "Ready to Finalize";
  if (s === "finalize_broadcasted") return "Finalizing";
  if (s === "finalized_success") return "Claimed";
  if (s === "finalized_revert") return "Finalize Reverted";
  if (s === "failed") return "Failed";
  return status || "Unknown";
}
function claimStatusTone(status?: string): "gray"|"green"|"red"|"yellow"|"blue" {
  const s = String(status || "").toLowerCase();
  if (s === "not_started" || s === "draft") return "yellow";
  if (["request_broadcasted","pending_ready","finalize_broadcasted"].includes(s)) return "blue";
  if (s === "finalized_success") return "green";
  if (["failed","finalized_revert"].includes(s)) return "red";
  return "gray";
}
function bucketClaim(item: ClaimableItem) {
  const s = String(item.claim_status || "").toLowerCase();
  if (s === "finalized_success") return "completed";
  if (["draft","request_broadcasted","pending_ready","finalize_broadcasted","failed","finalized_revert"].includes(s)) return "in_progress";
  return "available";
}
function claimActionLabel(item: ClaimableItem) {
  const s = String(item.claim_status || "").toLowerCase();
  if (s === "not_started") return "Start Claim";
  if (s === "draft") return "Continue";
  if (s === "request_broadcasted") return "Continue";
  if (s === "pending_ready") return "Finalize";
  if (s === "finalize_broadcasted") return "View";
  if (s === "finalized_success") return "View";
  if (s === "failed" || s === "finalized_revert") return "Continue";
  return item.claim_id ? "Continue" : "Start Claim";
}
function getErrorMessage(error: unknown) {
  const err = error as any;
  return err?.response?.data?.detail || err?.response?.data?.error || err?.message || "Please try again.";
}
function shortAddr(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0,6)}…${addr.slice(-4)}`;
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" }),
    time: d.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit" }),
  };
}

function Pager({ page, total, perPage, onChange }: { page:number; total:number; perPage:number; onChange:(p:number)=>void }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  const items: (number|"…")[] = [];
  if (pages <= 7) { for (let i=1;i<=pages;i++) items.push(i); }
  else {
    items.push(1);
    if (page > 3) items.push("…");
    for (let i=Math.max(2,page-1);i<=Math.min(pages-1,page+1);i++) items.push(i);
    if (page < pages-2) items.push("…");
    items.push(pages);
  }
  const start = (page-1)*perPage+1, end = Math.min(page*perPage,total);
  return (
    <div className="cld-pager">
      <span className="cld-pager-info">{start}–{end} of {total}</span>
      <div className="cld-pager-btns">
        <button className="cld-pager-btn" disabled={page===1} onClick={()=>onChange(page-1)}>
          <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 16l-6-6 6-6"/></svg>
        </button>
        {items.map((it,i) => it==="…"
          ? <span key={`e${i}`} style={{padding:"0 4px",color:"rgba(210,222,255,.2)",fontSize:9}}>…</span>
          : <button key={it} className={`cld-pager-btn${it===page?" on":""}`} onClick={()=>onChange(it as number)}>{it}</button>
        )}
        <button className="cld-pager-btn" disabled={page===pages} onClick={()=>onChange(page+1)}>
          <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 4l6 6-6 6"/></svg>
        </button>
      </div>
    </div>
  );
}

function ClaimSection({ title, subtitle, dotColor, bucket, items, wallet, creating, onAction }: {
  title:string; subtitle:string; dotColor:"blue"|"amber"|"green";
  bucket:string; items:ClaimableItem[]; wallet:string;
  creating:boolean; onAction:(runId:number,claimId?:number|null)=>void;
}) {
  const [page, setPage] = React.useState(1);
  React.useEffect(()=>{ setPage(1); }, [items.length]);
  const slice = items.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const isCompleted = bucket === "completed";
  return (
    <div className="cld-section">
      <div className="cld-section-head">
        <div className="cld-section-left">
          <span className={`cld-section-dot ${dotColor}`} />
          <span className="cld-section-title">{title}</span>
          <span className="cld-section-badge">{items.length}</span>
        </div>
        <span className="cld-section-sub">{subtitle}</span>
      </div>
      <div className="cld-col-head">
        <div className="cld-th">Run</div><div className="cld-th">Wallet</div>
        <div className="cld-th">Run Date</div><div className="cld-th">Payroll ID</div>
        <div className="cld-th">Status</div><div className="cld-th right">Action</div>
      </div>
      {items.length === 0
        ? <div className="cld-empty-row">No {title.toLowerCase()} at this time</div>
        : <div className="cld-table">
            {slice.map((c) => {
              const dt = formatDate(c.run_at);
              const label = claimActionLabel(c);
              const isView = ["finalized_success","finalize_broadcasted"].includes(String(c.claim_status||"").toLowerCase());
              return (
                <div key={`${c.run_id}-${c.claim_id??"new"}`} className={`cld-row ${bucket.replace("_","-")}`}>
                  <div className="cld-cell center"><span className="cld-run-num">#{c.run_id}</span></div>
                  <div className="cld-cell"><span className="cld-wallet">{shortAddr(wallet)}</span><span className="cld-wallet-sub">Employee Wallet</span></div>
                  <div className="cld-cell"><span className="cld-date">{dt.date}</span><span className="cld-date-sub">{dt.time}</span></div>
                  <div className="cld-cell"><span className="cld-payroll-id">{c.onchain_payroll_id || "—"}</span></div>
                  <div className="cld-cell"><StatusBadge tone={claimStatusTone(c.claim_status)}>{claimStatusLabel(c.claim_status)}</StatusBadge></div>
                  <div className="cld-cell right">
                    <button className={`cld-action-btn ${isView||isCompleted?"ghost":"primary"}`} disabled={creating} onClick={()=>onAction(Number(c.run_id),c.claim_id)}>
                      {creating&&!c.claim_id?"Opening…":label}
                      {!isView&&!isCompleted&&<svg width="9" height="9" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10h10M11 6l4 4-4 4"/></svg>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
      }
      {items.length > PER_PAGE && <Pager page={page} total={items.length} perPage={PER_PAGE} onChange={setPage} />}
    </div>
  );
}

export default function ClaimsDashboard() {
  useStyles();
  const nav   = useNavigate();
  const toast = useToast();

  // ── Read wallet from global context — no duplicate connect UI ──
  const { wallet, connect } = useWallet();
  const normalizedWallet = normalizeWallet(wallet);

  const claimablesQ = useEmployeeClaimables(normalizedWallet);
  const createClaim = useCreateClaim();

  /* ── AUTO-POLL: refresh list every 10s while wallet connected ── */
  React.useEffect(() => {
    if (!normalizedWallet) return;
    const id = setInterval(() => { claimablesQ.refetch(); }, 10_000);
    return () => clearInterval(id);
  }, [normalizedWallet]);

  /* ── AUTO-POLL: refresh when any claim is in a transitional state ── */
  const TRANSITIONAL = new Set(["request_broadcasted","finalize_broadcasted","draft"]);
  const claimables_raw = (claimablesQ.data?.claimables ?? []) as ClaimableItem[];
  const hasTransitional = claimables_raw.some(c => TRANSITIONAL.has(String(c.claim_status||"").toLowerCase()));
  const pollUntilRef = React.useRef<number>(0);
  const [activePoll, setActivePoll] = React.useState(false);
  function startPolling() { pollUntilRef.current = Date.now() + 90_000; setActivePoll(true); }
  const shouldPoll = activePoll || hasTransitional;
  React.useEffect(() => {
    if (!shouldPoll || !normalizedWallet) return;
    const id = setInterval(() => {
      if (activePoll && Date.now() > pollUntilRef.current) setActivePoll(false);
      claimablesQ.refetch();
    }, 4000);
    return () => clearInterval(id);
  }, [shouldPoll, normalizedWallet]);

  async function handleConnect() {
    try { await connect(); toast.push({ kind:"success", title:"Wallet connected" }); }
    catch (e:any) { toast.push({ kind:"error", title:"Wallet connection failed", message:e?.message??"Please try again." }); }
  }

 async function handleClaim(runId:number, existingClaimId?:number|null) {
  try {
    if (existingClaimId) {
      nav(`/employee/claims/${existingClaimId}`);
      return;
    }
    if (!wallet) {
      await connect();
      return; // let user reconnect first
    }
    const claim = await createClaim.mutateAsync({
      run: runId,
      employee_address: wallet,
    });
    if (!claim?.id) {
      throw new Error("Claim was created but returned no ID. Please refresh and try again.");
    }
    startPolling();
    nav(`/employee/claims/${claim.id}`);
  } catch (e:any) {
    const msg = e?.message ?? e?.detail ?? "Please try again.";
    toast.push({ kind:"error", title:"Could not open claim", message:msg });
  }
}

  const claimables       = (claimablesQ.data?.claimables ?? []) as ClaimableItem[];
  const availableClaims  = claimables.filter(c => bucketClaim(c) === "available");
  const inProgressClaims = claimables.filter(c => bucketClaim(c) === "in_progress");
  const completedClaims  = claimables.filter(c => bucketClaim(c) === "completed");
  const total = claimables.length;

  /* ── AUTO-POLL: refresh list while any claims are in progress ── */
  React.useEffect(() => {
    if (!normalizedWallet || inProgressClaims.length === 0) return;
    const id = setInterval(() => { claimablesQ.refetch(); }, 5000);
    return () => clearInterval(id);
  }, [normalizedWallet, inProgressClaims.length]);

  return (
    <div className="sh-page pg">
      <div className="pg-bg" />
      <div className="cld-bloom" />

      {/* ── hero — no wallet button, navbar handles it ── */}
      <div className="pg-hero">
        <div className="pg-hero-l">
          <div className="pg-tag"><span className="pg-tag-dot" />Employee Portal</div>
          <h1 className="pg-h1">Payroll<br /><span className="blue">Claims</span></h1>
          <p className="pg-lead">
            View and manage all payroll claims connected to your wallet.
            {wallet && <> · <span style={{color:"rgba(47,107,255,.8)"}}>{total} claim{total!==1?"s":""} found</span></>}
          </p>
        </div>
        {/* Right side intentionally empty — wallet is in the navbar */}
        <div className="pg-hero-r" />
      </div>

      {/* ── no wallet gate ── */}
      {!wallet && (
        <div className="cld-gate">
          <div className="cld-gate-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="6" width="22" height="13" rx="2"/>
              <path d="M16 14a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" stroke="none"/>
              <path d="M1 10h22"/>
            </svg>
          </div>
          <div className="cld-gate-title">Connect Your Wallet</div>
          <div className="cld-gate-sub">
            Use the Connect button in the top-right navbar to link your employee wallet.
            Claims linked to your address on Base Sepolia will appear here.
          </div>
          <button className="pg-btn" onClick={handleConnect}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="6" width="22" height="13" rx="2"/><path d="M1 10h22"/>
            </svg>
            Connect Wallet
          </button>
        </div>
      )}

      {wallet && claimablesQ.isLoading && (
        <div className="panel" style={{position:"relative",zIndex:1}}>
          <div className="panel-scan" /><div className="panel-body"><SkeletonLoader lines={8} /></div>
        </div>
      )}

      {wallet && claimablesQ.isError && (
        <div className="cld-err">{getErrorMessage(claimablesQ.error)}</div>
      )}

      {wallet && !claimablesQ.isLoading && !claimablesQ.isError && claimables.length === 0 && (
        <div className="panel" style={{position:"relative",zIndex:1}}>
          <div className="panel-scan" />
          <div style={{padding:"64px 24px",textAlign:"center"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:"rgba(210,222,255,.55)",marginBottom:10}}>No payroll claims found</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(210,222,255,.22)",letterSpacing:".04em",lineHeight:1.7}}>
              No claims are linked to this wallet yet.<br />
              Claims appear once an employer activates a payroll run containing your address.
            </div>
          </div>
        </div>
      )}

      {wallet && !claimablesQ.isLoading && !claimablesQ.isError && claimables.length > 0 && (
        <>
          <div className="cld-summary">
            {[
              {tone:"blue",  num:availableClaims.length,  label:"Available",   pct:total?Math.round(availableClaims.length/total*100):0},
              {tone:"amber", num:inProgressClaims.length, label:"In Progress", pct:total?Math.round(inProgressClaims.length/total*100):0},
              {tone:"green", num:completedClaims.length,  label:"Completed",   pct:total?Math.round(completedClaims.length/total*100):0},
            ].map(s => (
              <div key={s.tone} className={`cld-stat ${s.tone}`}>
                <div className="cld-stat-num">{s.num}</div>
                <div className="cld-stat-lbl">{s.label}</div>
                <div className="cld-stat-bar"><div className="cld-stat-bar-fill" style={{width:`${s.pct}%`}} /></div>
              </div>
            ))}
          </div>
          <ClaimSection title="Available Claims"  subtitle="Ready to start claiming"   dotColor="blue"  bucket="available"   items={availableClaims}  wallet={wallet} creating={createClaim.isPending} onAction={handleClaim} />
          <ClaimSection title="In Progress"       subtitle="Needs your attention"      dotColor="amber" bucket="in_progress" items={inProgressClaims} wallet={wallet} creating={createClaim.isPending} onAction={handleClaim} />
          <ClaimSection title="Completed"         subtitle="Successfully claimed"      dotColor="green" bucket="completed"   items={completedClaims}  wallet={wallet} creating={createClaim.isPending} onAction={handleClaim} />
        </>
      )}
    </div>
  );
} 