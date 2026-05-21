const { ethers } = require("hardhat");

async function main() {
  const usdtAddr = "0xc946DAf81b08146B1C7A8Da2A851Ddf2B3EAaf85";
  const marketAddr = "0x628F7EB99e797FC81e93Bb322FEB82572E275D34";
  
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
