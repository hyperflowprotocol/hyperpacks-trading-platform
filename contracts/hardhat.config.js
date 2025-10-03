require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hyperevm: {
      url: process.env.HYPEREVM_RPC_URL || "https://api.hyperliquid-testnet.xyz/evm",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 998
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
