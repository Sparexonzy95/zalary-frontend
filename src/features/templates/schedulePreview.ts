import { WEEKDAYS, type ScheduleFormState } from "./scheduleMapping";

function humanDate(yyyyMMdd: string) {
  const [y, m, d] = yyyyMMdd.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  // eslint-disable-next-line no-nested-ternary
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function schedulePreview(s: ScheduleFormState) {
  const start = s.startDate ? humanDate(s.startDate) : "your start date";

  if (s.frequency === "one_time") {
    return `This payroll will run once on ${start}.`;
  }

  if (s.frequency === "weekly") {
    const day = WEEKDAYS.find((x) => x.value === s.weeklyDay)?.label ?? "your selected weekday";
    if (s.stopMode === "after_cycles" && s.cycles) {
      return `This payroll will run every ${day} starting ${start} and stop after ${s.cycles} runs.`;
    }
    if (s.stopMode === "end_date" && s.endDate) {
      return `This payroll will run every ${day} starting ${start} and end on ${humanDate(s.endDate)}.`;
    }
    return `This payroll will run every ${day} starting ${start}.`;
  }

  // monthly
  const dom = s.monthlyDay ? ordinal(s.monthlyDay) : "your selected day";
  if (s.stopMode === "after_cycles" && s.cycles) {
    return `This payroll will run every month on the ${dom} starting ${start} and stop after ${s.cycles} runs.`;
  }
  if (s.stopMode === "end_date" && s.endDate) {
    return `This payroll will run every month on the ${dom} starting ${start} and end on ${humanDate(s.endDate)}.`;
  }
  return `This payroll will run every month on the ${dom} starting ${start}.`;
}