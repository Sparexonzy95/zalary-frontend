import { useMutation } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useCreateOnchainPayroll(runId: string) {
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(
        `/api/inco/runs/${runId}/submit_create_onchain/`,
        payload
      )
      return res.data
    }
  })
}