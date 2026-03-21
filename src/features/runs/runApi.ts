import { api } from "../../lib/api";
import type { PayrollRun, UploadAllocationsPayload } from "./types";

export async function listTemplateRuns(templateId: string | number) {
  const res = await api.get<PayrollRun[]>(`/api/inco/templates/${templateId}/runs/`);
  return res.data;
}

export async function createNextRun(templateId: string | number) {
  const res = await api.post<PayrollRun>(`/api/inco/templates/${templateId}/create_next_run/`, {});
  return res.data;
}

export async function getRun(runId: string | number) {
  const res = await api.get<PayrollRun>(`/api/inco/runs/${runId}/`);
  return res.data;
}

export async function uploadRunAllocations(runId: string | number, payload: UploadAllocationsPayload) {
  const res = await api.post(`/api/inco/runs/${runId}/upload_run_allocations/`, payload);
  return res.data;
}