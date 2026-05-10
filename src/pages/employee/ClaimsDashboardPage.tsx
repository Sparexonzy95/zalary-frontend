import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";
import { routes } from "../../lib/routes";
import { useWallet } from "../../lib/wallet";
import type { Claimable } from "../../lib/types";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { statusClass } from "../../lib/format";

type ClaimableItem = Claimable & Record<string, any>;

const CLAIMS_PAGE_SIZE = 8;

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();

    if (text && text !== "null" && text !== "undefined") {
      return text;
    }
  }

  return "";
}

function normalizeWallet(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizeClaimables(data: unknown): ClaimableItem[] {
  if (Array.isArray(data)) return data as ClaimableItem[];

  if (data && typeof data === "object") {
    const obj = data as {
      results?: unknown;
      claimables?: unknown;
      data?: unknown;
      items?: unknown;
    };

    if (Array.isArray(obj.results)) return obj.results as ClaimableItem[];
    if (Array.isArray(obj.claimables)) return obj.claimables as ClaimableItem[];
    if (Array.isArray(obj.data)) return obj.data as ClaimableItem[];
    if (Array.isArray(obj.items)) return obj.items as ClaimableItem[];
  }

  return [];
}

function isClaimedStatus(status?: string | null) {
  return [
    "claimed",
    "completed",
    "complete",
    "finalized",
    "finalized_success",
  ].includes(String(status ?? "").toLowerCase());
}

function isFailedClaimStatus(status?: string | null) {
  return ["failed", "finalized_revert", "error", "cancelled"].includes(
    String(status ?? "").toLowerCase(),
  );
}

function displayClaimStatus(status?: string | null) {
  if (isClaimedStatus(status)) return "Claimed";
  if (isFailedClaimStatus(status)) return "Failed";
  return "Claim";
}

function companyNameOf(item: ClaimableItem) {
  return (
    firstText(
      item.company_name,
      item.employer_company_name,
      item.employer_name,
      item.employer?.company_name,
      item.employer?.name,
      item.template?.company_name,
      item.template?.employer_company_name,
      item.template?.employer_name,
      item.template?.employer?.company_name,
      item.template?.employer?.name,
    ) || "Company"
  );
}

function payrollNameOf(item: ClaimableItem) {
  const fallbackId = item.template_id ?? item.run_id;

  return (
    firstText(
      item.payroll_name,
      item.payroll_title,
      item.template_title,
      item.template?.title,
    ) || (fallbackId ? `Payroll #${fallbackId}` : "Payroll")
  );
}

function createdAtOf(item: ClaimableItem) {
  return firstText(item.created_at, item.run_at);
}

function displayTimestamp(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

function claimPath(item: ClaimableItem, claimId: number | string) {
  const params = new URLSearchParams();

  params.set("runId", String(item.run_id));

  if (item.onchain_payroll_id) {
    params.set("payrollId", String(item.onchain_payroll_id));
  }

  if (isClaimedStatus(item.claim_status)) {
    params.set("tab", "transactions");
  }

  return `/employee/claims/${claimId}?${params.toString()}`;
}

function actionLabel(item: ClaimableItem) {
  if (isClaimedStatus(item.claim_status)) return "View History";
  if (isFailedClaimStatus(item.claim_status)) return "Review Claim";
  return "Proceed to Claim";
}

function mobileActionLabel(item: ClaimableItem) {
  if (isClaimedStatus(item.claim_status)) return "View";
  if (isFailedClaimStatus(item.claim_status)) return "Review";
  return "Claim";
}

function claimSortPriority(item: ClaimableItem) {
  if (isClaimedStatus(item.claim_status)) return 2;
  if (isFailedClaimStatus(item.claim_status)) return 1;
  return 0;
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        -
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status ${statusClass(value)}`}>{value}</span>;
}

export function ClaimsDashboardPage() {
  const { wallet, connect } = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeWallet = normalizeWallet(wallet);

  const [openingRunId, setOpeningRunId] = useState<number | null>(null);
  const [openError, setOpenError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const claimablesQuery = useQuery({
    queryKey: ["claimables", activeWallet],
    queryFn: async () => {
      const address = normalizeWallet(wallet || (await connect()));

      if (!address || !address.startsWith("0x") || address.length !== 42) {
        throw new Error("Connect your employee wallet to view claimable payrolls.");
      }

      const { data } = await api.get(routes.claims.claimables(address));
      return normalizeClaimables(data);
    },
    enabled: Boolean(activeWallet),
    placeholderData: (previousData) => previousData,
    refetchInterval: 20_000,
    staleTime: 30_000,
  });

  const createClaim = useMutation({
    mutationFn: async (item: ClaimableItem) => {
      const address = normalizeWallet(wallet || (await connect()));

      if (!address || !address.startsWith("0x") || address.length !== 42) {
        throw new Error("Connect the employee wallet first.");
      }

      const { data } = await api.post(routes.claims.list, {
        run: item.run_id,
        employee_address: address,
      });

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["claimables", activeWallet],
      });
    },
  });

  const rows = useMemo(() => {
    const data = claimablesQuery.data ?? [];
    return [...data].sort((a, b) => {
      const statusOrder = claimSortPriority(a) - claimSortPriority(b);

      if (statusOrder !== 0) return statusOrder;

      return Number(b.run_id) - Number(a.run_id);
    });
  }, [claimablesQuery.data]);

  const totalPages = Math.max(1, Math.ceil(rows.length / CLAIMS_PAGE_SIZE));
  const currentPageStart = (currentPage - 1) * CLAIMS_PAGE_SIZE;

  const currentPageRows = rows.slice(
    currentPageStart,
    currentPageStart + CLAIMS_PAGE_SIZE,
  );

  const visibleStart = rows.length === 0 ? 0 : currentPageStart + 1;
  const visibleEnd = Math.min(rows.length, currentPageStart + CLAIMS_PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [wallet]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  }

  async function handleOpen(item: ClaimableItem) {
    try {
      setOpenError("");
      setOpeningRunId(item.run_id);

      if (item.claim_id) {
        navigate(claimPath(item, item.claim_id));
        return;
      }

      if (!wallet) {
        throw new Error("Connect the employee wallet first.");
      }

      const created = await createClaim.mutateAsync(item);

      if (!created?.id) {
        throw new Error("Claim was created but no claim id was returned.");
      }

      navigate(claimPath(item, created.id));
    } catch (error: any) {
      setOpenError(
        error?.message ?? apiError(error) ?? "Could not open claim.",
      );
    } finally {
      setOpeningRunId(null);
    }
  }

  async function handleRefresh() {
    try {
      setOpenError("");
      await claimablesQuery.refetch();
    } catch (error: any) {
      setOpenError(
        error?.message ?? apiError(error) ?? "Could not refresh claimables.",
      );
    }
  }

  return (
    <div className="stack dashboard-shell dashboard-shell-employee">
      <div
        className="page-header employee-claims-header-card"
        data-tour="employee-header"
      >
        <div>
          <div className="page-header-eyebrow">Employee</div>
          <h1>My Claims</h1>
        </div>
      </div>

      {!wallet && (
        <Card>
          <div style={{ padding: "1rem 0" }}>
            <EmptyState
              title="Wallet not connected"
              description="Connect your employee wallet to see available salary payments."
            />
          </div>
        </Card>
      )}

      {wallet && (
        <div data-tour="employee-claims-card">
          <Card className="employee-claims-card">
            <div className="card-head">
              <div className="employee-claims-title-block">
                <h3>Salary Claims</h3>
                <div className="muted employee-claims-count">
                  {claimablesQuery.isLoading
                    ? "Loading available salaries..."
                    : `${rows.length} payroll payment${
                        rows.length === 1 ? "" : "s"
                      } found`}
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleRefresh()}
                disabled={claimablesQuery.isFetching}
                data-tour="employee-refresh"
              >
                {claimablesQuery.isFetching ? "Refreshing..." : "Refresh"}
              </Button>
            </div>

            <div className="stack">
              {claimablesQuery.isError && (
                <p className="text-danger employee-claims-message">
                  Failed to load claimables.
                </p>
              )}

              {openError && (
                <p className="text-danger employee-claims-message">
                  {openError}
                </p>
              )}

              {!claimablesQuery.isLoading &&
                !claimablesQuery.isError &&
                rows.length === 0 && (
                  <EmptyState
                    title="No available salary yet"
                    description="A new payroll appears here after your employer activates a salary payment for your wallet."
                  />
                )}

              {rows.length > 0 && (
                <>
                  <table className="table employee-claims-table employee-claims-desktop-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Payroll Name</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th aria-label="Action"></th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentPageRows.map((item) => (
                        <tr key={item.run_id}>
                          <td>
                            <strong>{companyNameOf(item)}</strong>
                          </td>

                          <td>
                            <strong>{payrollNameOf(item)}</strong>
                          </td>

                          <td>
                            <span className="employee-claim-created">
                              {displayTimestamp(createdAtOf(item))}
                            </span>
                          </td>

                          <td>
                            <span className="employee-claim-status employee-claim-status-claim">
                              <StatusBadge
                                value={displayClaimStatus(item.claim_status)}
                              />
                            </span>
                          </td>

                          <td>
                            {isClaimedStatus(item.claim_status) ? (
                              <button
                                type="button"
                                className="employee-claim-history-link"
                                disabled={
                                  createClaim.isPending ||
                                  openingRunId === item.run_id
                                }
                                onClick={() => void handleOpen(item)}
                              >
                                <span className="employee-claim-action-label-desktop">
                                  {openingRunId === item.run_id
                                    ? "Opening..."
                                    : actionLabel(item)}
                                </span>

                                {openingRunId !== item.run_id && (
                                  <ArrowRight size={14} strokeWidth={2} />
                                )}
                              </button>
                            ) : (
                              <Button
                                type="button"
                                disabled={
                                  createClaim.isPending ||
                                  openingRunId === item.run_id
                                }
                                onClick={() => void handleOpen(item)}
                              >
                                {openingRunId === item.run_id
                                  ? "Opening..."
                                  : actionLabel(item)}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="employee-claims-mobile-list">
                    {currentPageRows.map((item) => (
                      <article
                        className="employee-claim-mobile-card"
                        key={item.run_id}
                      >
                        <div className="employee-claim-mobile-icon" aria-hidden="true">
                          <UserRound size={23} strokeWidth={1.8} />
                        </div>

                        <div className="employee-claim-mobile-main">
                          <div>
                            <strong>{payrollNameOf(item)}</strong>
                            <span className="employee-claim-mobile-company">
                              {companyNameOf(item)}
                            </span>
                          </div>

                          <StatusBadge
                            value={displayClaimStatus(item.claim_status)}
                          />
                        </div>

                        <button
                          type="button"
                          className={
                            isClaimedStatus(item.claim_status)
                              ? "employee-claim-mobile-action employee-claim-mobile-action-link"
                              : isFailedClaimStatus(item.claim_status)
                                ? "employee-claim-mobile-action employee-claim-mobile-action-review"
                                : "employee-claim-mobile-action employee-claim-mobile-action-claim"
                          }
                          disabled={
                            createClaim.isPending ||
                            openingRunId === item.run_id
                          }
                          onClick={() => void handleOpen(item)}
                        >
                          {openingRunId === item.run_id
                            ? "Opening..."
                            : mobileActionLabel(item)}

                          {openingRunId !== item.run_id && (
                            <ArrowRight size={15} strokeWidth={2} />
                          )}
                        </button>
                      </article>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div
                      className="employee-claims-pagination"
                      aria-label="Claims pagination"
                    >
                      <span>
                        Showing {visibleStart}-{visibleEnd} of {rows.length}
                      </span>

                      <div className="employee-claims-pagination-controls">
                        <button
                          type="button"
                          className="employee-claims-page-btn"
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          aria-label="Previous claims page"
                        >
                          <ChevronLeft size={15} strokeWidth={2} />
                        </button>

                        <span className="employee-claims-page-count">
                          {currentPage} / {totalPages}
                        </span>

                        <button
                          type="button"
                          className="employee-claims-page-btn"
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          aria-label="Next claims page"
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
      )}
    </div>
  );
}
