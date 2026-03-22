import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../../ui/StatusBadge";
import type { PayrollTemplate } from "./types";

const PAGE = 10;

/* ── helpers ── */
function date(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}
function schedule(t: PayrollTemplate) {
  if (t.schedule?.type === "instant") return { label: "One-time", icon: "clock" };
  if (t.schedule?.type === "weekly")  return { label: "Weekly",   icon: "week" };
  return { label: "Monthly", icon: "month" };
}

/* ── Derive completed status — same logic as TemplateDetail ── */
function deriveStatus(t: PayrollTemplate): string {
  return String(t.status || "").toLowerCase();
}

/* ── Employee count — same pattern as RunDetail ── */
function getEmpCount(t: PayrollTemplate): number {
  return (
    Number((t as any).employee_count_u32 ?? 0) ||
    Number((t as any).employee_count ?? 0) ||
    (Array.isArray((t as any).employees) ? (t as any).employees.length : 0)
  );
}

/* ── Schedule icon ── */
function SchedIcon({ type }: { type?: string }) {
  if (type === "instant") return (
    <svg width="10" height="10" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="10" cy="10" r="8"/><path d="M10 6v4l2.5 2.5"/>
    </svg>
  );
  if (type === "weekly") return (
    <svg width="10" height="10" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="2" y="3" width="16" height="14" rx="2"/>
      <path d="M6 1v4M14 1v4M2 9h16"/>
    </svg>
  );
  return (
    <svg width="10" height="10" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="2" y="3" width="16" height="14" rx="2"/>
      <path d="M2 9h16M6 1v4M14 1v4M6 13h2M10 13h2"/>
    </svg>
  );
}

/* ── Pagination — unchanged ── */
function Pager({ page, total, onChange }: {
  page: number; total: number; onChange: (p: number) => void;
}) {
  const pages = Math.ceil(total / PAGE);
  if (pages <= 1) return null;

  const items: (number | "…")[] = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) items.push(i);
  } else {
    items.push(1);
    if (page > 3) items.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) items.push(i);
    if (page < pages - 2) items.push("…");
    items.push(pages);
  }

  return (
    <div className="tt-pager">
      <span className="tt-pager-info">
        {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, total)} of {total}
      </span>
      <div className="tt-pager-btns">
        <button className="tt-pager-btn" disabled={page === 1}
          onClick={() => onChange(page - 1)}>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 16l-6-6 6-6"/>
          </svg>
        </button>
        {items.map((it, i) =>
          it === "…"
            ? <span key={`e${i}`} className="tt-pager-ell">…</span>
            : <button key={it}
                className={`tt-pager-btn${it === page ? " on" : ""}`}
                onClick={() => onChange(it as number)}>
                {it}
              </button>
        )}
        <button className="tt-pager-btn" disabled={page === pages}
          onClick={() => onChange(page + 1)}>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 4l6 6-6 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function TemplateTable({ templates }: { templates: PayrollTemplate[] }) {
  const [page, setPage] = React.useState(1);
  React.useEffect(() => { setPage(1); }, [templates.length]);

  const slice = templates.slice((page - 1) * PAGE, page * PAGE);

  return (
    <div className="tt">

      {/* header */}
      <div className="tt-head">
        <span className="tt-hc tt-hc-name">Template</span>
        <span className="tt-hc">Schedule</span>
        <span className="tt-hc">Network</span>
        <span className="tt-hc tt-hc-r">Employees</span>
        <span className="tt-hc">Start Date</span>
        <span className="tt-hc">Status</span>
        <span className="tt-hc tt-hc-r">Open</span>
      </div>

      {/* rows */}
      {slice.map((t, i) => {
        const sc           = schedule(t);
        const emp          = getEmpCount(t);        // fixed — reads employee_count_u32
        const derivedStatus = deriveStatus(t);      // fixed — shows "completed" when done

        return (
          <Link
            key={t.id}
            to={`/employer/templates/${t.id}`}
            className="tt-row"
            style={{ "--delay": `${i * 0.7}s` } as React.CSSProperties}
          >
            {/* name */}
            <div className="tt-c tt-c-name">
              <div className="tt-name">{t.title}</div>
              <div className="tt-meta">
                <span className="tt-meta-dot" />
                <span className="tt-id">#{t.id}</span>
              </div>
            </div>

            {/* schedule */}
            <div className="tt-c">
              <span className="tt-chip">
                <SchedIcon type={t.schedule?.type} />
                {sc.label}
              </span>
            </div>

            {/* network */}
            <div className="tt-c">
              <span className="tt-chip tt-chip-net">
                <span className="tt-net-dot" />
                Base Sepolia
              </span>
            </div>

            {/* employees */}
            <div className="tt-c tt-c-r">
              <span className="tt-num">
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <circle cx="8" cy="6" r="3"/>
                  <path d="M2 18c0-3.3 2.7-6 6-6h.5"/>
                  <circle cx="15" cy="13" r="3"/>
                </svg>
                {emp}
              </span>
            </div>

            {/* date */}
            <div className="tt-c">
              <span className="tt-date">
                {t.schedule?.start_at ? date(t.schedule.start_at) : "—"}
              </span>
            </div>

            {/* status — now uses derivedStatus */}
            <div className="tt-c">
              <StatusBadge status={derivedStatus} />
            </div>

            {/* arrow */}
            <div className="tt-c tt-c-r">
              <span className="tt-arrow">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M5 10h10M11 6l4 4-4 4"/>
                </svg>
              </span>
            </div>
          </Link>
        );
      })}

      {/* pagination */}
      <Pager page={page} total={templates.length} onChange={setPage} />
    </div>
  );
}