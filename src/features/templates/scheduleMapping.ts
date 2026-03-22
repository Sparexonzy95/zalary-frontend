// src/features/templates/scheduleMapping.ts

import type { ScheduleType } from "./types";

export type ScheduleFormState = {
  frequency: "one_time" | "weekly" | "monthly";
  startDate: string; // yyyy-mm-dd
  weeklyDay?: number; // 0-6 Mon-Sun
  monthlyDay?: number; // 1-28
  stopMode: "indefinite" | "after_cycles" | "end_date";
  cycles?: number;
  endDate?: string; // yyyy-mm-dd
};

export type TemplateFormState = {
  title: string;
  networkLabel: string; // display only
  schedule: ScheduleFormState;
};

export type FieldErrors = Record<string, string>;

function todayYYYYMMDD(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toISOAtNine(dateYYYYMMDD: string): string {
  // Local date at 09:00 -> ISO
  const [y, m, d] = dateYYYYMMDD.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 9, 0, 0, 0);
  return dt.toISOString();
}

export function mapFrequencyToScheduleType(f: ScheduleFormState["frequency"]): ScheduleType {
  if (f === "one_time") return "instant";
  if (f === "weekly") return "weekly";
  return "monthly";
}

export function computeEndAtFromCycles(
  startYYYYMMDD: string,
  frequency: ScheduleFormState["frequency"],
  cycles: number
): string | null {
  if (!cycles || cycles <= 0) return null;

  const [y, m, d] = startYYYYMMDD.split("-").map(Number);
  const start = new Date(y, (m ?? 1) - 1, d ?? 1, 9, 0, 0, 0);

  if (frequency === "weekly") {
    const end = new Date(start);
    end.setDate(end.getDate() + 7 * (cycles - 1));
    return end.toISOString();
  }

  if (frequency === "monthly") {
    const end = new Date(start);
    end.setMonth(end.getMonth() + (cycles - 1));
    return end.toISOString();
  }

  // one_time
  return start.toISOString();
}

export function buildSchedulePayload(s: ScheduleFormState) {
  const type = mapFrequencyToScheduleType(s.frequency);
  const start_at = toISOAtNine(s.startDate);

  let end_at: string | null = null;

  if (s.stopMode === "end_date" && s.endDate) {
    end_at = toISOAtNine(s.endDate);
  } else if (s.stopMode === "after_cycles") {
    const c = Number(s.cycles ?? 0);
    end_at = computeEndAtFromCycles(s.startDate, s.frequency, c) ?? null;
  }

  return {
    type, // ScheduleConfig.type
    start_at,
    end_at,
    hour: 9,
    minute: 0,
    weekday: s.frequency === "weekly" ? (typeof s.weeklyDay === "number" ? s.weeklyDay : null) : null,
    day_of_month: s.frequency === "monthly" ? (s.monthlyDay ?? null) : null,
  };
}

export function validateTemplateForm(state: TemplateFormState): FieldErrors {
  const e: FieldErrors = {};

  if (!state.title.trim()) e.title = "Template name is required.";

  const s = state.schedule;

  if (!s.startDate) e.startDate = "Start date is required.";
  else {
    const today = todayYYYYMMDD();
    if (s.startDate < today) e.startDate = "Start date must not be in the past.";
  }

  if (s.frequency === "weekly") {
    if (typeof s.weeklyDay !== "number" || s.weeklyDay < 0 || s.weeklyDay > 6) {
      e.weeklyDay = "Select a day of the week.";
    }
  }

  if (s.frequency === "monthly") {
    const day = Number(s.monthlyDay ?? 0);
    if (!day || day < 1 || day > 28) {
      e.monthlyDay = "Choose a day between 1 and 28.";
    }
  }
  if (s.stopMode === "after_cycles") {
    const c = Number(s.cycles ?? 0);
    if (!Number.isFinite(c) || c <= 0) e.cycles = "Enter a valid number of payroll cycles.";
  }

  if (s.stopMode === "end_date") {
    if (!s.endDate) e.endDate = "End date is required.";
    else if (s.startDate && s.endDate <= s.startDate) e.endDate = "End date must be after the start date.";
  }

  return e;
}

export const WEEKDAYS = [
  { label: "Monday", value: 0 },
  { label: "Tuesday", value: 1 },
  { label: "Wednesday", value: 2 },
  { label: "Thursday", value: 3 },
  { label: "Friday", value: 4 },
  { label: "Saturday", value: 5 },
  { label: "Sunday", value: 6 },
] as const;