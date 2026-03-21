import { useMutation } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useFinalizeAllocations(runId: string) {
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(
        `/api/inco/runs/${runId}/submit_finalize_allocations/`,
        payload
      )
      return res.data
    }
  })
}