import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  isRunWaitingForConfirmation,
  isTerminalRun,
  statusOf,
} from "../lib/payrollStatus";
import { routes } from "../lib/routes";
import type { PayrollRun } from "../lib/types";
import type { TxRegistrationPayload } from "../lib/payrollTransactions";

export type FundingQuote = {
  run_id?: number | string;
  run_at?: string | null;
  employee_count?: number;
  required_total_atomic?: string | number | bigint | null;
  breakdown?: unknown;
};

export type MissingHandlesResponse = {
  missing?: string[];
  count?: number;
};

export type RunAllocation = {
  id?: number | string;
  run?: number | string;
  employee_address: string;
  employee_name?: string;
  employee_email?: string;
  amount_atomic?: string | number | bigint;
  amount_handle?: string | null;
  amount_ciphertext_hex?: string | null;
  upload_tx_hash?: string | null;
};

export type UploadAllocationsPayload = TxRegistrationPayload & {
  idempotency_key: string;
  employee_addresses: string[];
  encrypted_amounts: Array<Record<string, unknown>>;
  inputProof: string;
};

export type FundPayrollPayload = TxRegistrationPayload & {
  amount_atomic: string;
  encrypted_amount: Record<string, unknown>;
  inputProof: string;
};

export type ActivatePayrollPayload = TxRegistrationPayload & {
  funded_plaintext: boolean;
  decryption_proof: string;
  funded_sig?: string;
};

function idKey(value?: string | number | null) {
  return String(value ?? "");
}

function hasId(value?: string | number | null) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function requireRunId(value?: string | number | null) {
  const id = idKey(value);

  if (!id) {
    throw new Error("Run ID is missing.");
  }

  return id;
}

async function invalidateRunQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  runId?: string | number | null,
) {
  const id = idKey(runId);

  await Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: ["run", id] }),
    queryClient.invalidateQueries({ queryKey: ["funding-quote", id] }),
    queryClient.invalidateQueries({ queryKey: ["missing-handles", id] }),
    queryClient.invalidateQueries({ queryKey: ["run-allocations", id] }),
    queryClient.invalidateQueries({ queryKey: ["template-runs"], exact: false }),
    queryClient.invalidateQueries({ queryKey: ["zama", "templateRuns"], exact: false }),
    queryClient.invalidateQueries({ queryKey: ["zama", "templates"], exact: false }),
  ]);
}

async function postRunAction<T>(url: string, payload: unknown): Promise<T> {
  const { data } = await api.post(url, payload);
  return data as T;
}

export function useRun(runId?: string | number | null) {
  return useQuery({
    queryKey: ["run", idKey(runId)],
    queryFn: async () => {
      const id = requireRunId(runId);
      const { data } = await api.get(routes.runs.detail(id));
      return data as PayrollRun;
    },
    enabled: hasId(runId),
    refetchInterval: (query) => {
      const run = query.state.data as PayrollRun | undefined;
      const status = statusOf(run?.status);

      if (!run || isRunWaitingForConfirmation(status)) return 1_000;
      if (!isTerminalRun(status) && status !== "active") return 2_000;
      return false;
    },
    refetchOnMount: false,
    staleTime: 5_000,
  });
}

export function useRunFundingQuote(runId?: string | number | null) {
  return useQuery({
    queryKey: ["funding-quote", idKey(runId)],
    queryFn: async () => {
      const id = requireRunId(runId);
      const { data } = await api.get(routes.runs.fundingQuote(id));
      return data as FundingQuote;
    },
    enabled: hasId(runId),
    staleTime: 60_000,
  });
}

export function useRunMissingHandles(runId?: string | number | null) {
  return useQuery({
    queryKey: ["missing-handles", idKey(runId)],
    queryFn: async () => {
      const id = requireRunId(runId);
      const { data } = await api.get(routes.runs.missingHandles(id));

      return {
        missing: Array.isArray(data?.missing) ? data.missing : [],
        count: Number(data?.count ?? data?.missing?.length ?? 0),
      } as MissingHandlesResponse;
    },
    enabled: hasId(runId),
    staleTime: 30_000,
  });
}

export function useRunAllocations(runId?: string | number | null) {
  return useQuery({
    queryKey: ["run-allocations", idKey(runId)],
    queryFn: async () => {
      const id = requireRunId(runId);
      const { data } = await api.get(routes.runs.allocations(id));
      return Array.isArray(data) ? (data as RunAllocation[]) : [];
    },
    enabled: hasId(runId),
    initialData: [] as RunAllocation[],
    staleTime: 30_000,
  });
}

export function useCreateOnchainPayroll(runId?: string | number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TxRegistrationPayload) => {
      const id = requireRunId(runId);
      return postRunAction(routes.runs.createPayroll(id), payload);
    },
    onSuccess: async () => {
      await invalidateRunQueries(queryClient, runId);
    },
  });
}

export function useUploadAllocations(runId?: string | number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UploadAllocationsPayload) => {
      const id = requireRunId(runId);
      return postRunAction(routes.runs.uploadAllocations(id), payload);
    },
    onSuccess: async () => {
      await invalidateRunQueries(queryClient, runId);
    },
  });
}

export function useFinalizeAllocations(runId?: string | number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TxRegistrationPayload) => {
      const id = requireRunId(runId);
      return postRunAction(routes.runs.finalizeAllocations(id), payload);
    },
    onSuccess: async () => {
      await invalidateRunQueries(queryClient, runId);
    },
  });
}

export function useFundPayroll(runId?: string | number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FundPayrollPayload) => {
      const id = requireRunId(runId);
      return postRunAction(routes.runs.submitFund(id), payload);
    },
    onSuccess: async () => {
      await invalidateRunQueries(queryClient, runId);
    },
  });
}

export function useActivatePayroll(runId?: string | number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ActivatePayrollPayload) => {
      const id = requireRunId(runId);
      return postRunAction(routes.runs.activateOnchain(id), payload);
    },
    onSuccess: async () => {
      await Promise.allSettled([
        invalidateRunQueries(queryClient, runId),
        queryClient.invalidateQueries({ queryKey: ["claimables"], exact: false }),
      ]);
    },
  });
}


