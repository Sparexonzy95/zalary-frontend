import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../../ui/StatusBadge";
import type { PayrollRun } from "./types";
import { runStatusLabel, runStatusTone } from "./statusMapping";
import { formatAtomicToDisplay } from "./amounts";

const USDC_DECIMALS = 6;

/* ── CSS injected once ── */
const RUN_TABLE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap');

/* ── run table wrap ── */
.rd-run-table-wrap {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid rgba(47, 107, 255, 0.12);
}

/* ── table ── */
.rd-run-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
}

/* head */
.rd-run-table thead tr {
  background: rgba(47, 107, 255, 0.05);
  border-bottom: 1px solid rgba(47, 107, 255, 0.12);
}
.rd-run-table th {
  padding: 10px 14px;
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: rgba(210, 222, 255, 0.28);
  text-transform: uppercase;
  text-align: left;
  white-space: nowrap;
}
.rd-run-table th.rd-th-right { text-align: right; }

/* body rows */
.rd-run-table tbody tr {
  border-bottom: 1px solid rgba(47, 107, 255, 0.07);
  transition: background 0.15s;
}
.rd-run-table tbody tr:last-child { border-bottom: none; }
.rd-run-table tbody tr:hover { background: rgba(47, 107, 255, 0.03); }

/* cells */
.rd-run-table td {
  padding: 11px 14px;
  color: rgba(210, 222, 255, 0.72);
  vertical-align: middle;
  white-space: nowrap;
}
.rd-run-table td.rd-td-right { text-align: right; }

/* id cell — monospace address style */
.rd-run-id {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: rgba(47, 107, 255, 0.75);
  background: rgba(47, 107, 255, 0.07);
  border: 1px solid rgba(47, 107, 255, 0.14);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

/* run name — slightly brighter */
.rd-run-name {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.82);
  font-weight: 700;
  letter-spacing: 0.01em;
}

/* numeric value */
.rd-run-val {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.65);
}

/* usdc amount in blue */
.rd-run-amount {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(47, 107, 255, 0.85);
  font-weight: 700;
}

/* ── view link button ── */
.rd-run-view-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  background: rgba(47, 107, 255, 0.85);
  border: 1px solid rgba(47, 107, 255, 1);
  border-radius: 5px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(210, 222, 255, 0.97);
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}
.rd-run-view-btn:hover {
  background: rgba(47, 107, 255, 1);
  box-shadow: 0 0 16px rgba(47, 107, 255, 0.28);
}

/* ── empty state ── */
.rd-run-empty {
  padding: 32px 16px;
  text-align: center;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.2);
  letter-spacing: 0.06em;
}
`;

function useRunTableStyles() {
  React.useEffect(() => {
    const id = "rd-run-table-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = RUN_TABLE_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

/* ── helpers — unchanged ── */
function humanDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function runNameFromRunAt(runAt: string) {
  const dt    = new Date(runAt);
  const month = dt.toLocaleDateString(undefined, { month: "long" });
  const year  = dt.getFullYear();
  return `${month} ${year} Payroll`;
}

/* ── component ── */
export default function RunTable({ runs }: { runs: PayrollRun[] }) {
  useRunTableStyles();

  if (!runs || runs.length === 0) {
    return (
      <div className="rd-run-empty">
        No payroll runs yet
      </div>
    );
  }

  return (
    <div className="rd-run-table-wrap">
      <table className="rd-run-table">
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Run Name</th>
            <th>Created</th>
            <th>Employees</th>
            <th>Total</th>
            <th>Status</th>
            <th className="rd-th-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const total = formatAtomicToDisplay(r.required_total_atomic ?? 0, USDC_DECIMALS);
            return (
              <tr key={r.id}>

                {/* ID */}
                <td>
                  <span className="rd-run-id">#{r.id}</span>
                </td>

                {/* Run Name */}
                <td>
                  <span className="rd-run-name">{runNameFromRunAt(r.run_at)}</span>
                </td>

                {/* Created date */}
                <td>
                  <span className="rd-run-val">
                    {r.created_at ? humanDate(r.created_at) : "—"}
                  </span>
                </td>

                {/* Employee count */}
                <td>
                  <span className="rd-run-val">
                    {Number(r.employee_count_u32 ?? 0)}
                  </span>
                </td>

                {/* Payroll total */}
                <td>
                  <span className="rd-run-amount">
                    {Number(total).toLocaleString()} USDC
                  </span>
                </td>

                {/* Status badge */}
                <td>
                  <StatusBadge tone={runStatusTone(r.status)}>
                    {runStatusLabel(r.status)}
                  </StatusBadge>
                </td>

                {/* View action */}
                <td className="rd-td-right">
                  <Link className="rd-run-view-btn" to={`/employer/runs/${r.id}`}>
                    View →
                  </Link>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}