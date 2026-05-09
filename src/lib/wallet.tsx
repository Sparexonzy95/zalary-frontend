import React from "react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<any>;
      on?: (event: string, cb: (...args: any[]) => void) => void;
      removeListener?: (event: string, cb: (...args: any[]) => void) => void;
    };
  }
}

type WalletContextValue = {
  wallet: string;
  connecting: boolean;
  connect: () => Promise<string>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
};

const WALLET_KEY = "zalary:wallet";
const ONBOARDING_TOKEN_KEY = "zalary:onboarding_token";

const WalletContext = React.createContext<WalletContextValue | null>(null);

function normalizeAddress(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function getEthereum() {
  const ethereum = window.ethereum;

  if (!ethereum) {
    throw new Error("No wallet found. Install MetaMask or a compatible wallet.");
  }

  return ethereum;
}

async function getConnectedAccountSilent() {
  const ethereum = window.ethereum;

  if (!ethereum) return "";

  try {
    const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[];
    return normalizeAddress(accounts?.[0]);
  } catch {
    return "";
  }
}

async function requestAccount() {
  const ethereum = getEthereum();
  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
  const address = normalizeAddress(accounts?.[0]);

  if (!address) {
    throw new Error("Wallet connection cancelled.");
  }

  return address;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = React.useState("");
  const [connecting, setConnecting] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    async function hydrateWalletFromProvider() {
      const address = await getConnectedAccountSilent();

      if (!alive) return;

      setWallet(address);

      if (address) {
        localStorage.setItem(WALLET_KEY, address);
      } else {
        localStorage.removeItem(WALLET_KEY);
      }
    }

    void hydrateWalletFromProvider();

    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      const next = normalizeAddress(accounts?.[0]);

      setWallet(next);

      if (next) {
        localStorage.setItem(WALLET_KEY, next);
      } else {
        localStorage.removeItem(WALLET_KEY);
        localStorage.removeItem(ONBOARDING_TOKEN_KEY);
      }
    };

    const handleChainChanged = () => {
      // Reload keeps viem/Zama clients and wallet state from using stale chain data.
      window.location.reload();
    };

    window.ethereum?.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum?.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  async function connect() {
    setConnecting(true);

    try {
      const address = await requestAccount();

      setWallet(address);
      localStorage.setItem(WALLET_KEY, address);

      return address;
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    setWallet("");
    localStorage.removeItem(WALLET_KEY);
    localStorage.removeItem(ONBOARDING_TOKEN_KEY);
  }

  async function signMessage(message: string) {
    const ethereum = getEthereum();

    // Always request/confirm the active account inside the user-click flow.
    // This prevents stale localStorage wallet state from making the sign button
    // look ready while MetaMask/Rabby is not actually connected to the site.
    const active = await requestAccount();

    setWallet(active);
    localStorage.setItem(WALLET_KEY, active);

    return await ethereum.request({
      method: "personal_sign",
      params: [message, active],
    });
  }

  return (
    <WalletContext.Provider
      value={{ wallet, connecting, connect, disconnect, signMessage }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = React.useContext(WalletContext);

  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }

  return ctx;
}
