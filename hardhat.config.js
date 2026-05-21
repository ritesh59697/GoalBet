require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    // X Layer Mainnet
    xlayer: {
      url: "https://rpc.xlayer.tech",
      chainId: 196,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // X Layer Testnet
    xlayerTestnet: {
      url: "https://testrpc.xlayer.tech",
      chainId: 1952,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      xlayer: process.env.OKLINK_API_KEY || "",
    },
    customChains: [
      {
        network: "xlayer",
        chainId: 196,
        urls: {
          apiURL: "https://www.oklink.com/api/v5/explorer/contract/verify-source-code-plugin/XLAYER",
          browserURL: "https://www.oklink.com/x-layer",
        },
      },
    ],
  },
};
