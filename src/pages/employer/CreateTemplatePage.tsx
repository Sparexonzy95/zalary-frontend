import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  PenLine,
  Repeat2,
  Upload,
  X,
} from "lucide-react";
import { api, apiError } from "../../lib/api";
import { routes } from "../../lib/routes";
import { env } from "../../lib/env";
import {
  buildSchedulePayload,
  defaultFirstRunAt,
  type ScheduleFormState,
} from "../../lib/schedule";
import { parseDisplayToAtomic } from "../../lib/format";
import { useWallet } from "../../lib/wallet";
import { Card, Button, Field, useToast } from "../../components/ui";
import "../../styles/create-payroll.css";

type EmployeeRow = {
  address: string;
  name: string;
  email: string;
  amount: string;
};

type PayrollWizardPhase = 0 | 1 | 2;
type RecurringFrequency = Exclude<ScheduleFormState["type"], "instant">;
type RecurringEndMode = "specific_date" | "run_count";

type RecurringDraft = {
  startsOn: string;
  sendTime: string;
  frequency: RecurringFrequency;
  endMode: RecurringEndMode;
  endDate: string;
  runCount: number;
};

const RECURRING_FREQ_OPTIONS: {
  value: RecurringFrequency;
  label: string;
}[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const PHASE_COPY: Record<PayrollWizardPhase, { nextLabel?: string }> = {
  0: { nextLabel: "Continue to Schedule" },
  1: { nextLabel: "Review Draft" },
  2: {},
};

function emptyEmployeeRow(): EmployeeRow {
  return { address: "", name: "", email: "", amount: "" };
}

function hasEmployeeInput(row: EmployeeRow) {
  return Boolean(
    row.address.trim() || row.name.trim() || row.email.trim() || row.amount.trim(),
  );
}

function isValidAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseEmployeesCsv(content: string): EmployeeRow[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(
      "CSV must include a header row and at least one employee row.",
    );
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);

  const addressIndex = headers.findIndex((header) =>
    ["address", "wallet", "wallet_address", "employee_address"].includes(
      header,
    ),
  );

  const nameIndex = headers.findIndex((header) =>
    ["name", "employee_name", "fullname", "full_name"].includes(header),
  );

  const emailIndex = headers.findIndex((header) =>
    ["email", "employee_email", "work_email"].includes(header),
  );

  const amountIndex = headers.findIndex((header) =>
    ["amount", "salary", "amount_usdc", "pay", "pay_amount"].includes(header),
  );

  if (addressIndex === -1 || amountIndex === -1) {
    throw new Error(
      "CSV headers must include address and amount columns. Optional: name, email.",
    );
  }

  return lines
    .slice(1)
    .map(parseCsvLine)
    .map((cells) => ({
      address: cells[addressIndex] ?? "",
      name: nameIndex >= 0 ? (cells[nameIndex] ?? "") : "",
      email: emailIndex >= 0 ? (cells[emailIndex] ?? "") : "",
      amount: cells[amountIndex] ?? "",
    }))
    .filter(hasEmployeeInput);
}

function toDateInputValue(value: string) {
  return value ? value.slice(0, 10) : "";
}

function toTimeInputValue(value: string) {
  return value && value.includes("T") ? value.slice(11, 16) : "09:00";
}

function mergeDateAndTime(date: string, time: string) {
  if (!date) return "";
  return `${date}T${time || "09:00"}`;
}

function addMonthsSafe(date: Date, months: number) {
  const next = new Date(date);
  const originalDate = next.getDate();

  next.setMonth(next.getMonth() + months);

  if (next.getDate() !== originalDate) {
    next.setDate(0);
  }

  return next;
}

function estimateRunCountFromEndDate(
  startDateValue: string,
  endDateValue: string,
  frequency: RecurringFrequency,
) {
  const start = new Date(`${startDateValue}T00:00`);
  const end = new Date(`${endDateValue}T23:59`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  if (end.getTime() < start.getTime()) return 1;

  let count = 1;
  let cursor = new Date(start);

  while (count < 500) {
    if (frequency === "daily") cursor.setDate(cursor.getDate() + 1);
    if (frequency === "weekly") cursor.setDate(cursor.getDate() + 7);
    if (frequency === "monthly") cursor = addMonthsSafe(cursor, 1);

    if (cursor.getTime() > end.getTime()) break;
    count += 1;
  }

  return Math.max(1, Math.min(count, 500));
}

function addOneYearDateInput(dateValue: string) {
  const date = new Date(`${dateValue}T00:00`);

  if (Number.isNaN(date.getTime())) return dateValue;

  date.setFullYear(date.getFullYear() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateOnly(value: string) {
  if (!value) return "Not selected";

  const date = new Date(`${value}T00:00`);

  if (Number.isNaN(date.getTime())) return "Not selected";

  return date.toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

function formatScheduleDateTime(value: string) {
  if (!value) return "Not selected";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not selected";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function frequencyLabel(value: ScheduleFormState["type"] | RecurringFrequency) {
  if (value === "instant") return "One-time";
  if (value === "daily") return "Daily";
  if (value === "weekly") return "Weekly";
  if (value === "monthly") return "Monthly";
  return String(value);
}

function resolveRunCount(schedule: ScheduleFormState) {
  if (schedule.type === "instant") return 1;
  return Math.max(1, Number(schedule.cycles || 1));
}

function schedulePreview(schedule: ScheduleFormState) {
  const runText = resolveRunCount(schedule);

  if (schedule.type === "instant") {
    return `One-time payroll on ${formatScheduleDateTime(schedule.firstRunAt)}`;
  }

  return `${frequencyLabel(schedule.type)} payroll starting ${formatScheduleDateTime(
    schedule.firstRunAt,
  )} for ${runText} run${runText === 1 ? "" : "s"}`;
}

function validateScheduleLocal(schedule: ScheduleFormState) {
  const errors: Record<string, string> = {};

  if (!schedule.firstRunAt) {
    errors.firstRunAt = "Choose when payroll should be sent.";
  }

  if (schedule.type !== "instant" && (!schedule.cycles || schedule.cycles < 1)) {
    errors.cycles = "Recurring payroll must have at least one run.";
  }

  return errors;
}

export function CreateTemplatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { wallet, connect } = useWallet();

  const csvInputRef = React.useRef<HTMLInputElement | null>(null);
  const employeeStackRef = React.useRef<HTMLDivElement | null>(null);

  const [title, setTitle] = React.useState("");
  const defaultRunAt = React.useMemo(() => defaultFirstRunAt(), []);
  const initialScheduleDate = toDateInputValue(defaultRunAt);

  const [schedule, setSchedule] = React.useState<ScheduleFormState>({
    type: "instant",
    firstRunAt: defaultRunAt,
    cycles: 1,
  });

  const [recurringSaved, setRecurringSaved] = React.useState(false);
  const [recurringModalOpen, setRecurringModalOpen] = React.useState(false);
  const [recurringDraft, setRecurringDraft] = React.useState<RecurringDraft>({
    startsOn: initialScheduleDate,
    sendTime: toTimeInputValue(defaultRunAt),
    frequency: "monthly",
    endMode: "specific_date",
    endDate: addOneYearDateInput(initialScheduleDate),
    runCount: 12,
  });

  const [employees, setEmployees] = React.useState<EmployeeRow[]>([
    emptyEmployeeRow(),
  ]);

  const [formError, setFormError] = React.useState("");
  const [scheduleErrors, setScheduleErrors] = React.useState<Record<string, string>>({});
  const [wizardPhase, setWizardPhase] = React.useState<PayrollWizardPhase>(0);
  const [reviewConfirmed, setReviewConfirmed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const activeEmployees = employees.filter(hasEmployeeInput);

  const perRunTotal = employees.reduce((sum, employee) => {
    const value = Number(String(employee.amount).trim());
    return sum + (Number.isFinite(value) && value > 0 ? value : 0);
  }, 0);

  const runCount = resolveRunCount(schedule);
  const totalBudget = perRunTotal * runCount;
  const previewText = schedulePreview(schedule);
  const phaseCopy = PHASE_COPY[wizardPhase];

  const sendDate = toDateInputValue(schedule.firstRunAt);
  const sendTime = toTimeInputValue(schedule.firstRunAt);
  const isRecurringPayroll = recurringSaved && schedule.type !== "instant";

  function setSched(patch: Partial<ScheduleFormState>) {
    setSchedule((current) => ({ ...current, ...patch }));
  }

  function handleSendDateChange(dateValue: string) {
    const currentTime = toTimeInputValue(schedule.firstRunAt);
    const nextFirstRunAt = mergeDateAndTime(dateValue, currentTime);

    setSched({ firstRunAt: nextFirstRunAt });

    setRecurringDraft((current) => ({
      ...current,
      startsOn: dateValue,
      endDate:
        current.endDate && current.endDate >= dateValue
          ? current.endDate
          : addOneYearDateInput(dateValue),
    }));
  }

  function handleSendTimeChange(timeValue: string) {
    const currentDate = toDateInputValue(schedule.firstRunAt);
    const nextFirstRunAt = mergeDateAndTime(currentDate, timeValue);

    setSched({ firstRunAt: nextFirstRunAt });

    setRecurringDraft((current) => ({
      ...current,
      sendTime: timeValue,
    }));
  }

  function openRecurringModal() {
    const currentDate = toDateInputValue(schedule.firstRunAt);
    const currentTime = toTimeInputValue(schedule.firstRunAt);

    setRecurringDraft((current) => ({
      ...current,
      startsOn: current.startsOn || currentDate,
      sendTime: current.sendTime || currentTime,
      frequency:
        schedule.type === "instant"
          ? current.frequency
          : (schedule.type as RecurringFrequency),
      runCount: Math.max(1, schedule.cycles || current.runCount || 12),
    }));

    setRecurringModalOpen(true);
  }

  function closeRecurringModal() {
    setRecurringModalOpen(false);
  }

  function turnOffRecurringPayroll() {
    setRecurringSaved(false);
    setRecurringModalOpen(false);

    setSched({
      type: "instant",
      cycles: 1,
    });
  }

  function saveRecurringDetails() {
    const startsOn = recurringDraft.startsOn;
    const sendTimeValue = recurringDraft.sendTime || "09:00";

    if (!startsOn) {
      setFormError("Select the recurring payroll start date.");
      return;
    }

    let nextCycles = Number(recurringDraft.runCount || 1);

    if (recurringDraft.endMode === "specific_date") {
      if (!recurringDraft.endDate) {
        setFormError("Select when the recurring payroll should end.");
        return;
      }

      nextCycles = estimateRunCountFromEndDate(
        recurringDraft.startsOn,
        recurringDraft.endDate,
        recurringDraft.frequency,
      );
    }

    if (!Number.isFinite(nextCycles) || nextCycles < 1) {
      setFormError("Enter a valid number of payroll runs.");
      return;
    }

    setFormError("");
    setRecurringSaved(true);
    setRecurringModalOpen(false);

    setSchedule({
      type: recurringDraft.frequency,
      firstRunAt: mergeDateAndTime(startsOn, sendTimeValue),
      cycles: Math.max(1, Math.min(nextCycles, 500)),
    });
  }

  React.useEffect(() => {
    if (!recurringModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeRecurringModal();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [recurringModalOpen]);

  function updateEmployee(index: number, patch: Partial<EmployeeRow>) {
    setEmployees((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function scrollToEmployeeFields() {
    window.setTimeout(() => {
      employeeStackRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function addEmployeeRow() {
    setEmployees((currentRows) => [...currentRows, emptyEmployeeRow()]);
    scrollToEmployeeFields();
  }

  function removeEmployeeRow(index: number) {
    setEmployees((currentRows) =>
      currentRows.length === 1
        ? currentRows
        : currentRows.filter((_, rowIndex) => rowIndex !== index),
    );
  }

  function triggerCsvUpload() {
    csvInputRef.current?.click();
  }

  function handleCsvUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFormError("Please upload a valid .csv file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const content = String(reader.result ?? "");
        const importedRows = parseEmployeesCsv(content);

        if (importedRows.length === 0) {
          throw new Error("No employees found in the CSV file.");
        }

        setEmployees((currentRows) => {
          const existingRows = currentRows.filter(hasEmployeeInput);
          return existingRows.length === 0
            ? importedRows
            : [...existingRows, ...importedRows];
        });

        setFormError("");

        toast.push({
          kind: "success",
          title: "CSV imported",
          message: `${importedRows.length} employee${
            importedRows.length === 1 ? "" : "s"
          } added from CSV.`,
        });

        scrollToEmployeeFields();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not import CSV file.";

        setFormError(message);

        toast.push({
          kind: "error",
          title: "CSV import failed",
          message,
        });
      }
    };

    reader.onerror = () => {
      setFormError("Could not read the CSV file.");
    };

    reader.readAsText(file);
  }

  function validatePayrollSetup() {
    setFormError("");

    if (!title.trim()) {
      setFormError("Add a payroll title before continuing.");
      return false;
    }

    return true;
  }

  function validateEmployeeRows() {
    setFormError("");

    if (activeEmployees.length === 0) {
      setFormError("Add at least one employee before continuing.");
      return false;
    }

    for (const row of activeEmployees) {
      const address = row.address.trim();
      const email = row.email.trim();
      const amount = row.amount.trim();

      if (!isValidAddress(address)) {
        setFormError(`Invalid employee wallet address: ${address || "empty"}`);
        return false;
      }

      if (email && !isValidEmail(email)) {
        setFormError(`Invalid employee email: ${email}`);
        return false;
      }

      const atomic = Number(parseDisplayToAtomic(amount, 6));

      if (!Number.isFinite(atomic) || atomic <= 0) {
        setFormError(`Invalid amount for ${address}.`);
        return false;
      }
    }

    const seenAddresses = new Set<string>();

    for (const row of activeEmployees) {
      const address = row.address.trim().toLowerCase();

      if (seenAddresses.has(address)) {
        setFormError(`Duplicate employee wallet address: ${address}`);
        return false;
      }

      seenAddresses.add(address);
    }

    return true;
  }

  function validatePayrollSchedule() {
    setFormError("");

    const errors = validateScheduleLocal(schedule);
    setScheduleErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError(Object.values(errors)[0]);
      return false;
    }

    return true;
  }

  function goNextPhase() {
    if (
      wizardPhase === 0 &&
      (!validatePayrollSetup() || !validateEmployeeRows())
    ) {
      return;
    }

    if (wizardPhase === 1 && !validatePayrollSchedule()) return;

    setFormError("");
    setWizardPhase((currentPhase) => {
      const nextPhase = currentPhase === 0 ? 1 : 2;

      if (nextPhase === 2) {
        setReviewConfirmed(false);
      }

      return nextPhase;
    });
  }

  function goPreviousPhase() {
    setFormError("");
    setReviewConfirmed(false);
    setWizardPhase((currentPhase) => (currentPhase === 2 ? 1 : 0));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (busy) return;

    setFormError("");

    try {
      if (!wallet) {
        await connect();
        throw new Error(
          "Wallet connection requested. Click Create again after wallet connects.",
        );
      }

      if (!validatePayrollSetup()) return;
      if (!validateEmployeeRows()) return;
      if (!validatePayrollSchedule()) return;
      if (!reviewConfirmed) {
        setFormError("Review the draft summary before creating it.");
        return;
      }

      setBusy(true);

      const payload = {
        chain: env.chainDbId,
        token_address: env.confidentialTokenAddress,
        employer_address: wallet.toLowerCase(),
        title: title.trim(),
        description: "",
        schedule: buildSchedulePayload(schedule),
        employees: activeEmployees.map((employee) => ({
          employee_address: employee.address.trim().toLowerCase(),
          employee_name: employee.name.trim(),
          employee_email: employee.email.trim().toLowerCase(),
          amount_atomic: Number(parseDisplayToAtomic(employee.amount, 6)),
          is_active: true,
        })),
      };

      const { data } = await api.post(routes.templates.list, payload);

      toast.push({
        kind: "success",
        title: "Draft created",
        message:
          "Your payroll draft was saved. Create and activate the payroll run from the draft page when ready.",
      });

      navigate(`/employer/templates/${data.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : apiError(error);

      setFormError(message);

      toast.push({
        kind: "error",
        title: "Draft creation failed",
        message,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack dashboard-shell create-payroll-page">
      <div className="page-header create-payroll-page-header">
        <div>
          <h1>Create Draft</h1>
        </div>
      </div>

      <form
        className="create-payroll-form create-payroll-form-redesigned"
        data-phase={wizardPhase}
        onSubmit={submit}
      >
        <Card className="create-payroll-card create-payroll-main-card">
          <div className="create-payroll-card-body">
            <div className="create-payroll-step-content">
              <section className="create-payroll-phase create-payroll-details-card">
                <div className="create-payroll-section-head">
                  <div>
                    <span>01 Draft Setup</span>
                    <h3>Draft details and employees</h3>
                  </div>
                </div>

                <div className="create-payroll-basics-grid">
                  <Field label="Draft title">
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. April core team draft"
                    />
                  </Field>
                </div>

                <div className="create-payroll-merged-section-head">
                  <div>
                    <h3>Employees</h3>
                    <p>
                      {activeEmployees.length} employee
                      {activeEmployees.length === 1 ? "" : "s"} added -{" "}
                      {perRunTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}{" "}
                      USDC per run
                    </p>
                  </div>

                  <div className="create-payroll-employee-actions">
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="create-payroll-csv-input"
                      onChange={handleCsvUpload}
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      className="create-payroll-upload-csv-btn"
                      onClick={triggerCsvUpload}
                    >
                      <Upload size={15} strokeWidth={1.8} />
                      Upload CSV
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      className="create-payroll-add-manual-btn"
                      onClick={addEmployeeRow}
                    >
                      + Add Manually
                    </Button>
                  </div>
                </div>

                <div className="create-payroll-csv-hint">
                  CSV format: <strong>address,name,email,amount</strong>
                </div>

                <div
                  ref={employeeStackRef}
                  className="stack create-payroll-employee-stack"
                >
                  {employees.map((employee, index) => (
                    <div
                      key={index}
                      className="employee-row create-payroll-employee-row"
                    >
                      <div className="create-payroll-employee-row-head">
                        <div className="employee-row-num">
                          Employee {index + 1}
                        </div>

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="create-payroll-remove-employee"
                          onClick={() => removeEmployeeRow(index)}
                          disabled={employees.length === 1}
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="create-payroll-employee-grid">
                        <Field label="Wallet address">
                          <input
                            value={employee.address}
                            onChange={(event) =>
                              updateEmployee(index, {
                                address: event.target.value,
                              })
                            }
                            placeholder="0x742d...f44e"
                          />
                        </Field>

                        <Field label="Name (optional)">
                          <input
                            value={employee.name}
                            onChange={(event) =>
                              updateEmployee(index, { name: event.target.value })
                            }
                            placeholder="Amara Okafor"
                          />
                        </Field>

                        <Field label="Email (optional)">
                          <input
                            type="email"
                            value={employee.email}
                            onChange={(event) =>
                              updateEmployee(index, { email: event.target.value })
                            }
                            placeholder="amara@company.com"
                          />
                        </Field>

                        <Field label="Amount per run">
                          <input
                            value={employee.amount}
                            onChange={(event) =>
                              updateEmployee(index, {
                                amount: event.target.value,
                              })
                            }
                            placeholder="2500.00"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="create-payroll-phase create-payroll-schedule-card">
                <div className="create-payroll-section-head">
                  <div>
                    <span>02 Schedule</span>
                    <h3>Set draft schedule</h3>
                  </div>
                </div>

                <div className="create-payroll-schedule-redesign">
                  <div className="payroll-type-card">
                    <h4>Payroll type</h4>

                    <div className="payroll-type-options">
                      <button
                        type="button"
                        className={`payroll-type-option${
                          !isRecurringPayroll ? " active" : ""
                        }`}
                        onClick={turnOffRecurringPayroll}
                      >
                        <div className="payroll-type-option-icon">
                          <CalendarDays size={17} strokeWidth={1.8} />
                        </div>

                        <strong>One-time payroll</strong>

                        <span className="payroll-type-radio" />
                      </button>

                      <button
                        type="button"
                        className={`payroll-type-option${
                          isRecurringPayroll ? " active" : ""
                        }`}
                        onClick={openRecurringModal}
                      >
                        <div className="payroll-type-option-icon">
                          <Repeat2 size={17} strokeWidth={1.8} />
                        </div>

                        <strong>Recurring payroll</strong>

                        <span className="payroll-type-radio" />
                      </button>
                    </div>
                  </div>

                  <div className="payroll-send-card">
                    <div className="payroll-send-card-head">
                      <div className="payroll-send-icon">
                        <Clock3 size={17} strokeWidth={1.8} />
                      </div>

                      <h4>
                        {isRecurringPayroll
                          ? "First payroll delivery"
                          : "Payroll delivery"}
                      </h4>
                    </div>

                    <div className="payroll-send-grid">
                      <Field
                        label={
                          isRecurringPayroll ? "First send date" : "Send date"
                        }
                      >
                        <input
                          type="date"
                          value={sendDate}
                          onChange={(event) =>
                            handleSendDateChange(event.target.value)
                          }
                        />
                      </Field>

                      <Field label="Send time">
                        <input
                          type="time"
                          value={sendTime}
                          onChange={(event) =>
                            handleSendTimeChange(event.target.value)
                          }
                        />
                      </Field>
                    </div>

                    {scheduleErrors.firstRunAt && (
                      <p className="text-danger create-payroll-schedule-error">
                        {scheduleErrors.firstRunAt}
                      </p>
                    )}
                  </div>

                  {isRecurringPayroll && (
                    <div className="recurring-payroll-summary">
                      <div className="recurring-payroll-summary-head">
                        <div>
                          <span className="recurring-payroll-badge">
                            Recurring
                          </span>
                          <h5>{frequencyLabel(schedule.type)}</h5>
                        </div>

                        <button
                          type="button"
                          className="recurring-payroll-edit-btn"
                          onClick={openRecurringModal}
                        >
                          <PenLine size={14} strokeWidth={1.8} />
                          Edit
                        </button>
                      </div>

                      <div className="recurring-payroll-summary-grid">
                        <div>
                          <span>Starts</span>
                          <strong>{formatDateOnly(recurringDraft.startsOn)}</strong>
                        </div>

                        <div>
                          <span>Time</span>
                          <strong>{recurringDraft.sendTime}</strong>
                        </div>

                        <div>
                          <span>Frequency</span>
                          <strong>
                            {frequencyLabel(recurringDraft.frequency)}
                          </strong>
                        </div>

                        <div>
                          <span>Ends</span>
                          <strong>
                            {recurringDraft.endMode === "specific_date"
                              ? formatDateOnly(recurringDraft.endDate)
                              : `${recurringDraft.runCount} runs`}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="create-payroll-schedule-preview">
                    <div>
                      <span>Preview</span>
                      <strong>{previewText}</strong>
                    </div>

                    <div>
                      <span>Runs</span>
                      <strong>{runCount}</strong>
                    </div>
                  </div>
                </div>
              </section>

              {recurringModalOpen &&
                typeof document !== "undefined" &&
                createPortal(
                  <div className="recurring-modal-overlay" role="presentation">
                    <div
                      className="recurring-modal-panel"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="recurring-payroll-title"
                    >
                      <div className="recurring-modal-topline" aria-hidden="true" />

                      <div className="recurring-modal-header recurring-modal-header-redesigned">
                        <div className="recurring-modal-title-wrap">
                          <div className="recurring-modal-title-icon">
                            <Repeat2 size={18} strokeWidth={1.8} />
                          </div>

                          <div>
                            <span>Recurring schedule</span>
                            <h3 id="recurring-payroll-title">
                              Set recurring payroll
                            </h3>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="recurring-modal-close"
                          onClick={closeRecurringModal}
                          aria-label="Close recurring payroll modal"
                        >
                          <X size={17} strokeWidth={2} />
                        </button>
                      </div>

                      <div className="recurring-modal-form recurring-modal-form-redesigned">
                        <div className="recurring-modal-grid-two">
                          <label className="recurring-modal-field-card">
                            <span>Start date</span>
                            <div className="recurring-modal-input-shell">
                              <input
                                type="date"
                                value={recurringDraft.startsOn}
                                onChange={(event) =>
                                  setRecurringDraft((current) => ({
                                    ...current,
                                    startsOn: event.target.value,
                                    endDate:
                                      current.endDate &&
                                      current.endDate >= event.target.value
                                        ? current.endDate
                                        : addOneYearDateInput(event.target.value),
                                  }))
                                }
                              />
                              <CalendarDays size={16} strokeWidth={1.7} />
                            </div>
                          </label>

                          <label className="recurring-modal-field-card">
                            <span>Send time</span>
                            <div className="recurring-modal-input-shell">
                              <input
                                type="time"
                                value={recurringDraft.sendTime}
                                onChange={(event) =>
                                  setRecurringDraft((current) => ({
                                    ...current,
                                    sendTime: event.target.value,
                                  }))
                                }
                              />
                              <Clock3 size={16} strokeWidth={1.7} />
                            </div>
                          </label>
                        </div>

                        <label className="recurring-modal-field-card recurring-modal-field-card-wide">
                          <span>Frequency</span>

                          <div
                            className="recurring-frequency-selector"
                            role="radiogroup"
                          >
                            {RECURRING_FREQ_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={`recurring-frequency-pill${
                                  recurringDraft.frequency === option.value
                                    ? " active"
                                    : ""
                                }`}
                                onClick={() =>
                                  setRecurringDraft((current) => ({
                                    ...current,
                                    frequency: option.value,
                                  }))
                                }
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </label>

                        <label className="recurring-modal-field-card recurring-modal-field-card-wide">
                          <span>Ends</span>

                          <div className="recurring-end-selector">
                            <button
                              type="button"
                              className={`recurring-end-pill${
                                recurringDraft.endMode === "specific_date"
                                  ? " active"
                                  : ""
                              }`}
                              onClick={() =>
                                setRecurringDraft((current) => ({
                                  ...current,
                                  endMode: "specific_date",
                                }))
                              }
                            >
                              Specific date
                            </button>

                            <button
                              type="button"
                              className={`recurring-end-pill${
                                recurringDraft.endMode === "run_count"
                                  ? " active"
                                  : ""
                              }`}
                              onClick={() =>
                                setRecurringDraft((current) => ({
                                  ...current,
                                  endMode: "run_count",
                                }))
                              }
                            >
                              Number of runs
                            </button>
                          </div>
                        </label>

                        {recurringDraft.endMode === "specific_date" ? (
                          <label className="recurring-modal-field-card recurring-modal-field-card-wide">
                            <span>End date</span>
                            <div className="recurring-modal-input-shell">
                              <input
                                type="date"
                                value={recurringDraft.endDate}
                                onChange={(event) =>
                                  setRecurringDraft((current) => ({
                                    ...current,
                                    endDate: event.target.value,
                                  }))
                                }
                              />
                              <CalendarDays size={16} strokeWidth={1.7} />
                            </div>
                          </label>
                        ) : (
                          <label className="recurring-modal-field-card recurring-modal-field-card-wide">
                            <span>Total runs</span>
                            <div className="recurring-modal-input-shell">
                              <input
                                type="number"
                                min={1}
                                max={500}
                                value={recurringDraft.runCount}
                                onChange={(event) =>
                                  setRecurringDraft((current) => ({
                                    ...current,
                                    runCount: Number(event.target.value),
                                  }))
                                }
                              />
                            </div>
                          </label>
                        )}
                      </div>

                      <div className="recurring-modal-preview-card">
                        <span>Preview</span>
                        <strong>
                          {frequencyLabel(recurringDraft.frequency)} payroll from{" "}
                          {formatDateOnly(recurringDraft.startsOn)} at{" "}
                          {recurringDraft.sendTime || "09:00"}
                        </strong>
                      </div>

                      <div className="recurring-modal-actions">
                        <Button
                          type="button"
                          variant="secondary"
                          className="recurring-modal-cancel-btn"
                          onClick={closeRecurringModal}
                        >
                          Cancel
                        </Button>

                        <Button
                          type="button"
                          className="recurring-modal-save-btn"
                          onClick={saveRecurringDetails}
                        >
                          Save Schedule
                        </Button>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}

              <section className="create-payroll-phase create-payroll-review-card">
                <div className="create-payroll-section-head">
                  <div>
                    <span>03 Review</span>
                    <h3>Review and create draft</h3>
                  </div>
                </div>

                <div className="create-payroll-review-list">
                  <div className="review-row">
                    <span>Connected employer</span>
                    <strong className="create-payroll-review-wallet">
                      {wallet || "Not connected"}
                    </strong>
                  </div>

                  <div className="review-row">
                    <span>Employees</span>
                    <strong>{activeEmployees.length}</strong>
                  </div>

                  <div className="review-row">
                    <span>Per-run total</span>
                    <strong>
                      {perRunTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}{" "}
                      USDC
                    </strong>
                  </div>

                  <div className="review-row">
                    <span>Total runs</span>
                    <strong>{runCount}</strong>
                  </div>

                  <div className="review-row">
                    <span>Total payroll budget</span>
                    <strong style={{ color: "var(--z-accent)" }}>
                      {totalBudget.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}{" "}
                      USDC
                    </strong>
                  </div>

                  <div className="review-row">
                    <span>Email-ready employees</span>
                    <strong>
                      {
                        activeEmployees.filter((employee) =>
                          isValidEmail(employee.email.trim()),
                        ).length
                      }{" "}
                      ready
                    </strong>
                  </div>
                </div>
              </section>
            </div>

            {formError && (
              <div className="error-box create-payroll-error-box">
                {formError}
              </div>
            )}

            <div className="wizard-actions create-payroll-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={
                  wizardPhase === 0 ? () => navigate("/employer") : goPreviousPhase
                }
              >
                <ArrowLeft size={15} strokeWidth={1.8} />
                Back
              </Button>

              <div className="create-payroll-phase-indicator">
                Step {wizardPhase + 1} of 3
              </div>

              {wizardPhase < 2 ? (
                <Button type="button" onClick={goNextPhase}>
                  {phaseCopy.nextLabel}
                  <ArrowRight size={15} strokeWidth={1.8} />
                </Button>
              ) : !reviewConfirmed ? (
                <Button type="button" onClick={() => setReviewConfirmed(true)}>
                  Confirm Review
                  <ArrowRight size={15} strokeWidth={1.8} />
                </Button>
              ) : (
                <Button type="submit" disabled={busy}>
                  {busy ? "Creating Draft..." : "Create Draft"}
                  <ArrowRight size={15} strokeWidth={1.8} />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
