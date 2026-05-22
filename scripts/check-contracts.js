const { ethers } = require("hardhat");

async function main() {
  const usdtAddr = process.env.NEXT_PUBLIC_USDT_ADDRESS || "0x1E4a5963aBFD975d8c9021ce480b42188849D41d";
  const marketAddr = process.env.NEXT_PUBLIC_MARKET_ADDRESS || "0xe416Dc382258bFaaAfD278bAE929e53d00b4c122";
  
  const code = await ethers.provider.getCode(usdtAddr);
  console.log("USDT Code Length:", code.length);
  if (code === "0x") {
    console.log("WARNING: No contract code at USDT address!");
  }

  const marketCode = await ethers.provider.getCode(marketAddr);
  console.log("Market Code Length:", marketCode.length);
  if (marketCode === "0x") {
    console.log("WARNING: No contract code at Market address!");
  } else {
    const market = await ethers.getContractAt("PredictionMarket", marketAddr);
    const count = await market.getMatchCount();
    console.log("Match count:", count.toString());
  }
}

main().catch(console.error);
