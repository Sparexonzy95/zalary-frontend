import React from "react";
import { createWalletClient, custom } from "viem";
import { baseSepolia } from "viem/chains";

interface WalletCtx {
  wallet: string;
  connect: () => Promise<void>;
}

const Ctx = React.createContext<WalletCtx>({ wallet: "", connect: async () => {} });

export function useWallet() {
  return React.useContext(Ctx);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = React.useState<string>("");

  React.useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    // Silently rehydrate — no popup
    eth.request({ method: "eth_accounts" })
      .then((a: string[]) => { if (a?.[0]) setWallet(a[0]); })
      .catch(() => {});
    const handler = (a: string[]) => setWallet(a[0] ?? "");
    eth.on("accountsChanged", handler);
    return () => eth.removeListener("accountsChanged", handler);
  }, []);

  async function connect() {
    const eth = (window as any).ethereum;
    if (!eth) throw new Error("No wallet found. Install MetaMask.");
    const wc = createWalletClient({ chain: baseSepolia, transport: custom(eth) });
    const [account] = await wc.requestAddresses();
    if (!account) throw new Error("Wallet connection failed.");
    if (await wc.getChainId() !== baseSepolia.id)
      throw new Error("Please switch to Base Sepolia.");
    setWallet(account);
  }

  return (
    <Ctx.Provider value={{ wallet, connect }}>
      {children}
    </Ctx.Provider>
  );
}