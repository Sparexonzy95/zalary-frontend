# Zalary Zama Frontend

## Project Overview

Zalary is a confidential payroll dApp powered by Zama FHEVM. This frontend demonstrates the employer and employee journeys for creating, managing, claiming, and withdrawing payroll while preserving the idea of private salary allocations on public blockchain infrastructure.

This repository contains the frontend implementation only.

## Submission Context

This repository is prepared for the Zama Developer Program Mainnet Season 2 Builder Track submission. The public submission focuses on the smart contract implementation and this frontend implementation. Smart contracts are maintained in a separate repository.

Internal orchestration and state services used during development are not included in this public frontend repository and are not required public submission components.

## Problem Statement

Payroll is sensitive. Public blockchain systems make financial flows auditable, but they can also expose employee salary allocations, claim-related values, and operational payroll details. Employers need transparent settlement without revealing private compensation data.

## Solution

Zalary uses Zama FHEVM concepts to model payroll flows where sensitive values can be handled confidentially while still supporting wallet-native execution on Ethereum Sepolia. The frontend presents the practical journey: employers prepare and fund payroll, employees discover claimable payroll, and both roles move through private claim and withdrawal flows.

## What This Frontend Demonstrates

- A public landing page for the Zalary payroll product.
- Wallet-first onboarding for employer and employee roles.
- Employer payroll creation, employee allocation entry, payroll run review, funding, and activation screens.
- Employee claim discovery, claim detail, request/finalize claim, and withdrawal screens.
- Sepolia contract configuration through environment variables.

## Employer Journey

Employers can connect a wallet, enter the employer workspace, create a payroll template, add employees, assign salary allocations, create a payroll run, fund the run, and activate payroll. The UI is designed to show how payroll operations can remain usable while confidential salary values are routed through FHE-enabled contract flows.

## Employee Journey

Employees can connect a wallet, enter the claims dashboard, view claimable payroll runs for their wallet, open claim detail, request a claim, finalize a claim, and continue into the withdrawal journey.

## Why Zama FHEVM

Zama FHEVM makes it possible to build smart contract flows around encrypted values. For payroll, that matters because salary allocations and claim-related values should not have to become public simply because settlement happens on-chain.

## Contract Repository Placeholder

Smart contract repository: `TODO: add contract repository URL`

## Deployed Contract Addresses

Target network: Ethereum Sepolia

Chain ID: `11155111`

| Contract | Address |
| --- | --- |
| ConfidentialToken | `0xeb517F61CA9cbffa93ddB4a1452257AeF41058B3` |
| PayrollVault | `0x2C4C63213Ac5b0fd23B6f468709137C9d80C82B7` |
| SwapRouter | `0x95FB006A9f3493b69054BcdcA5Cf96C5C43e91Da` |

## Repository Structure

```text
zalary-zama-frontend/
|-- public/
|-- src/
|-- docs/
|   |-- overview.md
|   |-- architecture.md
|   |-- employer-flow.md
|   |-- employee-flow.md
|   |-- deployment.md
|   `-- demo-script.md
|-- screenshots/
|   `-- README.md
|-- .env.example
|-- .gitignore
|-- index.html
|-- package.json
|-- tsconfig.json
|-- vite.config.ts
|-- README.md
`-- LICENSE
```

## Local Setup

```bash
npm install
cp .env.example .env
```

Review `.env` before running the app. The default public contract configuration points to Ethereum Sepolia.

## Environment Variables

Required public contract configuration:

```bash
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Ethereum Sepolia
VITE_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_CONFIDENTIAL_TOKEN_ADDRESS=0xeb517F61CA9cbffa93ddB4a1452257AeF41058B3
VITE_PAYROLL_VAULT_ADDRESS=0x2C4C63213Ac5b0fd23B6f468709137C9d80C82B7
VITE_SWAP_ROUTER_ADDRESS=0x95FB006A9f3493b69054BcdcA5Cf96C5C43e91Da
```

Optional local demo/state variables:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_API_KEY=change-me-for-local-demo-only
VITE_CHAIN_DB_ID=1
VITE_ZAMA_WORKER_URL=http://127.0.0.1:8787
VITE_VIEM_WORKER_URL=http://127.0.0.1:8787
```

The current frontend includes calls to local demo/state endpoints so the employer and employee journeys can preserve workflow state during a walkthrough. Those variables are not part of the public smart contract submission boundary.

## Run Locally

```bash
npm run dev
```

Open the Vite URL printed in the terminal.

## Build For Production

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Live Demo Placeholder

Live demo: `https://zalary-frontend-fhe.vercel.app/`

## Demo Video Placeholder

Demo video: `TODO: https://youtu.be/G8uEvxtlrso`



## What Judges Should Review

- Employer payroll creation and payroll run lifecycle screens.
- Employee claim and withdrawal screens.
- Wallet connection and role-specific navigation.
- Sepolia contract configuration in `.env.example` and `src/lib/env.ts`.
- Documentation in `docs/`.
- Smart contract implementation in the separate contract repository once its URL is added.

## License

MIT. See [LICENSE](LICENSE).
