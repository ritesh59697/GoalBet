const hre = require("hardhat");
const { ethers } = hre;

/**
 * Deploy GoalBet to X Layer
 * Run: npx hardhat run deploy.js --network xlayer
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatUnits(await ethers.provider.getBalance(deployer.address), 18), "OKB");

  // Determine USDT address: deploy mock if running locally or if not specified on testnet
  let USDT_ADDRESS = process.env.USDT_ADDRESS;
  if (!USDT_ADDRESS && (hre.network.name === "hardhat" || hre.network.name === "localhost" || hre.network.name === "xlayerTestnet")) {
    console.log("\nNo USDT_ADDRESS specified. Deploying MockUSDT...");
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();
    USDT_ADDRESS = await mockUSDT.getAddress();
    console.log("   MockUSDT deployed to:", USDT_ADDRESS);
  } else if (!USDT_ADDRESS) {
    USDT_ADDRESS = "0xc946DAf81b08146B1C7A8Da2A851Ddf2B3EAaf85"; // X Layer Mainnet USDT
  }

  // 1. Deploy BetReceiptNFT
  console.log("\n1. Deploying BetReceiptNFT...");
  const BetReceiptNFT = await ethers.getContractFactory("BetReceiptNFT");
  const betNFT = await BetReceiptNFT.deploy();
  await betNFT.waitForDeployment();
  const nftAddress = await betNFT.getAddress();
  console.log("   BetReceiptNFT:", nftAddress);

  // 2. Deploy PredictionMarket
  console.log("\n2. Deploying PredictionMarket...");
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const market = await PredictionMarket.deploy(USDT_ADDRESS, nftAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("   PredictionMarket:", marketAddress);

  // 3. Link NFT to market
  console.log("\n3. Linking NFT to PredictionMarket...");
  const tx = await betNFT.setPredictionMarket(marketAddress);
  await tx.wait();
  console.log("   Linked ✓");

  // 4. Seed initial World Cup matches (Group Stage)
  console.log("\n4. Creating initial matches...");
  const now = Math.floor(Date.now() / 1000);
  const day = 86400;

  const matches = [
    { home: "Brazil",    away: "Mexico",    id: "WC2026_001", kickoff: now + day * 1 },
    { home: "Argentina", away: "Germany",   id: "WC2026_002", kickoff: now + day * 2 },
    { home: "France",    away: "England",   id: "WC2026_003", kickoff: now + day * 3 },
    { home: "Spain",     away: "Portugal",  id: "WC2026_004", kickoff: now + day * 4 },
    { home: "Netherlands", away: "Italy",   id: "WC2026_005", kickoff: now + day * 5 },
  ];

  for (const m of matches) {
    const tx = await market.createMatch(m.home, m.away, m.id, m.kickoff);
    await tx.wait();
    console.log(`   Created: ${m.home} vs ${m.away}`);
  }

  // 5. Summary
  console.log("\n═══════════════════════════════════");
  console.log("✅ DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════");
  console.log("BetReceiptNFT:    ", nftAddress);
  console.log("PredictionMarket: ", marketAddress);
  console.log("USDT:             ", USDT_ADDRESS);
  console.log("\nUpdate your .env.local:");
  console.log(`NEXT_PUBLIC_MARKET_ADDRESS=${marketAddress}`);
  console.log(`NEXT_PUBLIC_NFT_ADDRESS=${nftAddress}`);
  console.log(`NEXT_PUBLIC_USDT_ADDRESS=${USDT_ADDRESS}`);

  // Save to file for CI/CD
  const fs = require("fs");
  fs.writeFileSync(
    "deployment.json",
    JSON.stringify({ marketAddress, nftAddress, usdtAddress: USDT_ADDRESS, network: hre.network.name }, null, 2)
  );
}

main().catch((err) => { console.error(err); process.exit(1); });
