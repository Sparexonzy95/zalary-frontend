import type { PayrollRun, PayrollTemplate } from "./types";

export const RUN_WAITING_STATUSES = new Set([
  "create_broadcasted",
  "alloc_uploading",
  "alloc_finalizing",
  "funding",
  "activating",
]);

export const RUN_TERMINAL_STATUSES = new Set([
  "closed",
  "cancelled",
  "failed",
  "finalized_success",
  "completed",
]);

export const RUN_CREATE_DONE_STATUSES = new Set([
  "created",
  "alloc_uploading",
  "alloc_uploaded",
  "alloc_finalizing",
  "alloc_finalized",
  "funding",
  "funded",
  "activating",
  "active",
  "closed",
  "completed",
  "finalized_success",
]);

export const RUN_UPLOAD_DONE_STATUSES = new Set([
  "alloc_uploaded",
  "alloc_finalizing",
  "alloc_finalized",
  "funding",
  "funded",
  "activating",
  "active",
  "closed",
  "completed",
  "finalized_success",
]);

export const RUN_FINALIZE_DONE_STATUSES = new Set([
  "alloc_finalized",
  "funding",
  "funded",
  "activating",
  "active",
  "closed",
  "completed",
  "finalized_success",
]);

export const RUN_FUND_DONE_STATUSES = new Set([
  "funded",
  "activating",
  "active",
  "closed",
  "completed",
  "finalized_success",
]);

export const RUN_ACTIVATE_DONE_STATUSES = new Set([
  "active",
  "closed",
  "completed",
  "finalized_success",
]);

export function statusOf(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function displayPayrollStatus(value?: string | null) {
  const status = String(value ?? "").trim();

  if (!status) return "Unknown";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function runLifecycleLabel(value?: string | null) {
  const status = statusOf(value);

  if (status === "scheduled") return "Scheduled";
  if (status === "create_broadcasted") return "Creating payroll";
  if (status === "created") return "Ready to upload";
  if (status === "alloc_uploading") return "Uploading salaries";
  if (status === "alloc_uploaded") return "Ready to lock";
  if (status === "alloc_finalizing") return "Locking salaries";
  if (status === "alloc_finalized") return "Ready to fund";
  if (status === "funding") return "Funding payroll";
  if (status === "funded") return "Ready to activate";
  if (status === "activating") return "Activating payroll";
  if (status === "active") return "Active";
  if (status === "closed") return "Closed";
  if (status === "completed") return "Completed";
  if (status === "finalized_success") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "failed") return "Needs attention";

  return displayPayrollStatus(status);
}

export function isDraftTemplate(value?: string | null) {
  return statusOf(value) === "draft";
}

export function isActiveTemplate(value?: string | null) {
  return statusOf(value) === "active";
}

export function isPausedTemplate(value?: string | null) {
  return statusOf(value) === "paused";
}

export function isCompletedTemplate(value?: string | null) {
  return statusOf(value) === "completed";
}

export function isTerminalRun(value?: string | null) {
  return RUN_TERMINAL_STATUSES.has(statusOf(value));
}

export function isRunWaitingForConfirmation(value?: string | null) {
  return RUN_WAITING_STATUSES.has(statusOf(value));
}

export function canCreatePayroll(value?: string | null) {
  const status = statusOf(value);
  return status === "scheduled" || status === "failed";
}

export function canUploadAllocations(value?: string | null) {
  return statusOf(value) === "created";
}

export function canFinalizeAllocations(value?: string | null) {
  return statusOf(value) === "alloc_uploaded";
}

export function canFundPayroll(value?: string | null) {
  return statusOf(value) === "alloc_finalized";
}

export function canActivatePayroll(value?: string | null) {
  return statusOf(value) === "funded";
}

export function runSortValue(run: PayrollRun) {
  const created = new Date((run as PayrollRun & { created_at?: string }).created_at ?? "").getTime();
  if (Number.isFinite(created)) return created;

  const runDate = new Date(run.run_at ?? "").getTime();
  if (Number.isFinite(runDate)) return runDate;

  return Number(run.id ?? 0);
}

export function effectiveTemplateStatus(
  template?: PayrollTemplate | null,
  runs: PayrollRun[] = [],
) {
  const templateStatus = statusOf(template?.status);

  if (!templateStatus) return "unknown";

  if (templateStatus === "active") {
    const hasActiveRun = runs.some((run) => !isTerminalRun(run.status));

    if (hasActiveRun) return "run_in_progress";
  }

  return templateStatus;
}

export function stageState(done: boolean, pending: boolean, available: boolean) {
  if (done) return "Complete";
  if (pending) return "Confirming";
  if (available) return "Ready";
  return "Waiting";
}