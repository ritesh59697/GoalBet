const hre = require("hardhat");

async function main() {
  const provider = new hre.ethers.JsonRpcProvider("https://xlayerrpc.okx.com");
  const block = await provider.getBlockNumber();
  console.log("Current block on X Layer via xlayerrpc.okx.com:", block);

  const contractAddress = "0x12114397DCD0A58E10ff4eeb1d55c58558849dC7";
  const market = await hre.ethers.getContractAt("PredictionMarket", contractAddress);
  
  const filter = market.filters.BetPlaced();
  console.log("Testing querying 1000 blocks on xlayerrpc.okx.com...");
  try {
    const customMarket = market.connect(provider);
    const events = await customMarket.queryFilter(filter, block - 1000, block);
    console.log("1000 blocks query succeeded, found:", events.length);
  } catch (err) {
    console.error("1000 blocks query failed:", err.message);
  }
}

main().catch(console.error);
