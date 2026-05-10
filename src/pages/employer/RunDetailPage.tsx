import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart2,
  Calendar,
  Check,
  CircleCheck,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Lock,
  Play,
  Plus,
  RefreshCw,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, useToast } from "../../components/ui";
import {
  useActivatePayroll,
  useCreateOnchainPayroll,
  useFinalizeAllocations,
  useFundPayroll,
  useRun,
  useRunAllocations,
  useRunFundingQuote,
  useUploadAllocations,
} from "../../hooks/useRuns";
import { useTemplate } from "../../hooks/useTemplates";
import { api } from "../../lib/api";
import { env } from "../../lib/env";
import {
  RUN_ACTIVATE_DONE_STATUSES,
  RUN_CREATE_DONE_STATUSES,
  RUN_FINALIZE_DONE_STATUSES,
  RUN_FUND_DONE_STATUSES,
  RUN_UPLOAD_DONE_STATUSES,
  canActivatePayroll,
  canCreatePayroll,
  canFinalizeAllocations,
  canFundPayroll,
  canUploadAllocations,
  isRunWaitingForConfirmation,
  runLifecycleLabel,
  stageState,
  statusOf,
} from "../../lib/payrollStatus";
import {
  ensureSwapRouterTopUp,
  sendPayrollVaultTransaction,
} from "../../lib/payrollTransactions";
import { routes } from "../../lib/routes";
import type { PayrollTemplate } from "../../lib/types";
import { formatAtomicToDisplay } from "../../lib/utils";
import { useWallet } from "../../lib/wallet";
import {
  encryptedInputForApi,
  encryptedInputForContract,
  encryptUint64ForPayroll,
  encryptUint64ListForPayroll,
  publicDecryptForTx,
} from "../../lib/zama";
import "../../styles/run-detail.css";

type NextAction = {
  title: string;
  description?: string;
  button?: string;
  busy?: string;
  disabled?: boolean;
  isBusy?: boolean;
  onClick?: () => void;
};

type RunActionKey = "create" | "upload" | "finalize" | "topup" | "fund" | "activate";

const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";


function getStageIcon(index: number) {
  const icons = [FileText, Upload, Lock, CreditCard, Play];
  const Icon = icons[index];
  return Icon ? <Icon size={18} strokeWidth={1.6} /> : null;
}

function StageBadge({ value }: { value: string }) {
  if (value === "Complete") {
    return (
      <span className="run-stage-badge run-stage-badge--complete">
        <Check size={11} strokeWidth={2.5} />
        Complete
      </span>
    );
  }
  if (value === "Ready") {
    return (
      <span className="run-stage-badge run-stage-badge--ready">
        <Check size={11} strokeWidth={2.5} />
        Ready
      </span>
    );
  }
  if (value === "Confirming") {
    return (
      <span
        className="run-stage-badge run-stage-badge--confirming"
        aria-busy="true"
      >
        <RefreshCw className="run-stage-spinner" size={11} strokeWidth={2} />
        Confirming
      </span>
    );
  }
  return (
    <span className="run-stage-badge run-stage-badge--waiting">
      <Clock size={11} strokeWidth={1.8} />
      Waiting
    </span>
  );
}

function safeDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function hasFutureTemplateRun(template?: PayrollTemplate | null) {
  if (!template) return true;

  const scheduleType = statusOf(template.schedule?.type);

  if (["instant", "one_time", "one-time"].includes(scheduleType)) {
    return false;
  }

  if (!template.next_run_at) return false;

  const nextRun = new Date(template.next_run_at);

  return Number.isFinite(nextRun.getTime()) && nextRun.getTime() > Date.now();
}

function formatUsdc(value?: string | number | bigint | null) {
  if (value == null || value === "") return "—";
  try {
    return `${formatAtomicToDisplay(value, 6)} USDC`;
  } catch {
    return `${String(value)} USDC`;
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const possible = error as {
      message?: unknown;
      detail?: unknown;
      shortMessage?: unknown;
      response?: { data?: { detail?: unknown; error?: unknown; message?: unknown } };
    };
    return String(
      possible.response?.data?.detail ??
        possible.response?.data?.error ??
        possible.response?.data?.message ??
        possible.shortMessage ??
        possible.detail ??
        possible.message ??
        "Please try again.",
    );
  }
  if (typeof error === "string") return error;
  return "Please try again.";
}

function templateTitle(template?: {
  title?: string | null;
  payroll_name?: string | null;
  payroll_title?: string | null;
  template_title?: string | null;
} | null) {
  return (
    template?.payroll_name ||
    template?.payroll_title ||
    template?.template_title ||
    template?.title ||
    "Payroll run"
  );
}

function shortHash(value?: string | null) {
  if (!value) return "Pending";
  const hash = String(value);
  if (!hash.startsWith("0x") || hash.length < 18) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function toPayrollId(value?: string | number | bigint | null) {
  if (value === undefined || value === null || value === "") {
    throw new Error("On-chain payroll ID is missing.");
  }
  return BigInt(value);
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "bigint") return value !== 0n;
  if (typeof value === "number") return value !== 0;
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "true" || text === "1") return true;
  if (text === "false" || text === "0" || text === "") return false;
  return Boolean(value);
}

function makeIdempotencyKey(runId: string | number, txHash: string) {
  const cryptoId = window.crypto?.randomUUID?.().replace(/-/g, "");
  return `${runId}-${cryptoId || txHash.slice(2, 34)}`.slice(0, 80);
}

function hasOnchainPayrollId(value?: string | number | bigint | null) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function isUsableBytes32Handle(value: unknown) {
  const handle = String(value ?? "").trim();
  return (
    /^0x[a-fA-F0-9]{64}$/.test(handle) &&
    handle.toLowerCase() !== ZERO_BYTES32
  );
}

export function RunDetailPage() {
  const { runId = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { wallet, connect } = useWallet();
  const [actionBusy, setActionBusy] = useState<RunActionKey | null>(null);
  const [fundingStepMessage, setFundingStepMessage] = useState("");
  const [activationNoticeOpen, setActivationNoticeOpen] = useState(false);

  const runQuery = useRun(runId);
  const run = runQuery.data;

  const templateQuery = useTemplate(run ? String(run.template) : undefined);
  const template = templateQuery.data;

  const quoteQuery = useRunFundingQuote(runId);
  const allocationsQuery = useRunAllocations(runId);

  const createOnchainMutation = useCreateOnchainPayroll(runId);
  const uploadMutation = useUploadAllocations(runId);
  const finalizeMutation = useFinalizeAllocations(runId);
  const fundMutation = useFundPayroll(runId);
  const activateMutation = useActivatePayroll(runId);

  useEffect(() => {
    setActivationNoticeOpen(false);
  }, [runId]);

  const employees = useMemo(() => template?.employees ?? [], [template?.employees]);
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.is_active !== false),
    [employees],
  );

  const status = statusOf(run?.status);
  const displayStatus =
    status === "active" && !hasFutureTemplateRun(template)
      ? "completed"
      : status;
  const waitingForConfirmation = isRunWaitingForConfirmation(status);
  const onchainPayrollReady = hasOnchainPayrollId(run?.onchain_payroll_id);

  const createDone = RUN_CREATE_DONE_STATUSES.has(status);
  const uploadDone = RUN_UPLOAD_DONE_STATUSES.has(status);
  const finalizeDone = RUN_FINALIZE_DONE_STATUSES.has(status);
  const fundDone = RUN_FUND_DONE_STATUSES.has(status);
  const activateDone = RUN_ACTIVATE_DONE_STATUSES.has(status);

  const canCreate = canCreatePayroll(status);
  const canUpload = canUploadAllocations(status);
  const canFinalize = canFinalizeAllocations(status);
  const canFund = canFundPayroll(status);
  const canActivate = canActivatePayroll(status);

  const createPending =
    actionBusy === "create" || createOnchainMutation.isPending || status === "create_broadcasted";
  const uploadPending =
    actionBusy === "upload" || uploadMutation.isPending || status === "alloc_uploading";
  const finalizePending =
    actionBusy === "finalize" || finalizeMutation.isPending || status === "alloc_finalizing";
  const fundPending =
    actionBusy === "topup" || actionBusy === "fund" || fundMutation.isPending || status === "funding";
  const activatePending =
    actionBusy === "activate" || activateMutation.isPending || status === "activating";

  const hasFastRunActivity =
    waitingForConfirmation ||
    createPending ||
    uploadPending ||
    finalizePending ||
    fundPending ||
    activatePending;

  const totalPayroll = formatUsdc(
    quoteQuery.data?.required_total_atomic ?? run?.required_total_atomic,
  );

  const employeeCount =
    quoteQuery.data?.employee_count ??
    run?.employee_count_u32 ??
    activeEmployees.length ??
    allocationsQuery.data?.length ??
    0;

  const backTarget = run?.template ? `/employer/templates/${run.template}` : "/employer";

  async function refetchRunData() {
    await Promise.allSettled([
      runQuery.refetch(),
      quoteQuery.refetch(),
      allocationsQuery.refetch(),
      templateQuery.refetch(),
    ]);
  }

  async function refetchRunStatus() {
    await runQuery.refetch();
  }

  function requireLoadedRun() {
    if (!run) throw new Error("Payroll run is still loading.");
    return run;
  }

  function requireLoadedTemplate() {
    if (!template) throw new Error("Payroll template is still loading.");
    return template;
  }

  async function requireEmployerWallet() {
    const sender = String((await connect()) || wallet || "").toLowerCase();
    if (!sender.startsWith("0x") || sender.length !== 42) {
      throw new Error("Connect the employer wallet before sending this transaction.");
    }
    const expected = String(run?.employer_address || template?.employer_address || "").toLowerCase();
    if (expected && expected !== sender) {
      throw new Error(`Connected wallet does not match employer wallet ${expected}.`);
    }
    return sender as `0x${string}`;
  }

  function currentPayrollId() {
    return toPayrollId(requireLoadedRun().onchain_payroll_id);
  }

  async function resolveFundedOnceHandle(sender: string) {
    const currentRun = requireLoadedRun();
    if (!hasOnchainPayrollId(currentRun.onchain_payroll_id)) {
      throw new Error("On-chain payroll ID is missing.");
    }
    const { data } = await api.get(routes.runs.fundedOnceHandle(runId), {
      params: { employer_address: sender, t: Date.now() },
    });
    const stateHandle = String(data?.funded_once_handle || data?.handle || "").trim();
    const localHandle = String(currentRun.funded_once_handle || "").trim();
    const handle = isUsableBytes32Handle(stateHandle) ? stateHandle : localHandle;
    if (!isUsableBytes32Handle(handle)) {
      throw new Error(
        "Local demo state could not resolve a non-zero funded handle yet. Wait for funding confirmation, refresh, or fund again.",
      );
    }
    return handle;
  }

  function requiredFundingAmountAtomic() {
    const amountAtomic = String(
      quoteQuery.data?.required_total_atomic ?? requireLoadedRun().required_total_atomic ?? "",
    ).trim();
    if (!amountAtomic || !/^\d+$/.test(amountAtomic) || BigInt(amountAtomic) <= 0n) {
      throw new Error("Funding amount is missing or invalid.");
    }
    return amountAtomic;
  }

  useEffect(() => {
    if (!runId || !hasFastRunActivity) return;
    void refetchRunStatus();
    const intervalId = window.setInterval(() => { void refetchRunStatus(); }, 1_000);
    return () => window.clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, hasFastRunActivity]);

  async function stepCreatePayroll() {
    setActionBusy("create");
    try {
      const currentRun = requireLoadedRun();
      const currentTemplate = requireLoadedTemplate();
      const sender = await requireEmployerWallet();
      const tx = await sendPayrollVaultTransaction({
        from: sender,
        functionName: "createPayroll",
        args: [
          currentTemplate.token_address || env.confidentialTokenAddress,
          BigInt(currentRun.deadline_u64),
          Number(currentRun.employee_count_u32 || activeEmployees.length),
        ],
      });
      await createOnchainMutation.mutateAsync(tx);
      toast.push({ kind: "success", title: "Payroll creation sent", message: `Local demo state is tracking ${shortHash(tx.tx_hash)}.` });
    } catch (error) {
      toast.push({ kind: "error", title: "Could not create payroll", message: getErrorMessage(error) });
    } finally {
      setActionBusy(null);
    }
  }

  async function stepUploadSalaries() {
    setActionBusy("upload");
    try {
      requireLoadedRun();
      const currentTemplate = requireLoadedTemplate();
      const sender = await requireEmployerWallet();
      const payrollId = currentPayrollId();
      const employeeRows = currentTemplate.employees.filter((e) => e.is_active !== false);
      if (!employeeRows.length) throw new Error("This template has no active employees to upload.");
      const encryptedAmounts = await encryptUint64ListForPayroll(
        employeeRows.map((e) => e.amount_atomic),
        sender,
      );
      const inputProof = encryptedAmounts[0]?.inputProof;
      if (!inputProof) throw new Error("Zama encryption did not return an input proof.");
      const employeeAddresses = employeeRows.map((e) => e.employee_address.trim().toLowerCase());
      const tx = await sendPayrollVaultTransaction({
        from: sender,
        functionName: "uploadAllocations",
        args: [payrollId, employeeAddresses, encryptedAmounts.map(encryptedInputForContract), inputProof],
      });
      await uploadMutation.mutateAsync({
        ...tx,
        idempotency_key: makeIdempotencyKey(runId, tx.tx_hash),
        employee_addresses: employeeAddresses,
        encrypted_amounts: encryptedAmounts.map(encryptedInputForApi),
        inputProof,
      });
      toast.push({ kind: "success", title: "Salary upload sent", message: `Local demo state is tracking ${shortHash(tx.tx_hash)}.` });
    } catch (error) {
      toast.push({ kind: "error", title: "Could not upload salaries", message: getErrorMessage(error) });
    } finally {
      setActionBusy(null);
    }
  }

  async function stepLockSalaries() {
    setActionBusy("finalize");
    try {
      const sender = await requireEmployerWallet();
      const tx = await sendPayrollVaultTransaction({
        from: sender,
        functionName: "finalizeAllocations",
        args: [currentPayrollId()],
      });
      await finalizeMutation.mutateAsync(tx);
      toast.push({ kind: "success", title: "Salary lock sent", message: `Local demo state is tracking ${shortHash(tx.tx_hash)}.` });
    } catch (error) {
      toast.push({ kind: "error", title: "Could not lock salaries", message: getErrorMessage(error) });
    } finally {
      setActionBusy(null);
    }
  }

  async function sendFundPayrollTransaction(sender: `0x${string}`, amountAtomic: string) {
    const encryptedAmount = await encryptUint64ForPayroll(amountAtomic, sender);
    const tx = await sendPayrollVaultTransaction({
      from: sender,
      functionName: "fundPayroll",
      args: [currentPayrollId(), encryptedInputForContract(encryptedAmount), encryptedAmount.inputProof],
    });
    await fundMutation.mutateAsync({
      ...tx,
      amount_atomic: amountAtomic,
      encrypted_amount: encryptedInputForApi(encryptedAmount),
      inputProof: encryptedAmount.inputProof,
    });
    return tx;
  }

  async function stepFundPayroll() {
    setActionBusy("fund");
    setFundingStepMessage("");
    try {
      const sender = await requireEmployerWallet();
      const amountAtomic = requiredFundingAmountAtomic();
      const tx = await sendFundPayrollTransaction(sender, amountAtomic);
      toast.push({ kind: "success", title: "Funding sent", message: `Local demo state is tracking ${shortHash(tx.tx_hash)}.` });
    } catch (error) {
      toast.push({ kind: "error", title: "Could not fund payroll", message: getErrorMessage(error) });
    } finally {
      setActionBusy(null);
    }
  }

  async function stepTopUpAndFundPayroll() {
    setActionBusy("topup");
    setFundingStepMessage("");
    try {
      const sender = await requireEmployerWallet();
      const amountAtomic = requiredFundingAmountAtomic();
      toast.push({ kind: "info", title: "Preparing funding", message: "We will approve USDC if needed, deposit through SwapRouter, then fund payroll." });
      await ensureSwapRouterTopUp({
        from: sender,
        amount: amountAtomic,
        onStep: (message) => {
          console.log("[PAYROLL TOP-UP]", message);
          setFundingStepMessage(message);
        },
      });
      const tx = await sendFundPayrollTransaction(sender, amountAtomic);
      toast.push({ kind: "success", title: "Top-up and funding sent", message: `SwapRouter top-up completed. Local demo state is tracking ${shortHash(tx.tx_hash)}.` });
    } catch (error) {
      toast.push({ kind: "error", title: "Could not top up and fund payroll", message: getErrorMessage(error) });
    } finally {
      setActionBusy(null);
      setFundingStepMessage("");
    }
  }

  async function stepActivatePayroll() {
    setActionBusy("activate");
    try {
      const sender = await requireEmployerWallet();
      await refetchRunData();
      const fundedHandle = await resolveFundedOnceHandle(sender);
      const decrypt = await publicDecryptForTx(fundedHandle);
      const fundedPlaintext = toBoolean(decrypt.decryptedValue);
      if (!fundedPlaintext) {
        throw new Error(
          "The latest funding proof still decrypts to false. This payroll is not funded on-chain yet. Run the top-up and fund step, wait for confirmation, then refresh before activation.",
        );
      }
      const tx = await sendPayrollVaultTransaction({
        from: sender,
        functionName: "activatePayroll",
        args: [currentPayrollId(), fundedPlaintext, decrypt.proof],
      });
      await activateMutation.mutateAsync({
        ...tx,
        funded_plaintext: fundedPlaintext,
        funded_sig: decrypt.proof,
        decryption_proof: decrypt.proof,
      });
      toast.push({ kind: "success", title: "Activation sent", message: `Local demo state is tracking ${shortHash(tx.tx_hash)}.` });
      setActivationNoticeOpen(true);
    } catch (error) {
      toast.push({ kind: "error", title: "Could not activate payroll", message: getErrorMessage(error) });
    } finally {
      setActionBusy(null);
    }
  }

  const nextAction: NextAction = (() => {
    if (!run) {
      return { title: runQuery.isError ? "Run unavailable" : "Loading payroll run..." };
    }
    if (canCreate) {
      return {
        title: status === "failed" ? "Retry payroll creation" : "Create payroll",
        description: "Create a new payroll run for your employees.",
        button: "Create Payroll",
        busy: "Creating...",
        disabled: createPending || templateQuery.isLoading || !template,
        isBusy: createPending,
        onClick: stepCreatePayroll,
      };
    }
    if (canUpload) {
      return {
        title: "Upload salaries",
        description: "Upload or import employee salaries.",
        button: "Upload Salaries",
        busy: "Uploading...",
        disabled: !onchainPayrollReady || activeEmployees.length === 0 || uploadPending,
        isBusy: uploadPending,
        onClick: stepUploadSalaries,
      };
    }
    if (canFinalize) {
      return {
        title: "Lock salaries",
        description: "Review and lock salaries before funding.",
        button: "Lock Salaries",
        busy: "Locking...",
        disabled: !onchainPayrollReady || finalizePending,
        isBusy: finalizePending,
        onClick: stepLockSalaries,
      };
    }
    if (canFund) {
      return {
        title: "Fund payroll",
        description: "Fund the payroll to secure payments.",
        button: "Top Up & Fund Payroll",
        busy: fundingStepMessage || "Preparing funding...",
        disabled: !onchainPayrollReady || fundPending,
        isBusy: fundPending,
        onClick: stepTopUpAndFundPayroll,
      };
    }
    if (canActivate) {
      return {
        title: "Activate payroll",
        description: "Activate payroll for employees to claim.",
        button: "Activate Payroll",
        busy: "Activating...",
        disabled: !onchainPayrollReady || activatePending,
        isBusy: activatePending,
        onClick: stepActivatePayroll,
      };
    }
    if (waitingForConfirmation) {
      return {
        title: "Confirmation in progress",
        description: "Waiting for blockchain confirmation. This page updates automatically.",
      };
    }
    if (displayStatus === "active") {
      return {
        title: "Payroll is active",
        description: "Employees can now claim their salaries.",
      };
    }
    if (
      displayStatus === "closed" ||
      displayStatus === "completed" ||
      displayStatus === "finalized_success"
    ) {
      return {
        title: "Payroll completed",
        description: "All employees have been paid successfully.",
      };
    }
    if (displayStatus === "cancelled") {
      return { title: "Payroll cancelled", description: "This payroll run has been cancelled." };
    }
    return { title: runLifecycleLabel(displayStatus) };
  })();

  const stageRows = [
    { label: "Create payroll", value: stageState(createDone, createPending, canCreate) },
    { label: "Upload salaries", value: stageState(uploadDone, uploadPending, canUpload) },
    { label: "Lock salaries", value: stageState(finalizeDone, finalizePending, canFinalize) },
    { label: "Fund payroll", value: stageState(fundDone, fundPending, canFund) },
    { label: "Activate payroll", value: stageState(activateDone, activatePending, canActivate) },
  ];

  const summaryItems: {
    icon: LucideIcon;
    label: string;
    value: string;
    statusValue?: string;
  }[] = run
    ? [
        { icon: Users, label: "Employees", value: String(employeeCount) },
        { icon: DollarSign, label: "Total payroll", value: totalPayroll },
        { icon: Calendar, label: "Run date", value: safeDate(run.run_at) },
        {
          icon: Clock,
          label: "Status",
          value: runLifecycleLabel(displayStatus),
          statusValue: displayStatus,
        },
      ]
    : [];

  const currentError =
    createOnchainMutation.error ??
    uploadMutation.error ??
    finalizeMutation.error ??
    fundMutation.error ??
    activateMutation.error ??
    runQuery.error ??
    quoteQuery.error ??
    templateQuery.error;

  const activationDialog = activationNoticeOpen ? (
    <div
      className="claim-completion-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payroll-activation-title"
      aria-describedby="payroll-activation-message"
    >
      <div className="claim-completion-popover">
        <div className="claim-completion-icon" aria-hidden="true">
          <CircleCheck size={34} strokeWidth={1.8} />
        </div>

        <div className="claim-completion-copy">
          <h2 id="payroll-activation-title">Payroll activation sent</h2>
          <p id="payroll-activation-message">
            This payroll is being activated. Employees can claim once confirmation completes.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="claim-completion-action"
          onClick={() => setActivationNoticeOpen(false)}
        >
          Close
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="stack run-detail-page template-detail-page dashboard-shell dashboard-shell-employer">
      {activationDialog && createPortal(activationDialog, document.body)}

      <button
        type="button"
        className="employee-claim-history-link template-detail-back-link run-detail-back"
        onClick={() => navigate(backTarget)}
      >
        <ArrowLeft size={14} strokeWidth={2} />
        <span>Back</span>
      </button>

      <div className="page-header employee-claims-header-card run-detail-page-head">
        <div>
          <h1>{templateTitle(template)}</h1>
        </div>
      </div>

      <div data-tour="run-detail-card">
        <Card className="employee-claims-card template-detail-simple-card template-detail-unified-card run-detail-unified-card">
          <div className="template-detail-sections run-detail-sections">
            {runQuery.isLoading && (
              <section className="template-detail-section">
                <p className="run-detail-empty">Loading payroll run...</p>
              </section>
            )}

            {runQuery.isError && (
              <section className="template-detail-section">
                <p className="run-detail-error-banner">Failed to load payroll run.</p>
              </section>
            )}

            {run && (
              <>
                <section
                  className="template-detail-section run-detail-summary-section"
                  data-tour="run-summary"
                >
                  <div className="template-detail-summary-bar run-detail-summary-bar">
                    {summaryItems.map(({ icon: Icon, label, value, statusValue }) => (
                      <div key={label} className="template-detail-summary-item run-detail-summary-item">
                        <div className="template-detail-summary-icon run-detail-summary-icon">
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

                {(run.last_error || currentError || fundingStepMessage || waitingForConfirmation) && (
                  <section className="template-detail-section run-detail-message-section">
                    <div className="run-detail-message-list">
                      {run.last_error && (
                        <div className="run-detail-error-banner">{run.last_error}</div>
                      )}

                      {currentError && (
                        <div className="run-detail-error-banner">
                          {getErrorMessage(currentError)}
                        </div>
                      )}

                      {fundingStepMessage && (
                        <div className="run-detail-note">{fundingStepMessage}</div>
                      )}

                      {waitingForConfirmation && (
                        <div className="run-detail-note">
                          Waiting for confirmation. This page updates automatically.
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <section
                  className="template-detail-section template-detail-action-section run-detail-action-section"
                  data-tour="run-next-action"
                >
                  <div className="template-detail-section-head template-detail-action-head run-detail-action-row">
                    <div className="template-detail-action-copy run-detail-action-copy">
                      <h3>{nextAction.title}</h3>
                      {nextAction.description && (
                        <p className="template-detail-action-note">
                          {nextAction.description}
                        </p>
                      )}
                    </div>

                    {nextAction.onClick ? (
                      <Button
                        type="button"
                        onClick={nextAction.onClick}
                        disabled={Boolean(nextAction.disabled)}
                        className="run-detail-action-btn"
                      >
                        <Plus size={14} strokeWidth={2.2} />
                        {nextAction.isBusy
                          ? nextAction.busy
                          : nextAction.button?.toUpperCase()}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void refetchRunData()}
                        className="run-detail-refresh-btn"
                      >
                        <RefreshCw size={14} strokeWidth={1.8} />
                        Refresh
                      </Button>
                    )}
                  </div>
                </section>

                <section
                  className="template-detail-section run-detail-progress-section"
                  data-tour="run-progress"
                >
                  <div className="template-detail-section-head run-detail-progress-heading">
                    <h3>
                      <BarChart2 size={15} strokeWidth={1.8} />
                      <span>Progress</span>
                    </h3>
                  </div>

                  <div className="run-detail-stages">
                    {stageRows.map((stage, index) => (
                      <div key={stage.label} className="run-detail-stage">
                        <div className="run-detail-stage-track">
                          <div className={`run-detail-stage-icon run-detail-stage-icon--${stage.value.toLowerCase()}`}>
                            {getStageIcon(index)}
                          </div>
                          {index < stageRows.length - 1 && (
                            <div className="run-detail-stage-dot" />
                          )}
                        </div>

                        <div className="run-detail-stage-body">
                          <span className="run-detail-stage-step">Step {index + 1}</span>
                          <strong className="run-detail-stage-title">{stage.label}</strong>
                        </div>

                        <StageBadge value={stage.value} />
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
