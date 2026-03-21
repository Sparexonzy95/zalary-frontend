import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError } from "../lib/api";

export function useRunFundingQuote(runId: string | number) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: ["runFundingQuote", String(runId)],
    queryFn: async () => {
      try {
        const res = await api.get(`/api/inco/runs/${runId}/funding_quote/`);
        return res.data as {
          run_id: number;
          run_at: string;
          employee_count: number;
          required_total_atomic: string;
          breakdown: Array<{ employee: string; amount_atomic: string }>;
        };
      } catch (e) {
        throw toApiError(e);
      }
    },
    enabled: Boolean(runId),
    refetchInterval: () => {
      const run = qc.getQueryData(["run", String(runId)]) as
        | {
            status?: string;
          }
        | undefined;

      if (!run) return false;

      const status = String(run.status || "").toLowerCase();

      const pendingStatuses = [
        "create_broadcasted",
        "alloc_uploading",
        "alloc_finalizing",
        "funding",
      ];

      return pendingStatuses.includes(status) ? 3000 : false;
    },
    refetchIntervalInBackground: true,
  });
}