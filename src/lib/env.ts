export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  API_KEY: import.meta.env.VITE_API_KEY as string,

  // IMPORTANT: this is DB primary key for Chain model, not EVM chainId
  CHAIN_DB_ID: Number(import.meta.env.VITE_CHAIN_DB_ID ?? "1"),

  // Public token (used for router deposits)
  USDC_ADDRESS: (import.meta.env.VITE_USDC_ADDRESS as string) || "",

  // Confidential payroll token (used by PayrollVault)
  CUSDC_ADDRESS: (import.meta.env.VITE_CUSDC_ADDRESS as string) || "",
};

export function assertEnv() {
  if (!env.API_BASE_URL) throw new Error("Missing VITE_API_BASE_URL");
  if (!env.API_KEY) throw new Error("Missing VITE_API_KEY");

  if (!env.CHAIN_DB_ID || Number.isNaN(env.CHAIN_DB_ID)) {
    throw new Error("Missing/invalid VITE_CHAIN_DB_ID");
  }

  if (!env.USDC_ADDRESS) throw new Error("Missing VITE_USDC_ADDRESS");
  if (!(env.USDC_ADDRESS.startsWith("0x") && env.USDC_ADDRESS.length === 42)) {
    throw new Error("Invalid VITE_USDC_ADDRESS");
  }

  if (!env.CUSDC_ADDRESS) throw new Error("Missing VITE_CUSDC_ADDRESS");
  if (!(env.CUSDC_ADDRESS.startsWith("0x") && env.CUSDC_ADDRESS.length === 42)) {
    throw new Error("Invalid VITE_CUSDC_ADDRESS");
  }
}