# Deployment

## Environment Variables

Use `.env.example` as the deployment template.

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

## Local Dev Command

```bash
npm run dev
```

## Production Build Command

```bash
npm run build
```

## Preview Command

```bash
npm run preview
```

## Vercel Deployment Notes

- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Add the required `VITE_*` variables in the Vercel project settings.

## Netlify Deployment Notes

- Build command: `npm run build`.
- Publish directory: `dist`.
- Add the required `VITE_*` variables in Netlify environment settings.

## Contract Address Configuration

The deployed Sepolia contract addresses are read from environment variables and defaulted in `src/lib/env.ts`. For judging, keep the addresses aligned with the public contract repository deployment artifacts.

## Live Demo Placeholder

Live demo URL: `TODO: add deployed frontend URL`
