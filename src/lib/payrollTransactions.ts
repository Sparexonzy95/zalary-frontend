import {
  createPublicClient,
  encodeFunctionData,
  http,
  type Abi,
  type Address,
  type Hex,
} from "viem";
import { PAYROLL_VAULT_ABI, SWAP_ROUTER_ABI } from "./abi";
import { env } from "./env";

export type TxRegistrationPayload = {
  tx_hash: string;
  sender: string;
  nonce: number;
};

type EthereumProvider = NonNullable<Window["ethereum"]>;

type SendContractTransactionParams = {
  from: string;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
  to: string;
};

type SendPayrollVaultTransactionParams = Omit<
  SendContractTransactionParams,
  "abi" | "to"
> & {
  to?: string;
};

type SendSwapRouterTransactionParams = Omit<
  SendContractTransactionParams,
  "abi" | "to"
> & {
  to?: string;
};

export type SwapRouterTopUpResult = {
  usdcAddress: string;
  requiredAmount: bigint;
  usdcBalance: bigint;
  allowanceBefore: bigint;
  approveTx?: TxRegistrationPayload;
  depositTx: TxRegistrationPayload;
};

const payrollVaultAbi = PAYROLL_VAULT_ABI as Abi;
const swapRouterAbi = SWAP_ROUTER_ABI as Abi;

const DEFAULT_SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

function requireEthereum(): EthereumProvider {
  if (!window.ethereum) {
    throw new Error("No wallet found. Install MetaMask or a compatible wallet.");
  }

  return window.ethereum;
}

function toQuantityHex(value: number | bigint) {
  return `0x${BigInt(value).toString(16)}`;
}

function fromQuantityHex(value: unknown) {
  const raw = String(value ?? "0x0");
  return Number(BigInt(raw));
}

function normalizeAddress(value: string, label: string) {
  const address = value.trim();

  if (!address.startsWith("0x") || address.length !== 42) {
    throw new Error(`${label} is missing or invalid.`);
  }

  return address.toLowerCase();
}

function normalizeHex(value: unknown, label: string): Hex {
  const hex = String(value ?? "").trim();

  if (!hex.startsWith("0x")) {
    throw new Error(`${label} must be 0x-prefixed.`);
  }

  return hex as Hex;
}

function parseAtomic(value: string | number | bigint, label: string) {
  try {
    const parsed = BigInt(String(value));

    if (parsed <= 0n) {
      throw new Error(`${label} must be greater than zero.`);
    }

    return parsed;
  } catch {
    throw new Error(`${label} must be a valid positive integer.`);
  }
}

function resolveUsdcAddress() {
  const configured =
    import.meta.env.VITE_USDC_ADDRESS ||
    import.meta.env.VITE_PUBLIC_USDC_ADDRESS ||
    "";

  if (configured && String(configured).startsWith("0x")) {
    return normalizeAddress(String(configured), "USDC address");
  }

  return DEFAULT_SEPOLIA_USDC.toLowerCase();
}

async function ensureChain(provider: EthereumProvider) {
  const target = toQuantityHex(env.chainId);
  const current = String(
    await provider.request({ method: "eth_chainId" }),
  ).toLowerCase();

  if (current === target.toLowerCase()) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: target }],
    });
  } catch (error) {
    const code = Number((error as { code?: number })?.code);

    if (code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: target,
          chainName: env.chainName,
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: [env.rpcUrl],
        },
      ],
    });

    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: target }],
    });
  }
}

async function readTransactionNonce(
  provider: EthereumProvider,
  txHash: string,
  fallbackNonce: number,
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const tx = (await provider.request({
      method: "eth_getTransactionByHash",
      params: [txHash],
    })) as { nonce?: string } | null;

    if (tx?.nonce) return fromQuantityHex(tx.nonce);

    await new Promise((resolve) => window.setTimeout(resolve, 500));
  }

  return fallbackNonce;
}

async function waitForWalletReceipt(txHash: string) {
  const provider = requireEthereum();

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const receipt = (await provider.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    })) as { status?: string } | null;

    if (receipt) {
      if (String(receipt.status).toLowerCase() !== "0x1") {
        throw new Error(`Transaction reverted: ${txHash}`);
      }

      return receipt;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 3000));
  }

  throw new Error(`Timed out waiting for transaction confirmation: ${txHash}`);
}

async function readContractValue({
  from,
  to,
  abi,
  functionName,
  args,
}: {
  from: string;
  to: string;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
}) {
  const provider = requireEthereum();
  await ensureChain(provider);

  const data = encodeFunctionData({
    abi,
    functionName,
    args,
  });

  const result = await provider.request({
    method: "eth_call",
    params: [
      {
        from: normalizeAddress(from, "Wallet address"),
        to: normalizeAddress(to, "Contract address"),
        data,
      },
      "latest",
    ],
  });

  return String(result ?? "0x0");
}

function decodeUint256(value: string) {
  return BigInt(value || "0x0");
}

export async function sendEncodedTransaction({
  from,
  to,
  data,
}: {
  from: string;
  to: string;
  data: Hex;
}): Promise<TxRegistrationPayload> {
  const provider = requireEthereum();
  const sender = normalizeAddress(from, "Wallet address");
  const target = normalizeAddress(to, "Contract address");

  await ensureChain(provider);

  const pendingNonce = fromQuantityHex(
    await provider.request({
      method: "eth_getTransactionCount",
      params: [sender, "pending"],
    }),
  );

  const txHash = String(
    await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: sender,
          to: target,
          data,
        },
      ],
    }),
  );

  if (!txHash.startsWith("0x") || txHash.length !== 66) {
    throw new Error("Wallet did not return a valid transaction hash.");
  }

  return {
    tx_hash: txHash,
    sender,
    nonce: await readTransactionNonce(provider, txHash, pendingNonce),
  };
}

export async function sendContractTransaction({
  from,
  abi,
  functionName,
  args,
  to,
}: SendContractTransactionParams): Promise<TxRegistrationPayload> {
  const data = encodeFunctionData({
    abi,
    functionName,
    args,
  });

  return sendEncodedTransaction({
    from,
    to,
    data: normalizeHex(data, "transaction data"),
  });
}

export async function sendPayrollVaultTransaction({
  from,
  functionName,
  args,
  to = env.payrollVaultAddress,
}: SendPayrollVaultTransactionParams): Promise<TxRegistrationPayload> {
  return sendContractTransaction({
    from,
    to,
    abi: payrollVaultAbi,
    functionName,
    args,
  });
}

export async function sendSwapRouterTransaction({
  from,
  functionName,
  args,
  to = env.swapRouterAddress,
}: SendSwapRouterTransactionParams): Promise<TxRegistrationPayload> {
  return sendContractTransaction({
    from,
    to,
    abi: swapRouterAbi,
    functionName,
    args,
  });
}

export async function readErc20Balance({
  from,
  tokenAddress,
  account,
}: {
  from: string;
  tokenAddress: string;
  account: string;
}) {
  const raw = await readContractValue({
    from,
    to: tokenAddress,
    abi: ERC20_ABI as Abi,
    functionName: "balanceOf",
    args: [normalizeAddress(account, "Account address")],
  });

  return decodeUint256(raw);
}

export async function readPublicUsdcBalance(account: string) {
  const wallet = normalizeAddress(account, "Employer wallet") as Address;
  const client = createPublicClient({
    transport: http(env.rpcUrl),
  });

  const balance = await client.readContract({
    address: resolveUsdcAddress() as Address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [wallet],
  });

  return BigInt(String(balance ?? 0n));
}

export async function readErc20Allowance({
  from,
  tokenAddress,
  owner,
  spender,
}: {
  from: string;
  tokenAddress: string;
  owner: string;
  spender: string;
}) {
  const raw = await readContractValue({
    from,
    to: tokenAddress,
    abi: ERC20_ABI as Abi,
    functionName: "allowance",
    args: [
      normalizeAddress(owner, "Owner address"),
      normalizeAddress(spender, "Spender address"),
    ],
  });

  return decodeUint256(raw);
}

export async function approveErc20({
  from,
  tokenAddress,
  spender,
  amount,
}: {
  from: string;
  tokenAddress: string;
  spender: string;
  amount: string | number | bigint;
}) {
  return sendContractTransaction({
    from,
    to: tokenAddress,
    abi: ERC20_ABI as Abi,
    functionName: "approve",
    args: [normalizeAddress(spender, "Spender address"), parseAtomic(amount, "Approval amount")],
  });
}

export async function depositIntoSwapRouter({
  from,
  amount,
}: {
  from: string;
  amount: string | number | bigint;
}) {
  return sendSwapRouterTransaction({
    from,
    functionName: "deposit",
    args: [parseAtomic(amount, "Deposit amount")],
  });
}

export async function ensureSwapRouterTopUp({
  from,
  amount,
  onStep,
}: {
  from: string;
  amount: string | number | bigint;
  onStep?: (message: string) => void;
}): Promise<SwapRouterTopUpResult> {
  const sender = normalizeAddress(from, "Employer wallet");
  const requiredAmount = parseAtomic(amount, "Top-up amount");
  const usdcAddress = resolveUsdcAddress();
  const router = normalizeAddress(env.swapRouterAddress, "SwapRouter address");

  onStep?.("Checking USDC balance...");

  const usdcBalance = await readErc20Balance({
    from: sender,
    tokenAddress: usdcAddress,
    account: sender,
  });

  if (usdcBalance < requiredAmount) {
    throw new Error(
      `Insufficient public USDC balance. Required ${requiredAmount.toString()} atomic units, available ${usdcBalance.toString()}.`,
    );
  }

  const allowanceBefore = await readErc20Allowance({
    from: sender,
    tokenAddress: usdcAddress,
    owner: sender,
    spender: router,
  });

  let approveTx: TxRegistrationPayload | undefined;

  if (allowanceBefore < requiredAmount) {
    onStep?.("Approving USDC...");

    approveTx = await approveErc20({
      from: sender,
      tokenAddress: usdcAddress,
      spender: router,
      amount: requiredAmount,
    });

    await waitForWalletReceipt(approveTx.tx_hash);
  }

  onStep?.("Depositing USDC...");

  const depositTx = await depositIntoSwapRouter({
    from: sender,
    amount: requiredAmount,
  });

  await waitForWalletReceipt(depositTx.tx_hash);

  return {
    usdcAddress,
    requiredAmount,
    usdcBalance,
    allowanceBefore,
    approveTx,
    depositTx,
  };
}
