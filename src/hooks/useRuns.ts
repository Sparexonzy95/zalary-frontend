import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toApiError } from "../lib/api";
import {
  createNextRun,
  getRun,
  listTemplateRuns,
  uploadRunAllocations,
} from "../features/runs/runApi";
import type { UploadAllocationsPayload } from "../features/runs/types";

const keys = {
  templateRuns: (templateId: string | number) =>
    ["templateRuns", String(templateId)] as const,
  run: (runId: string | number) => ["run", String(runId)] as const,
};

export function useTemplateRuns(templateId: string | number) {
  return useQuery({
    queryKey: keys.templateRuns(templateId),
    queryFn: async () => {
      try {
        return await listTemplateRuns(templateId);
      } catch (e) {
        throw toApiError(e);
      }
    },
    enabled: Boolean(templateId),
  });
}

export function useCreateRun(templateId: string | number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        return await createNextRun(templateId);
      } catch (e) {
        throw toApiError(e);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.templateRuns(templateId) });
    },
  });
}

export function useRun(runId: string | number) {
  return useQuery({
    queryKey: keys.run(runId),
    queryFn: async () => {
      try {
        return await getRun(runId);
      } catch (e) {
        throw toApiError(e);
      }
    },
    enabled: Boolean(runId),
    refetchInterval: (query) => {
      const run = query.state.data as
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

export function useUploadAllocations(runId: string | number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UploadAllocationsPayload) => {
      try {
        return await uploadRunAllocations(runId, payload);
      } catch (e) {
        throw toApiError(e);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.run(runId) });
      await qc.invalidateQueries({
        queryKey: ["runFundingQuote", String(runId)],
      });
    },
  });
}