import { WalletCards } from "lucide-react";
import { Button } from "./Button";
import { useWallet } from "../lib/wallet";
import { shortAddress } from "../lib/format";

export function WalletConnectButton() {
  const { wallet, connecting, connect } = useWallet();
  return <Button type="button" variant="secondary" onClick={() => void connect()}><WalletCards size={16} /> {wallet ? shortAddress(wallet) : connecting ? "Connecting..." : "Connect Wallet"}</Button>;
}


