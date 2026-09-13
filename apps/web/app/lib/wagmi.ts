import { createConfig, http } from "wagmi";
import { connectorsForWallets, type WalletList } from "@rainbow-me/rainbowkit";
import { injectedWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { defineChain } from "viem";

export const SHANNON_CHAIN_ID = 50312;
export const somniaShannon = defineChain({
  id: SHANNON_CHAIN_ID,
  name: "Somnia Shannon",
  nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: ["https://dream-rpc.somnia.network"] } },
  testnet: true,
});

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
const walletList: WalletList = [{
  groupName: "Recommended",
  wallets: projectId ? [injectedWallet, walletConnectWallet] : [injectedWallet],
}];
const connectors = connectorsForWallets(walletList, {
  appName: "PRIOR",
  appDescription: "Bounded forecasting continuity across DreamDEX Event Contracts",
  appUrl: "https://prior-aqf.pages.dev",
  projectId: projectId ?? "injected-only",
});

export const wagmiConfig = createConfig({
  chains: [somniaShannon],
  connectors,
  transports: { [SHANNON_CHAIN_ID]: http("https://dream-rpc.somnia.network") },
  ssr: true,
});

export const walletConnectConfigured = Boolean(projectId);
