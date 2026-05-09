import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { routes } from "../lib/routes";
import type { PayrollRun, PayrollTemplate } from "../lib/types";

export type TemplatePreviewRuns = {
  next_run_at?: string | null;
  times?: string[];
};

function hasId(id?: string | number | null) {
  return id !== undefined && id !== null && String(id).trim() !== "";
}

function idKey(id?: string | number | null) {
  return String(id ?? "");
}

export function useTemplate(id?: string | number | null) {
  return useQuery({
    queryKey: ["template", idKey(id)],
    queryFn: async () => {
      const { data } = await api.get(routes.templates.detail(idKey(id)));
      return data as PayrollTemplate;
    },
    enabled: hasId(id),
  });
}

export function useTemplatePreviewRuns(id?: string | number | null) {
  return useQuery({
    queryKey: ["template-preview-runs", idKey(id)],
    queryFn: async () => {
      const { data } = await api.get(routes.templates.previewRuns(idKey(id)));
      return data as TemplatePreviewRuns;
    },
    enabled: hasId(id),
  });
}

export function useTemplateRuns(id?: string | number | null) {
  return useQuery({
    queryKey: ["template-runs", idKey(id)],
    queryFn: async () => {
      const { data } = await api.get(routes.templates.runs(idKey(id)));
      return data as PayrollRun[];
    },
    enabled: hasId(id),
  });
}

export function useActivateTemplate(id?: string | number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(routes.templates.activate(idKey(id)), {});
      return data as PayrollTemplate;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["template", idKey(id)] }),
        queryClient.invalidateQueries({
          queryKey: ["template-preview-runs", idKey(id)],
        }),
        queryClient.invalidateQueries({
          queryKey: ["template-runs", idKey(id)],
        }),
        queryClient.invalidateQueries({
          queryKey: ["zama", "templates"],
          exact: false,
        }),
      ]);
    },
  });
}

export function useCreateNextRun(id?: string | number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, unknown> = {}) => {
      const { data } = await api.post(
        routes.templates.createNextRun(idKey(id)),
        payload,
      );

      return data as PayrollRun;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["template", idKey(id)] }),
        queryClient.invalidateQueries({
          queryKey: ["template-preview-runs", idKey(id)],
        }),
        queryClient.invalidateQueries({
          queryKey: ["template-runs", idKey(id)],
        }),
        queryClient.invalidateQueries({
          queryKey: ["zama", "templateRuns"],
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: ["zama", "templates"],
          exact: false,
        }),
      ]);
    },
  });
}