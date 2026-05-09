export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  apiKey: import.meta.env.VITE_API_KEY || "",
  chainDbId: Number(import.meta.env.VITE_CHAIN_DB_ID || "1"),
  chainId: Number(import.meta.env.VITE_CHAIN_ID || "11155111"),
  chainName: import.meta.env.VITE_CHAIN_NAME || "Ethereum Sepolia",
  rpcUrl:
    import.meta.env.VITE_RPC_URL ||
    import.meta.env.VITE_CHAIN_RPC_URL ||
    "https://ethereum-sepolia-rpc.publicnode.com",
  confidentialTokenAddress: import.meta.env.VITE_CONFIDENTIAL_TOKEN_ADDRESS || "0xeb517F61CA9cbffa93ddB4a1452257AeF41058B3",
  payrollVaultAddress: import.meta.env.VITE_PAYROLL_VAULT_ADDRESS || "0x2C4C63213Ac5b0fd23B6f468709137C9d80C82B7",
  swapRouterAddress: import.meta.env.VITE_SWAP_ROUTER_ADDRESS || "0x95FB006A9f3493b69054BcdcA5Cf96C5C43e91Da",
};


