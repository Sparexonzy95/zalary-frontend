# Architecture

## Frontend Architecture

The frontend is a React + Vite application. It uses React Router for page routing, TanStack Query for workflow data loading/mutation state, viem for wallet and contract transaction helpers, and local styling under `src/styles` plus landing-page component styles.

The app is organized around two role journeys:

- Employer: payroll setup, employee allocation, payroll run, funding, activation.
- Employee: claim dashboard, claim detail, request/finalize claim, withdrawal.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/app` | Role entry/welcome flow |
| `/verify/employer` | Employer wallet verification |
| `/verify/employee` | Employee wallet verification |
| `/onboarding/employer` | Employer onboarding |
| `/onboarding/employee` | Employee onboarding |
| `/account` | Connected account view |
| `/employer` | Employer dashboard |
| `/employer/templates/new` | Create payroll template |
| `/employer/templates/:id` | Payroll template detail |
| `/employer/runs/:runId` | Payroll run detail and lifecycle |
| `/employee/claims` | Employee claims dashboard |
| `/employee/claims/:claimId` | Employee claim detail and withdrawal flow |

## Employer Pages

Employer pages live under `src/pages/employer`. They cover payroll creation, payroll template detail, payroll run status, salary allocation upload, funding, and activation.

## Employee Pages

Employee pages live under `src/pages/employee`. They cover claim discovery, claim detail, claim request, claim finalization, and withdrawal handling.

## Wallet Connection

Wallet connection code is implemented in `src/lib/wallet.tsx` and surfaced through role-aware onboarding and navigation components. The target network is Ethereum Sepolia, chain ID `11155111`.

## Contract Configuration

Contract addresses are configured through `.env` variables and defaulted in `src/lib/env.ts`:

- `VITE_CONFIDENTIAL_TOKEN_ADDRESS`
- `VITE_PAYROLL_VAULT_ADDRESS`
- `VITE_SWAP_ROUTER_ADDRESS`
- `VITE_CHAIN_ID`
- `VITE_RPC_URL`

## Public Submission Boundary

This repository is for the frontend implementation only. The smart contracts are in a separate repository. Optional local demo/state endpoints may be used by the UI to preserve walkthrough state, but they are not part of the public contract + frontend submission boundary.
