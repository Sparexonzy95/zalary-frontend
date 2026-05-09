import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { formatAtomicToDisplay } from "../../lib/format";
import { routes } from "../../lib/routes";
import { useOnboarding } from "../../lib/onboarding";
import { runSortValue } from "../../lib/payrollStatus";
import { readPublicUsdcBalance } from "../../lib/payrollTransactions";
import { Card, StatusBadge, EmptyState } from "../../components/ui";
import type { Claim, PayrollRun, PayrollTemplate } from "../../lib/types";
import "../../styles/employer-dashboard.css";

type TemplateFilter = "all" | "active" | "draft" | "failed" | "completed";

type TemplateListResponse =
  | PayrollTemplate[]
  | {
      results?: PayrollTemplate[];
      count?: number;
    };

type TemplateLike = PayrollTemplate & {
  employee_count?: number;
  employees_count?: number;
  employee_count_u32?: number;
};


const PAYROLL_PAGE_SIZE = 8;

const FILTER_OPTIONS: { value: TemplateFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "failed", label: "Failed" },
  { value: "completed", label: "Completed" },
];

function normalizeTemplates(data: TemplateListResponse | undefined) {
  if (!data) return [];
  if (Array.isArray(data)) return data as TemplateLike[];
  return Array.isArray(data.results) ? (data.results as TemplateLike[]) : [];
}

function normalizeStatus(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isFailedStatus(status: string) {
  return (
    status.includes("failed") ||
    status.includes("cancelled") ||
    status.includes("error") ||
    status.includes("revert")
  );
}

const WITHDRAWAL_DONE_STATUSES = new Set([
  "withdrawn",
  "withdraw_complete",
  "withdraw_completed",
  "withdrawal_complete",
  "withdrawal_completed",
  "finalized_success",
]);

function normalizeClaims(data: unknown): Claim[] {
  if (Array.isArray(data)) return data as Claim[];
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.results)) return d.results as Claim[];
  }
  return [];
}

function allClaimsWithdrawn(run: PayrollRun, claims: Claim[]): boolean {
  const expected = run.employee_count_u32;
  if (!expected || expected <= 0) return false;
  if (claims.length < expected) return false;
  return claims.every((claim) => {
    const w = normalizeStatus(claim.withdraw_status ?? "");
    const s = normalizeStatus(claim.status);
    return WITHDRAWAL_DONE_STATUSES.has(w) || WITHDRAWAL_DONE_STATUSES.has(s);
  });
}

function effectiveTemplateStatus(
  template: TemplateLike,
  runs?: PayrollRun[],
  claims: Claim[] = [],
): TemplateFilter {
  const templateStatus = normalizeStatus(template.status);
  const latestRun = runs?.[0];

  if (!latestRun) {
    if (templateStatus === "completed") return "completed";
    if (templateStatus === "failed") return "failed";
    if (templateStatus === "active") return "active";
    return "draft";
  }

  const runStatus = normalizeStatus(latestRun.status);

  if (isFailedStatus(runStatus)) return "failed";

  if (runStatus === "completed" || runStatus === "finalized_success" || runStatus === "closed") {
    return "completed";
  }

  if (runStatus === "active" && allClaimsWithdrawn(latestRun, claims)) {
    return "completed";
  }

  return "active";
}

function formatUsdcBalance(value?: bigint | null) {
  const display = formatAtomicToDisplay(value ?? 0n, 6);
  const [whole, fraction = ""] = display.split(".");
  const wholeWithCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedFraction = fraction.slice(0, 4);

  return trimmedFraction
    ? `${wholeWithCommas}.${trimmedFraction}`
    : wholeWithCommas;
}

function templateEmployeesCount(template: TemplateLike) {
  if (typeof template.employee_count === "number") {
    return template.employee_count;
  }

  if (typeof template.employees_count === "number") {
    return template.employees_count;
  }

  if (typeof template.employee_count_u32 === "number") {
    return template.employee_count_u32;
  }

  return template.employees?.length ?? 0;
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`filter-tab${active ? " active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function EmployerDashboardPage() {
  const { profile, activeWallet } = useOnboarding();

  const wallet = useMemo(() => {
    return String(profile?.wallet_address || activeWallet || "").toLowerCase();
  }, [activeWallet, profile?.wallet_address]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TemplateFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const templatesQuery = useQuery({
    queryKey: ["zama", "templates", wallet],
    enabled: Boolean(wallet),
    queryFn: async () => {
      const res = await api.get<TemplateListResponse>(routes.templates.list, {
        params: {
          employer_address: wallet,
        },
      });

      return normalizeTemplates(res.data);
    },
    refetchInterval: 15_000,
  });

  const usdcBalanceQuery = useQuery({
    queryKey: ["zama", "usdcBalance", wallet],
    enabled: Boolean(wallet),
    queryFn: () => readPublicUsdcBalance(wallet),
    refetchInterval: 15_000,
  });

  const templates = templatesQuery.data ?? [];

  const templateRunsQueries = useQueries({
    queries: templates.map((template) => ({
      queryKey: ["zama", "templateRuns", String(template.id)],
      enabled: Boolean(wallet && template.id),
      queryFn: async () => {
        const res = await api.get<PayrollRun[]>(
          routes.templates.runs(template.id)
        );

        return res.data;
      },
      refetchInterval: 15_000,
    })),
  });

  const templateRunsById = useMemo(() => {
    const map = new Map<number, PayrollRun[]>();

    templateRunsQueries.forEach((query, index) => {
      const template = templates[index];

      if (template) {
        const sortedRuns = [...((query.data ?? []) as PayrollRun[])].sort(
          (a, b) => runSortValue(b) - runSortValue(a)
        );

        map.set(Number(template.id), sortedRuns);
      }
    });

    return map;
  }, [templates, templateRunsQueries]);

  const activeRunIds = useMemo(() => {
    return templates.flatMap((template) => {
      const runs = templateRunsById.get(Number(template.id));
      const latestRun = runs?.[0];
      if (!latestRun || normalizeStatus(latestRun.status) !== "active") return [];
      return [latestRun.id];
    });
  }, [templates, templateRunsById]);

  const runClaimsQueries = useQueries({
    queries: activeRunIds.map((runId) => ({
      queryKey: ["zama", "runClaims", String(runId)],
      enabled: Boolean(wallet),
      queryFn: async () => {
        const { data } = await api.get(routes.claims.list, { params: { run: runId } });
        return normalizeClaims(data);
      },
      refetchInterval: 10_000,
    })),
  });

  const claimsByRunId = useMemo(() => {
    const map = new Map<number, Claim[]>();
    runClaimsQueries.forEach((query, i) => {
      const runId = activeRunIds[i];
      if (typeof runId === "number") {
        map.set(runId, query.data ?? []);
      }
    });
    return map;
  }, [activeRunIds, runClaimsQueries]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();

    return templates.filter((template) => {
      const templateRuns = templateRunsById.get(Number(template.id));
      const latestRunId = templateRuns?.[0]?.id;
      const claims = typeof latestRunId === "number" ? (claimsByRunId.get(latestRunId) ?? []) : [];
      const status = effectiveTemplateStatus(template, templateRuns, claims);

      const matchesFilter = filter === "all" ? true : status === filter;

      const matchesSearch =
        !q ||
        String(template.id).includes(q) ||
        String(template.title || "").toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [templates, templateRunsById, claimsByRunId, search, filter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTemplates.length / PAYROLL_PAGE_SIZE)
  );

  const currentPageStart = (currentPage - 1) * PAYROLL_PAGE_SIZE;

  const currentPageTemplates = filteredTemplates.slice(
    currentPageStart,
    currentPageStart + PAYROLL_PAGE_SIZE
  );

  const visibleStart =
    filteredTemplates.length === 0 ? 0 : currentPageStart + 1;

  const visibleEnd = Math.min(
    filteredTemplates.length,
    currentPageStart + PAYROLL_PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [wallet, search, filter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    function handleCloseMenu() {
      setFilterMenuOpen(false);
    }

    window.addEventListener("click", handleCloseMenu);

    return () => {
      window.removeEventListener("click", handleCloseMenu);
    };
  }, []);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  }

  const activeFilterLabel =
    FILTER_OPTIONS.find((option) => option.value === filter)?.label ?? "Filter";

  return (
    <div className="stack dashboard-shell dashboard-shell-employer employer-dashboard-premium">
      {!wallet && (
        <Card title="Connect wallet first" className="employer-connect-card">
          <p className="muted">
            Connect your employer wallet to view payroll, balance, funding
            needs, and pending actions.
          </p>
        </Card>
      )}

      {wallet && (
        <>
          <div
            className="page-header employee-claims-header-card employer-dashboard-head"
            data-tour="employer-hero"
          >
            <div className="employer-head-copy">
              <h1>Employer Dashboard</h1>
            </div>

            <div className="employer-head-side">
              <div className="employer-head-balance">
                <span>USDC Balance</span>
                <strong>
                  {usdcBalanceQuery.isLoading
                    ? "Loading"
                    : usdcBalanceQuery.isError
                      ? "Unavailable"
                      : formatUsdcBalance(usdcBalanceQuery.data)}
                  {!usdcBalanceQuery.isLoading && !usdcBalanceQuery.isError && (
                    <small> USDC</small>
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div className="employer-dashboard-content">
            <div data-tour="employer-templates">
              <Card
                className="employee-claims-card employer-payroll-card"
                title="Your Payroll"
                actions={
                  <Link
                    className="btn btn-small employer-payroll-create-btn"
                    to="/employer/templates/new"
                    data-tour="employer-new-template"
                  >
                    <Plus size={14} strokeWidth={1.9} />
                    New Payroll
                  </Link>
                }
              >
                <div className="stack">
                  <div className="employer-payroll-toolbar">
                    <input
                      className="employer-payroll-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by name or ID..."
                    />

                    <div
                      className="employer-payroll-filter-area"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="employer-payroll-filter-trigger"
                        aria-expanded={filterMenuOpen}
                        aria-haspopup="menu"
                        aria-label="Filter payroll"
                        onClick={() => setFilterMenuOpen((open) => !open)}
                      >
                        <SlidersHorizontal size={15} strokeWidth={1.9} />
                        <span>{activeFilterLabel}</span>
                      </button>

                      {filterMenuOpen && (
                        <div
                          className="employer-payroll-filter-menu"
                          role="menu"
                        >
                          {FILTER_OPTIONS.map((option) => {
                            const active = filter === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                className={active ? "active" : ""}
                                onClick={() => {
                                  setFilter(option.value);
                                  setFilterMenuOpen(false);
                                }}
                              >
                                <span>{option.label}</span>
                                {active && <Check size={14} strokeWidth={2} />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="filter-tabs employer-payroll-filters">
                        {FILTER_OPTIONS.map((option) => (
                          <FilterButton
                            key={option.value}
                            active={filter === option.value}
                            onClick={() => setFilter(option.value)}
                          >
                            {option.label}
                          </FilterButton>
                        ))}
                      </div>
                    </div>
                  </div>

                  {templatesQuery.isLoading && (
                    <div className="employer-payroll-loading">
                      Loading payroll...
                    </div>
                  )}

                  {templatesQuery.isError && (
                    <div className="employer-payroll-error">
                      Could not load payroll.
                    </div>
                  )}

                  {!templatesQuery.isLoading &&
                    !templatesQuery.isError &&
                    templates.length === 0 && (
                      <div className="employer-payroll-empty-shell">
                        <EmptyState
                          title="No payroll yet"
                          description="Create your first payroll to get started."
                          action={
                            <Link className="btn" to="/employer/templates/new">
                              Create Payroll
                            </Link>
                          }
                        />
                      </div>
                    )}

                  {!templatesQuery.isLoading &&
                    !templatesQuery.isError &&
                    templates.length > 0 &&
                    filteredTemplates.length === 0 && (
                      <div className="employer-payroll-empty-message">
                        No payroll matches your current filter.
                      </div>
                    )}

                  {!templatesQuery.isLoading &&
                    !templatesQuery.isError &&
                    filteredTemplates.length > 0 && (
                      <>
                        <div className="employer-payroll-table-wrap">
                          <table className="table employee-claims-table employer-payroll-table">
                            <thead>
                              <tr>
                                <th>Payroll</th>
                                <th>Employees</th>
                                <th>Status</th>
                              </tr>
                            </thead>

                            <tbody>
                              {currentPageTemplates.map((template) => {
                                const payrollName =
                                  template.title || `Payroll #${template.id}`;

                                const templateRuns = templateRunsById.get(
                                  Number(template.id)
                                );

                                const latestRunId = templateRuns?.[0]?.id;
                                const claims = typeof latestRunId === "number" ? (claimsByRunId.get(latestRunId) ?? []) : [];
                                const status = effectiveTemplateStatus(template, templateRuns, claims);

                                return (
                                  <tr key={template.id}>
                                    <td>
                                      <strong>{payrollName}</strong>
                                    </td>

                                    <td>{templateEmployeesCount(template)}</td>

                                    <td>
                                      <Link
                                        className="employer-payroll-status-link"
                                        to={`/employer/templates/${template.id}`}
                                        aria-label={`Open ${payrollName}`}
                                      >
                                        <StatusBadge value={status} />
                                        <ArrowRight
                                          size={14}
                                          strokeWidth={2}
                                        />
                                      </Link>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {totalPages > 1 && (
                          <div
                            className="employee-claims-pagination employer-payroll-pagination"
                            aria-label="Payroll pagination"
                          >
                            <span>
                              Showing {visibleStart}-{visibleEnd} of{" "}
                              {filteredTemplates.length}
                            </span>

                            <div className="employee-claims-pagination-controls employer-payroll-pagination-controls">
                              <button
                                type="button"
                                className="employee-claims-page-btn employer-payroll-page-btn"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                aria-label="Previous payroll page"
                              >
                                <ChevronLeft size={15} strokeWidth={2} />
                              </button>

                              <span className="employee-claims-page-count employer-payroll-page-count">
                                {currentPage} / {totalPages}
                              </span>

                              <button
                                type="button"
                                className="employee-claims-page-btn employer-payroll-page-btn"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                aria-label="Next payroll page"
                              >
                                <ChevronRight size={15} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
