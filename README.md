# ⚽ GoalBet — Autonomous World Cup Prediction Market on X Layer

> **Autonomous AI Agent** · **Parimutuel Pool Pricing** · **100% On-Chain SVG NFT Receipts**
> Deployed on **X Layer Mainnet** for the **X Cup Hackathon 2026** (May 19–28).
>
> 🌐 **Live Mainnet DApp**: [GoalBet Web App](http://localhost:3000) *(locally hosted dev server)*  
> 🛠️ **Developer Profile**: Built by **[Ritesh59697](https://github.com/Ritesh59697)**

---

## 🏗️ Architecture Overview

The repository consists of standard Solidity smart contracts managed by Hardhat and a modern Next.js client featuring an embedded autonomous AI agent.

```
GoalBet/
├── contracts/
│   ├── PredictionMarket.sol   ← Core parimutuel betting contract & pool logic
│   ├── BetReceiptNFT.sol      ← On-chain SVG NFT receipt creator
│   └── MockUSDT.sol           ← ERC-20 Mock USDT for testing/local networks
├── scripts/
│   ├── deploy.js              ← Deploy contracts (mainnet/testnet/local)
│   ├── create-match.js        ← Dev helper: Create matches on-chain
│   └── test-rpc.js            ← Dev helper: Test RPC latency and event queries
├── frontend/                  ← Next.js App
│   ├── src/
│   │   ├── app/               ← Next.js routing, layout & pages
│   │   ├── agent/             ← GoalBetAgent.js (AI agent client)
│   │   ├── hooks/             ← Contract hooks (useBetting, useUSDT, useAgent, etc.)
│   │   └── utils/             ← Config, ABIs, and network settings
│   └── globals.css            ← CSS styling system (responsive, dual-theme)
├── hardhat.config.js          ← Hardhat compilation & X Layer configuration
└── package.json               ← Project dependencies and scripts
```

---

## 🚀 Live Mainnet Deployments

GoalBet is live and verified on **OKX X Layer Mainnet** with the following smart contract deployments:

| Contract | Address | Explorer Link |
|---|---|---|
| **PredictionMarket** | `0x12114397DCD0A58E10ff4eeb1d55c58558849dC7` | [Verify on OKLink](https://www.oklink.com/x-layer/address/0x12114397DCD0A58E10ff4eeb1d55c58558849dC7) |
| **BetReceiptNFT** | `0x6afb09487F7b3C5826976fFE1f3b851bD7aec75D` | [Verify on OKLink](https://www.oklink.com/x-layer/address/0x6afb09487F7b3C5826976fFE1f3b851bD7aec75D) |
| **Tether USD (USDT)** | `0x1E4a5963aBFD975d8c9021ce480b42188849D41d` | [Verify on OKLink](https://www.oklink.com/x-layer/token/0x1E4a5963aBFD975d8c9021ce480b42188849D41d) |

---

## ⚽ Features & Hackathon Submissions

### 1. Parimutuel Pool Odds Pricing
* Unlike standard fixed-odds betting platforms, GoalBet implements **parimutuel pooling** on-chain.
* All wagers are placed into a unified pool for each match. Odds adjust dynamically based on pool sizes.
* **On-Chain Formula**:
  $$\text{Outcome Odds} = \frac{\text{Total Pool} \times (1 - \text{Platform Fee})}{\text{Outcome Pool}}$$
* Platform Fee is configured to `2%` inside `PredictionMarket.sol`, with the remaining `98%` paid back directly to winning participants.

### 2. Autonomous AI Betting Agent (`GoalBetAgent`)
* Users can securely delegate betting power to the built-in AI agent.
* **Security Model**: The user specifies a budget (in USDT) and authorizes the agent address. The agent can only execute `agentPlaceBet()` using the authorized budget, and has no power to withdraw or steal user assets.
* **Kelly Criterion Betting Strategy**: Rather than random wagers, the agent calculates optimal bet sizing based on the edge:
  $$f^* = \frac{p \times b - q}{b} = p - \frac{q}{b}$$
  *Where:*
  - $p$ is the estimated probability of winning (based on team ratings and form).
  - $q$ is the probability of losing ($1 - p$).
  - $b$ is the decimal odds minus 1.
  - $f^*$ is the fraction of the budget to bet.
* **Risk Profiles**: Users select a risk profile which applies a fractional multiplier (fractional Kelly) to safeguard bankroll:
  - **Conservative**: Multiplier $0.2$ (min confidence $70\%$, max wager per match $5\%$)
  - **Moderate**: Multiplier $0.5$ (min confidence $55\%$, max wager per match $10\%$)
  - **Aggressive**: Multiplier $1.0$ (min confidence $40\%$, max wager per match $20\%$)

### 3. Fully On-Chain SVG NFT Receipts
* When placing a bet, users receive a **Bet Receipt NFT** minted directly in Solidity.
* The metadata, attributes, and SVG image are generated dynamically **100% on-chain**.
* Features visual team graphics, match ID, wager details, transaction hash, and the prediction. Zero IPFS dependencies.

### 4. Premium Mobile Responsive UI & Multi-Theme
* Default **Light Mode** styling with clean gradients, optimized to look extremely professional.
* **Dark Mode** toggle available for developers and night users.
* Fully optimized for mobile viewports using flexible media queries, a floating sticky bottom navigation bar, and collapsible content cards.

---

## 🛠️ Quick Start & Local Setup

### 1. Install Dependencies
```bash
# Install root Hardhat dependencies
npm install

# Install frontend Next.js dependencies
cd frontend && npm install
cd ..
```

### 2. Configure Environment Variables
Create a `frontend/.env.local` file for the Next.js app:
```env
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_MARKET_ADDRESS=0x12114397DCD0A58E10ff4eeb1d55c58558849dC7
NEXT_PUBLIC_NFT_ADDRESS=0x6afb09487F7b3C5826976fFE1f3b851bD7aec75D
NEXT_PUBLIC_USDT_ADDRESS=0x1E4a5963aBFD975d8c9021ce480b42188849D41d
NEXT_PUBLIC_RPC_URL=https://rpc.xlayer.tech
NEXT_PUBLIC_AGENT_ADDRESS=0x1be21172bEaD8F5FE43435f0eEd93b186cba06B6
```

Create a root `.env` file for Hardhat:
```env
PRIVATE_KEY=your_deployer_wallet_private_key
USDT_ADDRESS=0x1E4a5963aBFD975d8c9021ce480b42188849D41d
OKLINK_API_KEY=your_oklink_api_key_for_contract_verification
```

### 3. Run the DApp locally
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📝 Smart Contract Deployments (Dev / Testnet)

If you wish to compile or deploy the contracts on a local network or testnet:

```bash
# Compile Solidity contracts
npx hardhat compile

# Start local Hardhat network
npx hardhat node

# Deploy locally (deploys MockUSDT automatically)
npx hardhat run scripts/deploy.js --network localhost

# Deploy to X Layer Testnet
npx hardhat run scripts/deploy.js --network xlayerTestnet
```

---

## 🔗 Submission Details

- **X Layer Build X Hackathon: X Cup 2026**
- **Contract Code Verification**: Verified on X Layer Mainnet Explorer using OKLink API.
- **RPC Resiliency**: The frontend features a fallback RPC switcher that automatically rotates RPC endpoints on timeout or failure to keep the DApp running.

*GoalBet Team — Submission 2026*
