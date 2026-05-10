import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  Clock,
  DollarSign,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useActivateTemplate,
  useCreateNextRun,
  useTemplate,
  useTemplatePreviewRuns,
  useTemplateRuns,
} from "../../hooks/useTemplates";
import { Button, Card, StatusBadge, useToast } from "../../components/ui";
import {
  displayPayrollStatus,
  effectiveTemplateStatus,
  isActiveTemplate,
  isCompletedTemplate,
  isDraftTemplate,
  isPausedTemplate,
  isTerminalRun,
  runSortValue,
  statusOf,
} from "../../lib/payrollStatus";
import { formatAtomic } from "../../lib/format";
import type { PayrollRun, PayrollTemplate } from "../../lib/types";
import "../../styles/template-detail.css";

type NextAction =
  | {
      title: string;
      buttonLabel?: string;
      kind?: "createFromDraft" | "create" | "view";
      runId?: string;
      disabled?: boolean;
      note?: string;
      scheduledFor?: string;
    }
  | null;

function scheduleTypeLabel(schedule?: PayrollTemplate["schedule"] | null) {
  const type = statusOf(schedule?.type);

  if (!type) return "Not set";
  if (type === "instant") return "One-time";
  if (type === "daily") return "Daily";
  if (type === "weekly") return "Weekly";
  if (type === "monthly") return "Monthly";
  if (type === "yearly") return "Yearly";

  return displayPayrollStatus(type);
}

function safeDateTime(value?: string | null, fallback = "Not set") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function safeDate(value?: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

function toBigIntSafe(value: unknown) {
  try {
    if (typeof value === "bigint") return value;

    if (typeof value === "number") {
      return BigInt(Math.max(0, Math.floor(value)));
    }

    if (typeof value === "string" && value.trim()) {
      return BigInt(value);
    }
  } catch {
    return 0n;
  }

  return 0n;
}

function amountLabel(value: unknown) {
  try {
    return `${formatAtomic(value as string | number | bigint)} USDC`;
  } catch {
    return "0.00 USDC";
  }
}

function getRunId(value: unknown) {
  const direct = value as { id?: unknown; run_id?: unknown };
  const nested = value as { data?: { id?: unknown; run_id?: unknown } };

  const id =
    direct?.id ??
    direct?.run_id ??
    nested?.data?.id ??
    nested?.data?.run_id;

  return id == null || id === "" ? "" : String(id);
}

function isFutureDate(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() > Date.now();
}

function getPreviewNextRun(
  template?: PayrollTemplate,
  preview?: { next_run_at?: string | null; times?: string[] },
) {
  return template?.next_run_at ?? preview?.next_run_at ?? preview?.times?.[0] ?? null;
}

function getEmployeeCount(template?: PayrollTemplate, runs: PayrollRun[] = []) {
  const employees = Array.isArray(template?.employees) ? template.employees : [];

  return (
    employees.length ||
    Number(runs[0]?.employee_count_u32 ?? 0) ||
    Number(
      (template as { employee_count_u32?: unknown } | undefined)
        ?.employee_count_u32 ?? 0,
    )
  );
}

function getTemplateTotalAtomic(template?: PayrollTemplate, runs: PayrollRun[] = []) {
  const employees = Array.isArray(template?.employees) ? template.employees : [];

  const employeeTotal = employees.reduce((sum, employee) => {
    return sum + toBigIntSafe(employee.amount_atomic);
  }, 0n);

  if (employeeTotal > 0n) return employeeTotal;

  return toBigIntSafe(
    runs[0]?.required_total_atomic ??
      (template as { required_total_atomic?: unknown } | undefined)
        ?.required_total_atomic,
  );
}

function getActionableRun(runs: PayrollRun[]) {
  return runs.find((run) => !isTerminalRun(run.status)) ?? null;
}

function getLatestRun(runs: PayrollRun[]) {
  return runs[0] ?? null;
}

function useSortedRuns(runs?: PayrollRun[]) {
  return useMemo(() => {
    return [...(runs ?? [])].sort((a, b) => runSortValue(b) - runSortValue(a));
  }, [runs]);
}

export function TemplateDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const templateQuery = useTemplate(id);
  const previewQuery = useTemplatePreviewRuns(id);
  const runsQuery = useTemplateRuns(id);
  const activateMutation = useActivateTemplate(id);
  const createRunMutation = useCreateNextRun(id);

  const template = templateQuery.data;
  const preview = previewQuery.data;
  const runs = useSortedRuns(runsQuery.data);

  const employeeCount = getEmployeeCount(template, runs);
  const totalPayrollAtomic = getTemplateTotalAtomic(template, runs);
  const nextRunAt = getPreviewNextRun(template, preview);

  const latestRun = getLatestRun(runs);
  const latestActionableRun = getActionableRun(runs);
  const templateStatus = effectiveTemplateStatus(template, runs);
  const nextRunIsFuture = isFutureDate(nextRunAt);

  const summaryItems = [
    { icon: Users, label: "Employees", value: String(employeeCount) },
    { icon: DollarSign, label: "Total payroll", value: amountLabel(totalPayrollAtomic) },
    { icon: Calendar, label: "Schedule", value: scheduleTypeLabel(template?.schedule) },
    { icon: CalendarDays, label: "Next run", value: safeDateTime(nextRunAt) },
    { icon: Clock, label: "Status", value: displayPayrollStatus(templateStatus), statusValue: templateStatus },
  ];

  const nextAction: NextAction = (() => {
    if (!template) return null;

    if (isDraftTemplate(templateStatus)) {
      if (nextRunIsFuture) {
        return {
          title: "Scheduled",
          scheduledFor: nextRunAt ?? undefined,
          note: `This payroll is set to run on ${safeDateTime(nextRunAt)}. The create button will unlock once that time arrives.`,
        };
      }
      return {
        title: "Draft ready",
        buttonLabel: "Create Payroll Run",
        kind: "createFromDraft",
        disabled: activateMutation.isPending || createRunMutation.isPending,
        note: "Activates the template and creates the first payroll run.",
      };
    }

    if (latestActionableRun) {
      return null;
    }

    if (isCompletedTemplate(templateStatus)) {
      return {
        title: "Completed",
        buttonLabel: latestRun ? "View Latest Run" : undefined,
        kind: latestRun ? "view" : undefined,
        runId: latestRun ? String(latestRun.id) : undefined,
      };
    }

    if (isPausedTemplate(templateStatus)) {
      return {
        title: "Paused",
        note: "This payroll template is paused and cannot create new runs.",
      };
    }

    if (isActiveTemplate(templateStatus) && nextRunIsFuture) {
      return {
        title: "Scheduled",
        scheduledFor: nextRunAt ?? undefined,
        note: `Next payroll run will be ready to create on ${safeDateTime(nextRunAt)}.`,
        buttonLabel: latestRun ? "View Latest Run" : undefined,
        kind: latestRun ? "view" : undefined,
        runId: latestRun ? String(latestRun.id) : undefined,
      };
    }

    if (isActiveTemplate(templateStatus)) {
      return {
        title: "Ready to run",
        buttonLabel: "Create Payroll Run",
        kind: "create",
        disabled: createRunMutation.isPending,
        note: "The scheduled time has arrived. Create the payroll run to begin the payment cycle.",
      };
    }

    return {
      title: "No action available",
      buttonLabel: latestRun ? "View Latest Run" : undefined,
      kind: latestRun ? "view" : undefined,
      runId: latestRun ? String(latestRun.id) : undefined,
    };
  })();

  async function createNextRun() {
    try {
      const run = await createRunMutation.mutateAsync({});

      toast.push({
        kind: "success",
        title: "Run created",
        message: "Opening the payroll run lifecycle page.",
      });

      const runId = getRunId(run);

      if (runId) {
        navigate(`/employer/runs/${runId}`);
      }
    } catch (error) {
      toast.push({
        kind: "error",
        title: "Run creation failed",
        message:
          error instanceof Error
            ? error.message
            : "The local demo state service could not create the next payroll run.",
      });
    }
  }

  async function createRunFromDraft() {
    try {
      await activateMutation.mutateAsync();

      const run = await createRunMutation.mutateAsync({});

      toast.push({
        kind: "success",
        title: "Payroll run created",
        message: "Opening the payroll run lifecycle page.",
      });

      const runId = getRunId(run);

      if (runId) {
        navigate(`/employer/runs/${runId}`);
      }
    } catch (error) {
      toast.push({
        kind: "error",
        title: "Could not create payroll run",
        message:
          error instanceof Error
            ? error.message
            : "The local demo state service could not prepare this draft for a new run.",
      });
    }
  }

  function handleNextAction() {
    if (!nextAction?.kind) return;

    if (nextAction.kind === "createFromDraft") {
      void createRunFromDraft();
      return;
    }

    if (nextAction.kind === "create") {
      void createNextRun();
      return;
    }

    if (nextAction.kind === "view" && nextAction.runId) {
      navigate(`/employer/runs/${nextAction.runId}`);
    }
  }

  if (templateQuery.isLoading) {
    return (
      <div className="stack template-detail-page dashboard-shell dashboard-shell-employer">
        <Card className="employee-claims-card template-detail-simple-card">
          <div className="template-detail-state-card">
            <p className="muted">Loading payroll...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (templateQuery.isError || !template) {
    return (
      <div className="stack template-detail-page dashboard-shell dashboard-shell-employer">
        <Card
          className="employee-claims-card template-detail-simple-card"
          title="Payroll not found"
        >
          <div className="template-detail-state-card">
            <p className="muted">Failed to load this payroll.</p>

            <Link className="employee-claim-history-link" to="/employer">
              <ArrowLeft size={14} strokeWidth={2} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack template-detail-page dashboard-shell dashboard-shell-employer">
      <Link
        className="employee-claim-history-link template-detail-back-link"
        to="/employer"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        <span>Back to Dashboard</span>
      </Link>

      <div
        className="page-header employee-claims-header-card"
        data-tour="template-header"
      >
        <div>
          <h1>{template.title || `Payroll #${template.id}`}</h1>
        </div>
      </div>

      <div data-tour="template-detail-card">
        <Card className="employee-claims-card template-detail-simple-card template-detail-unified-card">
          <div className="template-detail-sections">
            <section
              className="template-detail-section"
              data-tour="template-setup-card"
            >
              <div className="template-detail-summary-bar">
                {summaryItems.map(({ icon: Icon, label, value, statusValue }) => (
                  <div key={label} className="template-detail-summary-item">
                    <div className="template-detail-summary-icon">
                      <Icon size={15} strokeWidth={1.7} />
                    </div>
                    <div className="template-detail-summary-body">
                      <span>{label}</span>
                      <strong data-status={statusValue}>{value}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {nextAction && (
              <section
                className="template-detail-section template-detail-action-section"
                data-tour="template-next-action-card"
              >
                <div className="template-detail-section-head template-detail-action-head">
                  <div className="template-detail-action-copy">
                    <h3>{nextAction.title}</h3>
                    {nextAction.note && (
                      <p className="template-detail-action-note">{nextAction.note}</p>
                    )}
                  </div>

                  {nextAction.scheduledFor ? (
                    <div className="template-detail-schedule-lock">
                      <Clock size={13} strokeWidth={2} />
                      <span>{safeDateTime(nextAction.scheduledFor)}</span>
                    </div>
                  ) : nextAction.buttonLabel && nextAction.kind ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleNextAction}
                      disabled={Boolean(nextAction.disabled)}
                    >
                      {nextAction.disabled
                        ? "Working..."
                        : nextAction.buttonLabel}
                    </Button>
                  ) : null}
                </div>
              </section>
            )}

            <section
              className="template-detail-section template-detail-runs-section"
              data-tour="template-runs-card"
            >
              <div className="template-detail-section-head">
                <h3>Recent runs</h3>

                <div className="muted template-detail-run-count">
                  {runsQuery.isLoading
                    ? "..."
                    : `${runs.length} run${runs.length === 1 ? "" : "s"}`}
                </div>
              </div>

              {runsQuery.isLoading && (
                <p className="muted template-detail-section-state">
                  Loading runs...
                </p>
              )}

              {!runsQuery.isLoading && runs.length === 0 && (
                <p className="muted template-detail-section-state">
                  No payroll runs yet.
                </p>
              )}

              {runs.length > 0 && (
                <>
                  <table className="table employee-claims-table template-detail-runs-table">
                    <thead>
                      <tr>
                        <th>Run</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {runs.slice(0, 8).map((run) => (
                        <tr key={run.id}>
                          <td>
                            <strong>Run #{run.id}</strong>
                          </td>

                          <td>{safeDate(run.run_at)}</td>

                          <td>
                            <span className="employee-claim-status employee-claim-status-claim">
                              <StatusBadge value={run.status} />
                            </span>
                          </td>

                          <td>
                            <Link
                              className="employee-claim-history-link"
                              to={`/employer/runs/${run.id}`}
                            >
                              <span>View</span>
                              <ArrowRight size={14} strokeWidth={2} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div
                    className="template-detail-runs-mobile-list"
                    aria-label="Recent payroll runs"
                  >
                    {runs.slice(0, 8).map((run) => (
                      <Link
                        key={run.id}
                        className="template-detail-runs-mobile-row"
                        to={`/employer/runs/${run.id}`}
                      >
                        <strong>Run #{run.id}</strong>
                        <span>
                          View
                          <ArrowRight size={13} strokeWidth={2} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
