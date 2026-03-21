export type PayrollRun = {
  id: number;
  run_at: string;
  deadline_u64: number;
  employee_count_u32: number;
  required_total_atomic: number;
  onchain_payroll_id: number | null;
  employer_address: string;
  status: string;
  last_error: string;
  create_tx_hash: string;
  created_at: string;
  updated_at: string;
  template: number;
  chain: number;
};

export type AllocationInputRow = {
  walletAddress: string;
  name?: string;
  amount: string; // human amount like 1500.25
};

export type UploadAllocationsPayload = {
  allocations: Array<{
    employee_address: string;
    amount_atomic: string;
    amount_ciphertext_hex: string;
  }>;
};