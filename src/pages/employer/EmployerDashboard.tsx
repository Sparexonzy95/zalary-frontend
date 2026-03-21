import React from "react";
import { Link } from "react-router-dom";
import SkeletonLoader from "../../ui/SkeletonLoader";
import TemplateTable from "../../features/templates/TemplateTable";
import { useTemplatesList } from "../../hooks/useTemplates";
import { useWallet } from "../../lib/WalletContext";
import { useToast } from "../../ui/Toast";
import EmpFooter from "../../ui/EmpFooter";
import "../../styles/employer-pages.css";

type FilterStatus = "all" | "active" | "draft" | "failed" | "completed";
type SortKey = "date" | "name" | "employees" | "status";

function deriveStatus(t: any): string {
  const raw       = String(t.status || "").toLowerCase();
  const isAct     = raw === "active";
  const isInstant = String(t.schedule?.type ?? "").toLowerCase() === "instant";
  const remaining = Number(t.remaining_runs ?? t.future_count ?? -1);
  const hasRun    = Boolean(t.last_run_at) || remaining === 0;
  const done      = isAct && ((isInstant && hasRun) || (remaining === 0 && hasRun));
  return done ? "completed" : raw;
}

function StatBlock({ val, unit, label }: { val: string | number; unit?: string; label: string }) {
  return (
    <div className="db-stat">
      <div className="db-stat-val">{val}<em>{unit}</em></div>
      <div className="db-stat-lbl">{label}</div>
    </div>
  );
}

export default function EmployerDashboard() {
  const { wallet, connect } = useWallet();
  const toast = useToast();

  /* Only fetches when wallet is known — prevents showing other wallets' templates */
  const q = useTemplatesList(wallet || undefined);

  const [search,  setSearch]  = React.useState("");
  const [filter,  setFilter]  = React.useState<FilterStatus>("all");
  const [sort,    setSort]    = React.useState<SortKey>("date");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const templates = q.data ?? [];
  const total     = templates.length;
  const active    = templates.filter(t => deriveStatus(t) === "active").length;
  const draft     = templates.filter(t => deriveStatus(t) === "draft").length;
  const failed    = templates.filter(t => deriveStatus(t) === "failed").length;
  const completed = templates.filter(t => deriveStatus(t) === "completed").length;

  const filtered = React.useMemo(() => {
    let list = [...templates];
    if (filter !== "all")
      list = list.filter(t => deriveStatus(t) === filter);
    const sq = search.trim().toLowerCase();
    if (sq)
      list = list.filter(t => t.title.toLowerCase().includes(sq) || String(t.id).includes(sq));
    list.sort((a, b) => {
      const av =
        sort === "name"      ? a.title.toLowerCase() :
        sort === "employees" ? (Array.isArray(a.employees) ? a.employees.length : 0) :
        sort === "status"    ? a.status :
                               (a.schedule?.start_at ?? "");
      const bv =
        sort === "name"      ? b.title.toLowerCase() :
        sort === "employees" ? (Array.isArray(b.employees) ? b.employees.length : 0) :
        sort === "status"    ? b.status :
                               (b.schedule?.start_at ?? "");
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [templates, filter, search, sort, sortDir]);

  async function handleConnect() {
    try { await connect(); toast.push({ kind: "success", title: "Wallet connected" }); }
    catch (e: any) { toast.push({ kind: "error", title: "Connection failed", message: e?.message }); }
  }

  return (
    <div className="sh-page db-root">
      <div className="db-bg-dots" />
      <div className="db-bg-bloom" />

      {/* ── header ── */}
      <div className="db-header">
        <div className="db-header-left">
          <div className="db-sec-tag">
            <span className="db-tag-dot" />
            Employer Dashboard
          </div>
          <h1 className="db-h1">
            Payroll<br />
            <span className="db-h1-blue">Templates</span>
          </h1>
          <p className="db-lead">
            Create a payroll template to define your schedule, employee roster,
            and funding token. Each template generates automated runs on Base Sepolia.
          </p>
        </div>

        <div className="db-header-right" style={{ alignItems: "flex-end", justifyContent: "flex-end" }}>
          {/* action row — only New Template button, no wallet UI (navbar handles it) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
            {wallet && (
              <Link to="/employer/templates/new" className="db-create-btn">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M10 4v12M4 10h12"/>
                </svg>
                New Template
              </Link>
            )}
          </div>

          {/* stat bar */}
          {wallet && !q.isLoading && total > 0 && (
            <div className="db-stats-bar">
              <StatBlock val={total}  label="Templates" />
              <span className="db-stat-div" />
              <StatBlock val={active} label="Active" />
              <span className="db-stat-div" />
              <StatBlock val={draft}  label="Draft" />
              <span className="db-stat-div" />
              <StatBlock val="0%" unit="" label="Plaintext" />
            </div>
          )}
        </div>
      </div>

      {/* ── no wallet ── */}
      {!wallet && (
        <div className="db-section">
          <div className="db-body">
            <div className="db-empty-state">
              <div className="db-es-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                  <circle cx="12" cy="14" r="1.5"/>
                </svg>
              </div>
              <div className="db-es-title">Connect your wallet</div>
              <p className="db-es-desc">
                Connect your employer wallet using the button in the top-right navbar.
                Only templates created by your wallet address will be shown.
              </p>
              <button className="db-create-btn" onClick={handleConnect}>
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── table ── */}
      {wallet && (
        <div className="db-section">
          <div className="db-section-head">
            <div className="db-section-title">
              <div className="db-sec-tag db-sec-tag--sm">Your Templates</div>
              {!q.isLoading && (
                <span className="db-count">{filtered.length} of {total}</span>
              )}
            </div>

            {total > 0 && (
              <div className="db-toolbar">
                <div className="db-search-box">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none"
                    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <circle cx="9" cy="9" r="6"/><path d="M18 18l-3.5-3.5"/>
                  </svg>
                  <input
                    className="db-search-input"
                    placeholder="Search by name or ID…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="db-search-x" onClick={() => setSearch("")}>✕</button>
                  )}
                </div>

                <div className="db-filters">
                  {(["all","active","draft","failed","completed"] as FilterStatus[]).map(f => (
                    <button
                      key={f}
                      className={`db-filter${filter === f ? " db-filter--on" : ""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                      {f === "active"    && active    > 0 ? <span className="db-f-cnt">{active}</span>    : null}
                      {f === "draft"     && draft     > 0 ? <span className="db-f-cnt">{draft}</span>     : null}
                      {f === "failed"    && failed    > 0 ? <span className="db-f-cnt red">{failed}</span> : null}
                      {f === "completed" && completed > 0 ? <span className="db-f-cnt">{completed}</span> : null}
                    </button>
                  ))}
                </div>

                <div className="db-sort">
                  <span className="db-sort-lbl">Sort by</span>
                  <select
                    className="db-sort-sel"
                    value={sort}
                    onChange={e => { setSort(e.target.value as SortKey); setSortDir("desc"); }}
                  >
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="employees">Employees</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    className="db-sort-dir"
                    onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                    title={sortDir === "asc" ? "Ascending" : "Descending"}
                  >
                    {sortDir === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="db-body">
            {q.isLoading && <div className="db-loader"><SkeletonLoader lines={10} /></div>}

            {q.isError && (
              <div className="db-empty-state">
                <div className="db-es-icon db-es-icon--err">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                </div>
                <div className="db-es-title">Failed to load templates</div>
                <p className="db-es-desc">Could not reach the server. Check your connection and try again.</p>
                <button className="btn btn-secondary" onClick={() => q.refetch()}>Retry</button>
              </div>
            )}

            {!q.isLoading && !q.isError && total === 0 && (
              <div className="db-empty-state">
                <div className="db-es-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8M12 17v4"/>
                    <path d="M9 10h6M9 7h4"/>
                  </svg>
                </div>
                <div className="db-es-title">No payroll templates yet</div>
                <p className="db-es-desc">
                  You haven't created any templates with this wallet. Create your first one to get started.
                </p>
                <Link to="/employer/templates/new" className="db-create-btn">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M10 4v12M4 10h12"/>
                  </svg>
                  Create your first template
                </Link>
              </div>
            )}

            {!q.isLoading && !q.isError && total > 0 && filtered.length === 0 && (
              <div className="db-empty-state">
                <div className="db-es-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>
                <div className="db-es-title">No results</div>
                <p className="db-es-desc">
                  {search ? `"${search}" doesn't match any templates.` : `No ${filter} templates found.`}
                </p>
                <button className="btn btn-secondary"
                  onClick={() => { setSearch(""); setFilter("all"); }}>
                  Clear filters
                </button>
              </div>
            )}

            {!q.isLoading && !q.isError && filtered.length > 0 && (
              <TemplateTable templates={filtered} />
            )}
          </div>
        </div>
      )}

      <EmpFooter />
    </div>
  );
}