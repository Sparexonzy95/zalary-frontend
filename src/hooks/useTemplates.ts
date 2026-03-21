import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError } from "../lib/api";
import type { CreateTemplatePayload, PayrollTemplate } from "../features/templates/types";

const keys = {
  list:    (wallet?: string) => ["templates", wallet ?? ""] as const,
  detail:  (id: string | number) => ["templates", String(id)] as const,
  preview: (id: string | number) => ["templatePreviewRuns", String(id)] as const,
};

/**
 * Only fetches templates owned by the provided employer wallet.
 * Query is disabled until a wallet is connected — prevents showing
 * other employers' templates to employees or unauthenticated users.
 */
export function useTemplatesList(employerAddress?: string) {
  return useQuery({
    queryKey: keys.list(employerAddress),
    queryFn: async () => {
      const res = await api.get<PayrollTemplate[]>(
        `/api/inco/templates/?employer_address=${encodeURIComponent(employerAddress!)}`
      );
      return res.data;
    },
    enabled: Boolean(employerAddress),
  });
}

export function useTemplate(id?: string, enabled?: boolean) {
  return useQuery({
    queryKey: keys.detail(id || "0"),
    queryFn: async () => {
      const res = await api.get<PayrollTemplate>(`/api/inco/templates/${id}/`);
      return res.data;
    },
    enabled: Boolean(id) && (enabled ?? true),
  });
}

export function useTemplatePreviewRuns(id?: string, enabled?: boolean) {
  return useQuery({
    queryKey: keys.preview(id || "0"),
    queryFn: async () => {
      try {
        const res = await api.get<{
          all_times: string[];
          future_times: string[];
          future_count: number;
          next_run_at: string | null;
        }>(`/api/inco/templates/${id}/preview_runs/`);
        return res.data;
      } catch (err) {
        throw toApiError(err);
      }
    },
    enabled: Boolean(id) && (enabled ?? true),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTemplatePayload & { employer_address?: string }) => {
      try {
        const res = await api.post<PayrollTemplate>("/api/inco/templates/", payload);
        return res.data;
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useActivateTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        const res = await api.post(`/api/inco/templates/${id}/activate/`, {});
        return res.data;
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["templates"] });
      await qc.invalidateQueries({ queryKey: keys.detail(id) });
      await qc.invalidateQueries({ queryKey: keys.preview(id) });
    },
  });
}