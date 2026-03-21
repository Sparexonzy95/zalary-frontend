import { useQuery } from "@tanstack/react-query";
import { api, toApiError } from "../lib/api";

export type EmployeeClaimable = {
  run_id: number;
  template_id: number;
  run_at: string;
  deadline_u64: string;
  onchain_payroll_id: string;
  token_address: string;
  claim_status: string;
  claim_id: number | null;
};

export type EmployeeClaimablesResponse = {
  employee: string;
  claimables: EmployeeClaimable[];
};

function normalizeWallet(wallet?: string) {
  if (!wallet) return "";
  return wallet.trim().toLowerCase();
}

export function useEmployeeClaimables(wallet?: string) {
  const normalizedWallet = normalizeWallet(wallet);

  return useQuery<EmployeeClaimablesResponse>({
    queryKey: ["employeeClaimables", normalizedWallet],
    queryFn: async () => {
      try {
        if (!normalizedWallet) {
          return {
            employee: "",
            claimables: [],
          };
        }

        const res = await api.get(
          `/api/inco/employees/${normalizedWallet}/claimables/`
        );

        return res.data as EmployeeClaimablesResponse;
      } catch (e) {
        throw toApiError(e);
      }
    },
    enabled: !!normalizedWallet,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });
}