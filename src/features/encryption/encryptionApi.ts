import { api } from "../../lib/api";
import type { SaveEncryptedAllocationsPayload } from "./types";

export async function submitCreateOnchain(runId: string | number, payload: Record<string, unknown>) {
  const res = await api.post(`/api/inco/runs/${runId}/submit_create_onchain/`, payload);
  return res.data;
}

export async function saveEncryptedAllocations(
  runId: string | number,
  payload: SaveEncryptedAllocationsPayload
) {
  const res = await api.post(`/api/inco/runs/${runId}/save_encrypted_allocations/`, payload);
  return res.data;
}

export async function submitUploadAllocationsChunk(
  runId: string | number,
  payload: { employees: string[]; tx_hash?: string; fee_wei?: string | number; sender?: string; nonce?: number }
) {
  const res = await api.post(`/api/inco/runs/${runId}/submit_upload_allocations_chunk/`, payload);
  return res.data;
}

export async function submitFinalizeAllocations(runId: string | number, payload: Record<string, unknown>) {
  const res = await api.post(`/api/inco/runs/${runId}/submit_finalize_allocations/`, payload);
  return res.data;
}