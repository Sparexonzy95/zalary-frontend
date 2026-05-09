import type { ScheduleConfig, ScheduleType } from "./types";

export type ScheduleFormState = {
  type: ScheduleType;
  firstRunAt: string;
  cycles: number;
};

export function defaultFirstRunAt() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toLocalInputValue(d);
}

export function toLocalInputValue(date: Date) {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addCycles(start: Date, type: ScheduleType, cycles: number) {
  const end = new Date(start);
  const count = Math.max(1, cycles) - 1;
  if (type === "daily") end.setDate(end.getDate() + count);
  if (type === "weekly") end.setDate(end.getDate() + count * 7);
  if (type === "monthly") end.setMonth(end.getMonth() + count);
  if (type === "instant") return start;
  return end;
}

export function buildSchedulePayload(form: ScheduleFormState): ScheduleConfig {
  const start = new Date(form.firstRunAt);
  const type = form.type;
  const cycles = type === "instant" ? 1 : Math.max(1, Number(form.cycles || 1));
  const end = addCycles(start, type, cycles);
  return {
    type,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    hour: start.getHours(),
    minute: start.getMinutes(),
    weekday: type === "weekly" ? start.getDay() : null,
    day_of_month: type === "monthly" ? start.getDate() : null,
    month_of_year: null,
  };
}


