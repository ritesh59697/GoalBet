# ⚽ GoalBet — World Cup Prediction Market on X Layer

> Decentralized prediction markets · AI betting agent · Bet Receipt NFTs  
> Built for the **X Cup Hackathon 2026** (May 19–28)

---

## 🏗️ Architecture Overview

```
goalbet/
├── contracts/
│   ├── PredictionMarket.sol   ← Core betting logic, agent integration
│   └── BetReceiptNFT.sol      ← On-chain SVG NFT minted per bet
├── agent/
│   └── GoalBetAgent.ts        ← AI agent: analysis + autonomous execution
├── scripts/
│   └── deploy.js              ← Deploy to X Layer (mainnet/testnet)
├── frontend/                  ← Next.js app
│   └── src/
│       ├── pages/             ← App routes
│       ├── components/        ← UI components
│       ├── hooks/             ← Contract hooks
│       └── utils/             ← Helpers
└── hardhat.config.js          ← X Layer network config
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
cd frontend && npm install
```

### 2. Environment setup

```bash
cp .env.example .env
```

Fill in:
```
PRIVATE_KEY=your_deployer_private_key
USDT_ADDRESS=0xc946DAf81b08146B1C7A8Da2A851Ddf2B3EAaf85   # X Layer USDT
OKLINK_API_KEY=your_oklink_key_for_verification

# After deployment (auto-generated):
NEXT_PUBLIC_MARKET_ADDRESS=
NEXT_PUBLIC_NFT_ADDRESS=
NEXT_PUBLIC_USDT_ADDRESS=
```

### 3. Get testnet funds

Visit: https://web3.okx.com/xlayer/faucet

### 4. Deploy contracts

```bash
# Testnet first
npx hardhat run scripts/deploy.js --network xlayerTestnet

# Mainnet when ready
npx hardhat run scripts/deploy.js --network xlayer
```

### 5. Verify on OKLink

```bash
npx hardhat verify --network xlayer <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 6. Run frontend

```bash
cd frontend
npm run dev
```

---

## 📄 Smart Contracts

### PredictionMarket.sol

| Function | Description |
|---|---|
| `createMatch()` | Admin: add a World Cup match |
| `lockMarket()` | Admin: lock bets at kickoff |
| `resolveMarket()` | Admin: set final result |
| `placeBet()` | User: bet USDT on an outcome |
| `agentPlaceBet()` | AI Agent: bet on behalf of user |
| `authorizeMyAgent()` | User: authorize agent + deposit budget |
| `claimWinnings()` | User: claim USDT payout |
| `getOdds()` | View: live pool-based odds |
| `getPotentialPayout()` | View: simulate payout before betting |

### BetReceiptNFT.sol

- ERC-721 with **fully on-chain SVG metadata**
- Minted automatically on every bet
- Stores: match, teams, prediction, amount, timestamp
- No IPFS dependency — 100% on-chain

---

## 🤖 AI Agent

The `GoalBetAgent` class runs autonomously:

1. **Fetches** all open matches from the contract
2. **Analyzes** using FIFA team ratings + Expected Value formula
3. **Sizes** bets using Kelly Criterion (conservative fraction)
4. **Executes** `agentPlaceBet()` on-chain for authorized users

### Risk Profiles

| Profile | Min Confidence | Max Bet/Budget |
|---|---|---|
| Conservative | 70% | 5% |
| Moderate | 55% | 10% |
| Aggressive | 40% | 20% |

### Running the agent

```typescript
import { GoalBetAgent } from "./agent/GoalBetAgent";

const agent = new GoalBetAgent(
  "https://rpc.xlayer.tech",
  process.env.AGENT_PRIVATE_KEY,
  process.env.MARKET_ADDRESS,
  MARKET_ABI
);

// Run every hour via cron
await agent.runCycle(users);
```

---

## 🌐 X Layer Integration

| Feature | Detail |
|---|---|
| Network | X Layer Mainnet (Chain ID: 196) |
| RPC | https://rpc.xlayer.tech |
| Explorer | https://www.oklink.com/x-layer |
| Testnet | https://testrpc.xlayer.tech (Chain ID: 195) |
| USDT | 0xc946DAf81b08146B1C7A8Da2A851Ddf2B3EAaf85 |

---

## 🎯 Hackathon Tracks Covered

- ✅ **Prediction Markets** — core product
- ✅ **AI Agent** — autonomous betting agent
- ✅ **NFT** — on-chain bet receipt NFTs
- ✅ **X Layer** — fully deployed on-chain

---

## 🔗 Links

- X Layer Docs: https://web3.okx.com/xlayer
- OnchainOS: https://web3.okx.com/onchainos
- Explorer: https://www.oklink.com/x-layer
- Faucet: https://web3.okx.com/xlayer/faucet
- Hackathon: https://web3.okx.com/xlayer/build-x-hackathon/xcup

---

*X Cup Hackathon 2026 — Submission by GoalBet Team*
