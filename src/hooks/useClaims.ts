import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError } from "../lib/api";

export type ClaimStatus =
  | "draft"
  | "not_started"
  | "request_broadcasted"
  | "pending_ready"
  | "finalize_broadcasted"
  | "finalized_success"
  | "finalized_revert"
  | "failed"
  | string;

export type ClaimRecord = {
  id: number;
  run: number;
  employee_address: string;
  status: ClaimStatus;
  run_status?: string;
  last_error?: string | null;
  request_id?: string | null;
  request_tx_hash?: string | null;
  finalize_tx_hash?: string | null;
  pending_ok_handle?: string | null;
  pending_pay_handle?: string | null;
  pending_request_id?: string | null;
  ok_value_b32?: string | null;
  ok_sigs?: string[] | null;
  run_onchain_payroll_id?: number | null;
  employee_amount_atomic?: string | null;
  token_address?: string | null;
};

export type CreateClaimPayload = {
  run: number;
  employee_address: string;
};

export type SubmitRequestClaimPayload = {
  tx_hash: string;
  sender: string;
  nonce: number;
};

export type SyncPendingResponse = {
  pendingOkHandle: string;
  pendingPayHandle: string;
  pendingRequestId: string;
};

export type FinalizeClaimPayload = {
  tx_hash: string;
  sender: string;
  nonce: number;
  okAtt: { handle: string; value: string };
  okSigs: string[];
  requestId: string;
};

function invalidateEmployeeClaimQueries(
  qc: ReturnType<typeof useQueryClient>,
  claimId?: string,
  employeeAddress?: string
) {
  const jobs: Promise<unknown>[] = [];

  if (claimId) {
    jobs.push(qc.invalidateQueries({ queryKey: ["claim", claimId] }));
  }

  if (employeeAddress) {
    jobs.push(
      qc.invalidateQueries({
        queryKey: ["employeeClaimables", employeeAddress.toLowerCase()],
      })
    );
  }

  return Promise.all(jobs);
}

export function useCreateClaim() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
  try {
    const res = await api.post(`/api/inco/claims/${claimId}/sync_pending/`, {});
    // 202 means not ready yet — treat as retriable, not an error
    if (res.status === 202) {
      throw { status: 202, message: res.data?.detail || "Transaction still confirming. Please wait and try again." };
    }
    if (!res.data?.confirmed) {
      throw { status: 202, message: res.data?.detail || "Not ready yet. Please try again in a few seconds." };
    }
    return res.data as SyncPendingResponse;
  } catch (e: any) {
    if (e?.status === 202) throw e;
    throw toApiError(e);
  }
},
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: ["employeeClaimables", vars.employee_address.toLowerCase()],
      });
    },
  });
}

export function useClaim(claimId?: string) {
  return useQuery<ClaimRecord>({
    queryKey: ["claim", claimId],
    queryFn: async () => {
      try {
        const res = await api.get(`/api/inco/claims/${claimId}/`);
        return res.data as ClaimRecord;
      } catch (e) {
        throw toApiError(e);
      }
    },
    enabled: !!claimId,
    refetchInterval: (query) => {
      const claim = query.state.data as ClaimRecord | undefined;
      if (!claim) return false;

      const status = String(claim.status || "").toLowerCase();
     return ["request_broadcasted", "pending_ready", "finalize_broadcasted"].includes(status) ? 1500 : false;
    },
    refetchIntervalInBackground: true,
  });
}

export function useRequestClaim(claimId?: string, employeeAddress?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitRequestClaimPayload) => {
      try {
        const res = await api.post(
          `/api/inco/claims/${claimId}/submit_request_claim/`,
          payload
        );
        return res.data as { tx_hash: string };
      } catch (e) {
        throw toApiError(e);
      }
    },
    onSuccess: async () => {
      await invalidateEmployeeClaimQueries(qc, claimId, employeeAddress);
    },
  });
}

export function useSyncPending(claimId?: string, employeeAddress?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const res = await api.post(`/api/inco/claims/${claimId}/sync_pending/`, {});
        return res.data as SyncPendingResponse;
      } catch (e) {
        throw toApiError(e);
      }
    },
    onSuccess: async () => {
      await invalidateEmployeeClaimQueries(qc, claimId, employeeAddress);
    },
  });
}

export function useFinalizeClaim(claimId?: string, employeeAddress?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FinalizeClaimPayload) => {
      try {
        const res = await api.post(
          `/api/inco/claims/${claimId}/submit_finalize_claim_with_payload/`,
          payload
        );
        return res.data as { tx_hash: string };
      } catch (e) {
        throw toApiError(e);
      }
    },
    onSuccess: async () => {
      await invalidateEmployeeClaimQueries(qc, claimId, employeeAddress);
    },
  });
}