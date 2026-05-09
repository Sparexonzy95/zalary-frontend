export const routes = {
  onboarding: {
    nonce: "/api/v1/onboarding/auth/nonce/",
    verify: "/api/v1/onboarding/auth/verify/",
    logout: "/api/v1/onboarding/auth/logout/",
    profile: "/api/v1/onboarding/profile/",
    employerProfile: "/api/v1/onboarding/profile/employer/",
    employeeProfile: "/api/v1/onboarding/profile/employee/",
    privateAccess: "/api/v1/onboarding/profile/employee/private-access/",
    requestCode: "/api/v1/onboarding/email/request-code/",
    verifyEmail: "/api/v1/onboarding/email/verify/",
  },

  templates: {
    list: "/api/cofhe/templates/",
    detail: (id: string | number) => `/api/cofhe/templates/${id}/`,
    activate: (id: string | number) => `/api/cofhe/templates/${id}/activate/`,
    previewRuns: (id: string | number) => `/api/cofhe/templates/${id}/preview_runs/`,
    runs: (id: string | number) => `/api/cofhe/templates/${id}/runs/`,
    createNextRun: (id: string | number) => `/api/cofhe/templates/${id}/create_next_run/`,
  },

  runs: {
    list: "/api/cofhe/runs/",
    detail: (id: string | number) => `/api/cofhe/runs/${id}/`,
    allocations: (id: string | number) => `/api/cofhe/runs/${id}/allocations/`,
    fundingQuote: (id: string | number) => `/api/cofhe/runs/${id}/funding_quote/`,
    fundingContext: (id: string | number) => `/api/cofhe/runs/${id}/funding_context/`,
    fundedOnceHandle: (id: string | number) => `/api/cofhe/runs/${id}/funded_once_handle/`,
    missingHandles: (id: string | number) => `/api/cofhe/runs/${id}/missing_handles/`,
    setHandles: (id: string | number) => `/api/cofhe/runs/${id}/set_handles/`,

    createPayroll: (id: string | number) => `/api/cofhe/runs/${id}/create_payroll/`,
    uploadAllocations: (id: string | number) => `/api/cofhe/runs/${id}/upload_allocations/`,
    finalizeAllocations: (id: string | number) => `/api/cofhe/runs/${id}/finalize_allocations/`,
    submitFund: (id: string | number) => `/api/cofhe/runs/${id}/fund_payroll/`,
    activateOnchain: (id: string | number) => `/api/cofhe/runs/${id}/activate_payroll/`,
  },

  claims: {
    list: "/api/cofhe/claims/",
    detail: (id: string | number) => `/api/cofhe/claims/${id}/`,
    claimables: (address: string) => `/api/cofhe/employees/${address}/claimables/`,
    request: (id: string | number) => `/api/cofhe/claims/${id}/submit_request_claim/`,
    syncPending: (id: string | number) => `/api/cofhe/claims/${id}/sync_pending/`,
    finalize: (id: string | number) => `/api/cofhe/claims/${id}/submit_finalize_claim/`,
    cancel: (id: string | number) => `/api/cofhe/claims/${id}/submit_cancel_claim/`,
  },

  withdraws: {
    create: "/api/cofhe/swaprouter/withdraws/",
    detail: (id: string | number) => `/api/cofhe/swaprouter/withdraws/${id}/`,
    request: (id: string | number) => `/api/cofhe/swaprouter/withdraws/${id}/submit_request/`,
    syncPending: (id: string | number) => `/api/cofhe/swaprouter/withdraws/${id}/sync_pending/`,
    finalize: (id: string | number) => `/api/cofhe/swaprouter/withdraws/${id}/submit_finalize/`,
    cancel: (id: string | number) => `/api/cofhe/swaprouter/withdraws/${id}/submit_cancel/`,
  },
};


