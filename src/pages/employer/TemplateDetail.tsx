import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../../ui/StatusBadge";
import SkeletonLoader from "../../ui/SkeletonLoader";
import { useToast } from "../../ui/Toast";
import { useTemplate, useActivateTemplate, useTemplatePreviewRuns } from "../../hooks/useTemplates";
import { useTemplateRuns, useCreateRun } from "../../hooks/useRuns";
import RunTable from "../../features/runs/RunTable";
import EmpFooter from "../../ui/EmpFooter";
import "../../styles/employer-pages.css";

/* ── CSS injected once ── */
const TEMPLATE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap');

/* ─── global overflow kill ─── */
html, body { overflow-x: hidden; }

/* ─── base page shell ─── */
.pg {
  min-height: 100vh;
  background: rgb(3,5,9);
  color: rgba(210,222,255,0.88);
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  position: relative;
  box-sizing: border-box;
}
.pg *, .pg *::before, .pg *::after { box-sizing: border-box; }

.pg-bg {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse 60% 50% at 80% 15%, rgba(47,107,255,0.08) 0%, transparent 70%),
    radial-gradient(ellipse 35% 40% at 5%  85%, rgba(26,255,140,0.03) 0%, transparent 70%);
}

/* ─── hero ─── */
.pg-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  padding: 2.5rem 0 2rem;
  position: relative;
  z-index: 1;
}
.pg-hero-l { flex: 1; min-width: 0; }
.pg-hero-r {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding-top: .35rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

/* ─── eyebrow tag ─── */
.pg-tag {
  display: flex; align-items: center; gap: .55rem;
  font-family: 'Space Mono', monospace;
  font-size: .6rem; letter-spacing: .18em;
  color: rgba(47,107,255,0.7); text-transform: uppercase;
  margin-bottom: 1rem;
}
.pg-tag-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: rgba(47,107,255,0.8);
  box-shadow: 0 0 7px rgba(47,107,255,0.55);
  flex-shrink: 0;
}

/* ─── page heading ─── */
.pg-h1 {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: clamp(2.2rem, 5vw, 4.5rem);
  letter-spacing: -0.035em;
  line-height: 0.93;
  color: rgba(210,222,255,0.97);
  margin: 0 0 .75rem;
  word-break: break-word;
}
.pg-h1 .blue { color: rgba(47,107,255,0.95); display: block; }

/* ─── chips ─── */
.chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 12px; border-radius: 20px;
  font-family: 'Space Mono', monospace;
  font-size: 10px; font-weight: 700; letter-spacing: .07em;
  white-space: nowrap;
}
.chip-gray  { background:rgba(210,222,255,0.05); border:1px solid rgba(210,222,255,0.13); color:rgba(210,222,255,0.5); }
.chip-blue  { background:rgba(47,107,255,0.08);  border:1px solid rgba(47,107,255,0.26);  color:rgba(47,107,255,0.88); }
.chip-green { background:rgba(26,255,140,0.07);  border:1px solid rgba(26,255,140,0.25);  color:rgba(26,255,140,0.85); }
.chip-dot {
  width:5px; height:5px; border-radius:50%;
  background:rgba(47,107,255,0.85); box-shadow:0 0 5px rgba(47,107,255,0.6);
  flex-shrink:0; display:inline-block;
}

/* ─── back button ─── */
.pg-back {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: transparent; border: 1px solid rgba(210,222,255,0.13);
  border-radius: 6px;
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: .1em; color: rgba(210,222,255,0.45);
  text-decoration: none; white-space: nowrap; transition: all .2s;
}
.pg-back:hover { border-color: rgba(210,222,255,0.28); color: rgba(210,222,255,0.78); }

/* ─── primary button ─── */
.pg-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 20px; border-radius: 6px;
  font-family: 'Space Mono', monospace; font-size: 10px;
  font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  cursor: pointer; transition: all .2s; white-space: nowrap;
  border: none; background: rgba(47,107,255,0.85); color: rgba(210,222,255,0.97);
}
.pg-btn:hover:not(:disabled) { background:rgba(47,107,255,1); box-shadow:0 0 22px rgba(47,107,255,0.3); }
.pg-btn:disabled { opacity:.22; cursor:not-allowed; pointer-events:none; }

/* ─── two-col layout ─── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  gap: 1.25rem;
  align-items: start;
  position: relative;
  z-index: 1;
  width: 100%;
}

/* ─── panel ─── */
.panel {
  background: rgb(8,11,20);
  border: 1px solid rgba(47,107,255,0.14);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  min-width: 0;
}
.panel-scan {
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(47,107,255,0.55), transparent);
  animation: pg-scan 4s ease-in-out infinite;
}
@keyframes pg-scan {
  0%   { opacity:0; transform:scaleX(0); transform-origin:left; }
  50%  { opacity:1; transform:scaleX(1); transform-origin:left; }
  100% { opacity:0; transform:scaleX(1); transform-origin:right; }
}
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: .75rem; flex-wrap: wrap;
  padding: 18px 24px 16px;
  border-bottom: 1px solid rgba(47,107,255,0.09);
}
.panel-title { font-family:'Space Mono',monospace; font-weight:700; font-size:13px; color:rgba(210,222,255,0.85); letter-spacing:.02em; }
.panel-sub   { font-family:'Space Mono',monospace; font-size:10px; color:rgba(210,222,255,0.32); letter-spacing:.04em; margin-top:3px; line-height:1.5; }
.panel-body  { padding: 20px 24px; }
.panel-foot  { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:16px 24px; border-top:1px solid rgba(47,107,255,0.09); background:rgba(47,107,255,0.02); }

/* ─── data grid ─── */
.dg {
  display: grid; grid-template-columns: 1fr 1fr;
  border: 1px solid rgba(47,107,255,0.1); border-radius: 8px;
  overflow: hidden; gap: 1px; background: rgba(47,107,255,0.08);
  width: 100%;
}
.dg-cell { background:rgb(8,11,20); padding:13px 16px; min-width:0; overflow:hidden; }
.dg-key  { font-family:'Space Mono',monospace; font-size:8px; letter-spacing:.16em; color:rgba(210,222,255,0.28); text-transform:uppercase; margin-bottom:5px; }
.dg-val  { font-family:'Space Mono',monospace; font-size:12px; color:rgba(210,222,255,0.75); word-break:break-word; overflow-wrap:anywhere; line-height:1.4; }
.dg-val.blue { font-family:'Syne',sans-serif; font-weight:800; font-size:15px; letter-spacing:-0.02em; color:rgba(47,107,255,0.9); }
.dg-val.mono { font-size:10px; color:rgba(210,222,255,0.55); }

/* ─── timeline ─── */
.timeline { display:flex; flex-direction:column; gap:0; }
.tl-item  { display:flex; align-items:flex-start; gap:14px; padding:0 0 18px; position:relative; }
.tl-item:last-child { padding-bottom:0; }
.tl-dot {
  display:flex; flex-direction:column; align-items:center;
  flex-shrink:0; padding-top:3px;
}
.tl-dot::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:rgba(47,107,255,0.85); border:1px solid rgba(47,107,255,0.5);
  box-shadow:0 0 8px rgba(47,107,255,0.35); flex-shrink:0;
}
.tl-line { width:1px; flex:1; min-height:22px; background:rgba(47,107,255,0.15); margin-top:5px; }
.tl-date  { font-family:'Space Mono',monospace; font-size:11px; color:rgba(210,222,255,0.78); letter-spacing:.02em; line-height:1.4; }
.tl-label { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.12em; color:rgba(210,222,255,0.28); text-transform:uppercase; margin-top:3px; }

/* ─── state text ─── */
.pg-hint { font-family:'Space Mono',monospace; font-size:10px; color:rgba(210,222,255,0.28); letter-spacing:.04em; line-height:1.6; }
.pg-active-note  { display:flex; align-items:center; gap:10px; padding:10px 0; }
.pg-active-dot   { width:7px; height:7px; border-radius:50%; background:rgba(26,255,140,0.9); box-shadow:0 0 8px rgba(26,255,140,0.6); flex-shrink:0; }
.pg-active-text  { font-family:'Space Mono',monospace; font-size:11px; color:rgba(26,255,140,0.8); letter-spacing:.02em; line-height:1.55; }
.pg-inactive-text{ font-family:'Space Mono',monospace; font-size:11px; color:rgba(210,222,255,0.35); line-height:1.7; letter-spacing:.02em; }
.pg-empty-text   { font-family:'Space Mono',monospace; font-size:11px; color:rgba(210,222,255,0.22); letter-spacing:.04em; line-height:1.65; }

/* ─── network indicator ─── */
.pg-network     { display:inline-flex; align-items:center; gap:6px; font-family:'Space Mono',monospace; font-size:11px; color:rgba(210,222,255,0.72); }
.pg-network-dot { width:5px; height:5px; border-radius:50%; background:rgba(26,255,140,0.9); box-shadow:0 0 5px rgba(26,255,140,0.65); flex-shrink:0; }

/* ══════════════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════════════ */

/* 1024px — tablet landscape */
@media (max-width: 1024px) {
  .pg-h1 { font-size: clamp(2rem, 5vw, 3.8rem); }
  .dg    { grid-template-columns: 1fr 1fr; }
}

/* 860px — tablet portrait */
@media (max-width: 860px) {
  .pg-hero   { flex-direction: column; gap: 1.25rem; padding: 1.75rem 0 1.5rem; }
  .pg-hero-l { min-width: 0; width: 100%; }
  .pg-hero-r { padding-top: 0; width: 100%; justify-content: flex-start; }
  .two-col   { grid-template-columns: 1fr; }
}

/* 640px — mobile large */
@media (max-width: 640px) {
  .pg-h1      { font-size: clamp(1.85rem, 8vw, 2.8rem); }
  .panel-head { padding: 13px 14px 11px; }
  .panel-body { padding: 14px; }
  .panel-foot { padding: 12px 14px; }
  .panel-title{ font-size: 12px; }
  .panel-sub  { font-size: 9px; }
  .dg         { grid-template-columns: 1fr; }
  .dg-val     { font-size: 11px; }
  .dg-val.blue{ font-size: 13px; }
  .pg-back    { font-size: .56rem; padding: 7px 11px; }
  .pg-btn     { font-size: .58rem; padding: 8px 14px; }
  .chip       { font-size: .56rem; padding: 3px 10px; }
  .tl-date    { font-size: 10px; }
  .tl-label   { font-size: 8px; }
}

/* 480px — mobile small */
@media (max-width: 480px) {
  .pg-hero    { padding: 1.25rem 0; gap: 1rem; }
  .pg-h1      { font-size: clamp(1.6rem, 9vw, 2.2rem); }
  .panel-head { padding: 11px 12px 10px; }
  .panel-body { padding: 12px; }
  .panel-foot { padding: 10px 12px; gap: 8px; }
  .pg-back    { font-size: .54rem; padding: 6px 10px; }
  .pg-btn     { font-size: .56rem; padding: 7px 12px; }
  .chip       { font-size: .54rem; padding: 3px 8px; }
  .dg-cell    { padding: 11px 12px; }
  .dg-val     { font-size: 10px; }
  .dg-val.blue{ font-size: 12px; }
  .pg-active-text  { font-size: 10px; }
  .pg-inactive-text{ font-size: 10px; }
  .pg-empty-text   { font-size: 10px; }
}

/* 360px — mobile xs */
@media (max-width: 360px) {
  .pg-h1   { font-size: clamp(1.4rem, 10vw, 1.9rem); }
  .dg-cell { padding: 9px 10px; }
  .pg-tag  { font-size: .54rem; letter-spacing: .12em; }
}
`;

function useTemplateStyles() {
  React.useEffect(() => {
    const id = "rd-template-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = TEMPLATE_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

/* ── helpers — unchanged ── */
function isActive(s?: string) { return String(s||"").toLowerCase() === "active"; }

function safeDate(iso?: string|null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});
}

function safeDateTime(iso?: string|null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});
}

function scheduleText(s?: any) {
  if (!s?.type) return "—";
  const t = s.type.toLowerCase();
  if (t === "instant") return "One-time";
  if (t === "weekly")  return `Weekly${s.weekday ? ` · ${s.weekday}` : ""}`;
  if (t === "monthly") return `Monthly · Day ${s.day_of_month ?? "?"}`;
  return s.type;
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
export default function TemplateDetail() {
  useTemplateStyles();

  const { id = "" } = useParams();
  const nav   = useNavigate();
  const toast = useToast();

  const tplQ      = useTemplate(String(id));
  const previewQ  = useTemplatePreviewRuns(String(id), Boolean(id));
  const activate  = useActivateTemplate(String(id));
  const runsQ     = useTemplateRuns(String(id));
  const createRun = useCreateRun(String(id));

  /* ── loading ── */
  if (tplQ.isLoading) return (
    <div className="sh-page pg">
      <div className="pg-bg" />
      <div className="panel"><div className="panel-body"><SkeletonLoader lines={10} /></div></div>
    </div>
  );

  /* ── error ── */
  if (tplQ.isError) return (
    <div className="sh-page pg">
      <div className="pg-bg" />
      <div className="panel">
        <div className="panel-body">
          <div style={{textAlign:"center",padding:"3rem 1rem"}}>
            <div style={{color:"rgba(252,165,165,0.85)",marginBottom:".75rem",fontSize:".95rem",fontWeight:600}}>
              Failed to load template
            </div>
            <Link to="/employer" className="pg-back">← Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );

  const t        = tplQ.data as any;
  const preview  = previewQ.data;
  // Same pattern as RunDetail: employee_count_u32 lives on the run object, not the template.
  // Use the most recent run first, then fall back to any template-level field.
  const latestRun = Array.isArray(runsQ.data) && runsQ.data.length > 0 ? runsQ.data[0] : null;
  const empCount  =
    Number(latestRun?.employee_count_u32 ?? 0) ||
    Number(t?.employee_count_u32 ?? t?.employee_count ?? 0) ||
    (Array.isArray(t?.employees) ? t.employees.length : 0);
  const nextRunAt   = t?.next_run_at ?? preview?.next_run_at ?? t?.schedule?.next_run_at ?? null;
  const isInstant   = String(t?.schedule?.type ?? "").toLowerCase() === "instant";
  const hasExistingRun = Array.isArray(runsQ.data) && runsQ.data.length > 0;
  // One-time templates: block once a run exists. Recurring: require next_run_at.
  const canRun = isActive(t?.status) && !createRun.isPending &&
    (isInstant ? !hasExistingRun : Boolean(nextRunAt));

  // Derive "completed" — backend keeps status "active" even after all runs done.
  // A template is completed when it's instant+run exists, OR remaining runs hit 0 with runs present.
  const remainingRuns  = Number(preview?.future_count ?? -1);
  const isCompleted    =
    isActive(t?.status) && (
      (isInstant && hasExistingRun) ||
      (remainingRuns === 0 && hasExistingRun)
    );
  const derivedStatus  = isCompleted ? "completed" : t?.status;

  async function handleActivate() {
    try {
      await activate.mutateAsync();
      toast.push({ kind:"success", title:"Template activated" });
      tplQ.refetch(); previewQ.refetch();
    } catch(e:any) {
      toast.push({ kind:"error", title:"Activation failed", message: e?.message });
    }
  }

  async function handleCreateRun() {
    try {
      const run = await createRun.mutateAsync();
      toast.push({ kind:"success", title:"Payroll run created" });
      runsQ.refetch(); tplQ.refetch(); previewQ.refetch();
      nav(`/employer/runs/${run.id}`);
    } catch(e:any) {
      toast.push({ kind:"error", title:"Could not create run", message: e?.message });
    }
  }

  return (
    <div className="sh-page pg">
      <div className="pg-bg" />

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <div className="pg-hero">
        <div className="pg-hero-l">
          <div className="pg-tag">
            <span className="pg-tag-dot" />
            Payroll Template · #{t?.id}
          </div>
          <h1 className="pg-h1">
            {t?.title ?? "Template"}<br />
            <span className="blue">Template Detail</span>
          </h1>
          <div style={{display:"flex",alignItems:"center",gap:".65rem",flexWrap:"wrap",marginTop:".5rem"}}>
            <StatusBadge status={derivedStatus} />
            <span className="chip chip-blue">
              <span className="chip-dot" />
              {scheduleText(t?.schedule)}
            </span>
            <span className="chip chip-gray">{empCount} employees</span>
            <span className="chip chip-blue">cUSDC</span>
          </div>
        </div>
        <div className="pg-hero-r">
          <Link to="/employer" className="pg-back">← Dashboard</Link>
          {!isActive(t?.status) && !isCompleted && (
            <button
              className="pg-btn"
              disabled={activate.isPending}
              onClick={handleActivate}
            >
              {activate.isPending ? "Activating…" : "Activate Template"}
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TWO-COL
      ══════════════════════════════════════════════ */}
      <div className="two-col">

        {/* ════ LEFT: overview + schedule ════ */}
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem",minWidth:0}}>

          {/* Overview */}
          <div className="panel">
            <div className="panel-scan" />
            <div className="panel-head">
              <div className="panel-title">Overview</div>
            </div>
            <div className="panel-body">
              <div className="dg">
                <div className="dg-cell">
                  <div className="dg-key">Network</div>
                  <div className="dg-val">
                    <span className="pg-network">
                      <span className="pg-network-dot" />
                      Base Sepolia
                    </span>
                  </div>
                </div>
                <div className="dg-cell">
                  <div className="dg-key">Token</div>
                  <div className="dg-val mono">cUSDC</div>
                </div>
                <div className="dg-cell">
                  <div className="dg-key">Schedule</div>
                  <div className="dg-val">{scheduleText(t?.schedule)}</div>
                </div>
                <div className="dg-cell">
                  <div className="dg-key">Employees</div>
                  <div className="dg-val blue">{empCount}</div>
                </div>
                <div className="dg-cell">
                  <div className="dg-key">Start Date</div>
                  <div className="dg-val">{safeDate(t?.schedule?.start_at)}</div>
                </div>
                <div className="dg-cell">
                  <div className="dg-key">End Date</div>
                  <div className="dg-val">{safeDate(t?.schedule?.end_at)}</div>
                </div>
                <div className="dg-cell">
                  <div className="dg-key">Next Run</div>
                  <div className="dg-val">{safeDateTime(nextRunAt)}</div>
                </div>
                <div className="dg-cell">
                  <div className="dg-key">Remaining Runs</div>
                  <div className="dg-val blue">{preview?.future_count ?? "—"}</div>
                </div>
                {t?.last_run_at && (
                  <div className="dg-cell" style={{gridColumn:"1/-1"}}>
                    <div className="dg-key">Last Run</div>
                    <div className="dg-val">{safeDateTime(t.last_run_at)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming schedule */}
          <div className="panel">
            <div className="panel-scan" />
            <div className="panel-head">
              <div className="panel-title">Upcoming Schedule</div>
              {preview?.future_count && (
                <span className="chip chip-blue">{preview.future_count} runs</span>
              )}
            </div>
            <div className="panel-body">
              {previewQ.isLoading && <SkeletonLoader lines={4} />}

              {!previewQ.isLoading && !preview?.future_times?.length && (
                <p className="pg-empty-text" style={{margin:0}}>
                  No upcoming scheduled runs available.
                </p>
              )}

              {preview?.future_times?.length > 0 && (
                <div className="timeline">
                  {preview.future_times.slice(0, 6).map((iso: string, i: number) => (
                    <div className="tl-item" key={iso}>
                      <div className="tl-dot">
                        {i < preview.future_times.slice(0,6).length - 1 && (
                          <div className="tl-line" />
                        )}
                      </div>
                      <div>
                        <div className="tl-date">{safeDateTime(iso)}</div>
                        <div className="tl-label">Scheduled Run {i + 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ════ RIGHT: activation + payroll runs ════ */}
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem",minWidth:0}}>

          {/* Template Activation */}
          <div className="panel">
            <div className="panel-scan" />
            <div className="panel-head">
              <div>
                <div className="panel-title">Template Activation</div>
                <div className="panel-sub">Activate to start generating payroll runs.</div>
              </div>
              <StatusBadge status={derivedStatus} />
            </div>
            <div className="panel-body">
              {isCompleted ? (
                <div className="pg-active-note">
                  <span className="pg-active-dot" style={{background:"rgba(47,107,255,0.9)",boxShadow:"0 0 8px rgba(47,107,255,0.6)"}} />
                  <span className="pg-active-text" style={{color:"rgba(47,107,255,0.82)"}}>
                    {isInstant
                      ? "One-time payroll completed. All runs have been created."
                      : "All scheduled runs have been completed for this template."}
                  </span>
                </div>
              ) : isActive(t?.status) ? (
                <div className="pg-active-note">
                  <span className="pg-active-dot" />
                  <span className="pg-active-text">
                    This template is active. Payroll runs can be created.
                  </span>
                </div>
              ) : (
                <p className="pg-inactive-text" style={{margin:0}}>
                  Activating this template allows payroll runs to be scheduled and funded.
                  Once active, employees will be able to claim their salaries.
                </p>
              )}
            </div>
            {!isActive(t?.status) && !isCompleted && (
              <div className="panel-foot">
                <button
                  className="pg-btn"
                  disabled={activate.isPending}
                  onClick={handleActivate}
                >
                  {activate.isPending ? "Activating…" : "Activate Template"}
                </button>
              </div>
            )}
          </div>

          {/* Payroll Runs */}
          <div className="panel">
            <div className="panel-scan" />
            <div className="panel-head">
              <div>
                <div className="panel-title">Payroll Runs</div>
                <div className="panel-sub">Individual payroll cycles from this template.</div>
              </div>
              {runsQ.data?.length > 0 && (
                <span className="chip chip-gray">{runsQ.data.length} runs</span>
              )}
            </div>
            <div className="panel-body">
              {runsQ.isLoading && <SkeletonLoader lines={5} />}

              {runsQ.isError && (
                <p style={{color:"rgba(252,165,165,0.85)",fontSize:".84rem",margin:0}}>
                  Failed to load runs.
                </p>
              )}

              {!runsQ.isLoading && !runsQ.isError && (!runsQ.data || runsQ.data.length === 0) && (
                <p className="pg-empty-text" style={{margin:0}}>
                  {isActive(t?.status)
                    ? "No payroll runs yet. Create your first run to begin funding."
                    : "Activate this template to start creating payroll runs."}
                </p>
              )}

              {runsQ.data && runsQ.data.length > 0 && (
                <RunTable runs={runsQ.data} />
              )}
            </div>
            <div className="panel-foot">
              <button
                className="pg-btn"
                disabled={!canRun || createRun.isPending}
                onClick={handleCreateRun}
              >
                {createRun.isPending ? "Creating…" : "Create Payroll Run"}
              </button>
              {!isActive(t?.status) && (
                <span className="pg-hint">Activate template first</span>
              )}
              {isActive(t?.status) && isInstant && hasExistingRun && (
                <span className="pg-hint">One-time run already created</span>
              )}
              {isActive(t?.status) && !isInstant && !nextRunAt && (
                <span className="pg-hint">Next run time unavailable</span>
              )}
            </div>
          </div>

        </div>
      </div>

      <EmpFooter />
    </div>
  );
}