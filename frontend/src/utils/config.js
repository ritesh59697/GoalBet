// frontend/src/utils/config.js

// ─── X Layer Network Config ───────────────────────────────────────────────────

export const XLAYER_MAINNET = {
  chainId: 196,
  chainIdHex: "0xC4",
  name: "X Layer Mainnet",
  rpcUrl: "https://rpc.xlayer.tech",
  explorerUrl: "https://www.oklink.com/x-layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
};

export const XLAYER_TESTNET = {
  chainId: 195,
  chainIdHex: "0xC3",
  name: "X Layer Testnet",
  rpcUrl: "https://testrpc.xlayer.tech",
  explorerUrl: "https://www.oklink.com/x-layer-testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
};

export const IS_TESTNET = process.env.NEXT_PUBLIC_NETWORK === "testnet";
export const ACTIVE_NETWORK = IS_TESTNET ? XLAYER_TESTNET : XLAYER_MAINNET;

// ─── Contract Addresses (filled after deploy) ─────────────────────────────────
export const CONTRACTS = {
  PREDICTION_MARKET: process.env.NEXT_PUBLIC_MARKET_ADDRESS,
  BET_RECEIPT_NFT:   process.env.NEXT_PUBLIC_NFT_ADDRESS,
  USDT:              process.env.NEXT_PUBLIC_USDT_ADDRESS,
  // X Layer Mainnet USDT: 0x1E4a5963aBFD975d8c9021ce480b42188849D41d
};

// ─── App Constants ────────────────────────────────────────────────────────────
export const MIN_BET_USDT  = 0.1;
export const MAX_BET_USDT  = 1000;
export const USDT_DECIMALS = 6;
export const PLATFORM_FEE  = 0.02; // 2%

export const OUTCOME_LABELS = {
  1: "Home Win",
  2: "Draw",
  3: "Away Win",
};

export const OUTCOME_COLORS = {
  1: "#00d4ff",
  2: "#888888",
  3: "#ff6b35",
};

export const MARKET_STATUS = {
  0: "OPEN",
  1: "LOCKED",
  2: "RESOLVED",
  3: "CANCELLED",
};

// ─── World Cup Team Flags ─────────────────────────────────────────────────────
export const TEAM_FLAGS = {
  "Brazil": "🇧🇷", "Mexico": "🇲🇽", "Argentina": "🇦🇷", "Germany": "🇩🇪",
  "France": "🇫🇷", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Spain": "🇪🇸", "Portugal": "🇵🇹",
  "Netherlands": "🇳🇱", "Italy": "🇮🇹", "Belgium": "🇧🇪", "Croatia": "🇭🇷",
  "Uruguay": "🇺🇾", "USA": "🇺🇸", "Japan": "🇯🇵", "Morocco": "🇲🇦",
  "Senegal": "🇸🇳", "Australia": "🇦🇺", "South Korea": "🇰🇷", "Poland": "🇵🇱",
};
