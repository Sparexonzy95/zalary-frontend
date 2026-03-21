export type ScheduleType = "instant" | "weekly" | "monthly";

export type ScheduleConfig = {
  id?: number;
  type: ScheduleType;
  start_at: string; // ISO
  end_at: string | null; // ISO or null
  hour: number;
  minute: number;
  weekday: number | null; // 0-6 (Mon-Sun in our UI mapping)
  day_of_month: number | null; // 1-28
};

export type PayrollTemplate = {
  id: number;
  chain: number;
  token_address: string;
  title: string;
  description?: string | null;
  status: string;
  schedule: ScheduleConfig;
  employees: unknown[];
  created_at?: string;
  updated_at?: string;
};

export type CreateTemplatePayload = {
  chain: number;
  token_address: string;
  title: string;
  schedule: Omit<ScheduleConfig, "id">;
  employees: unknown[];
};