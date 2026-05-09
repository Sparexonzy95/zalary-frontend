export type Role = "employer" | "employee";

export type ScheduleType = "instant" | "daily" | "weekly" | "monthly";

export type ScheduleConfig = {
  id?: number;
  type: ScheduleType;
  start_at: string;
  end_at?: string | null;
  hour?: number;
  minute?: number;
  weekday?: number | null;
  day_of_month?: number | null;
  month_of_year?: number | null;
};

export type TemplateEmployee = {
  employee_address: string;
  amount_atomic: number | string;
  is_active: boolean;
};

export type PayrollTemplate = {
  id: number;
  chain: number;
  token_address: string;
  schedule: ScheduleConfig;
  title: string;
  description: string;
  employer_address: string;
  status: "draft" | "active" | "paused" | "completed";
  next_run_at?: string | null;
  last_run_at?: string | null;
  employees: TemplateEmployee[];
  created_at?: string;
  updated_at?: string;
};

export type PayrollRun = {
  id: number;
  template: number;
  chain: number;
  run_at: string;
  deadline_u64: string | number;
  employee_count_u32: number;
  required_total_atomic: string | number;
  onchain_payroll_id?: string | number | null;
  employer_address?: string;
  status: string;
  last_error?: string;
  create_tx_hash?: string;
  fund_tx_hash?: string;
  activate_tx_hash?: string;
  funded_once_handle?: string;
  funded_plaintext?: boolean | null;
  funded_decryption_proof?: string;
};

export type Claim = {
  id: number;
  run: number;
  employee_address: string;

  /**
   * Demo-state-derived amount from RunAllocation.amount_atomic.
   * This is the full salary amount the employee should withdraw.
   * Frontend should NOT ask users to manually type withdraw amount.
   */
  claim_amount_atomic?: string | number | null;

  request_tx_hash?: string;
  finalize_tx_hash?: string;
  cancel_tx_hash?: string;
  request_id?: string;
  pending_ok_handle?: string;
  pending_request_id?: string;
  ok_plaintext?: boolean | null;
  ok_decryption_proof?: string;
  status: string;
  last_error?: string;

  run_onchain_payroll_id?: number | string | null;

  withdraw_id?: number | string | null;
  withdraw_key?: string | null;
  withdraw_status?: string | null;
};

export type SwapRouterWithdraw = {
  id: number;
  claim: number;
  chain: number;
  user_address: string;
  withdraw_key?: string | null;
  request_tx_hash?: string;
  finalize_tx_hash?: string;
  cancel_tx_hash?: string;
  request_id?: string;
  pending_amount_handle?: string;
  pending_ok_handle?: string;
  pending_request_id?: string;
  amount_plaintext?: string | number | null;
  amount_decryption_proof?: string;
  ok_plaintext?: boolean | null;
  ok_decryption_proof?: string;
  status: string;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
};

export type Claimable = {
  run_id: number;
  template_id: number;
  run_at: string;
  deadline_u64: string;
  onchain_payroll_id: string;
  token_address: string;
  run_status: string;
  claim_status: string;
  claim_id: number | null;
};

export type ProfilePayload = {
  wallet_address: string;
  email: string;
  email_verified: boolean;
  last_selected_role: Role;

  employer?: {
    company_name?: string;
    work_email?: string;
    company_size?: string;
    onboarding_completed?: boolean;
  } | null;

  employee?: {
    display_name?: string;
    notification_email?: string;
    private_access_enabled?: boolean;
    onboarding_completed?: boolean;
    completed_at?: string | null;
  } | null;
};

export type EncryptedInput = {
  handle?: string;
  inputProof?: string;
  ctHash: string | number | bigint;
  securityZone: number;
  utype: number;
  signature: string;
};
