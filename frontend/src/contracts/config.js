// Contract addresses and configuration for HyperCards trading card system
// TODO: Update these addresses after deploying contracts to HyperEVM

export const CONTRACT_ADDRESSES = {
  // Main contracts - UPDATE THESE AFTER DEPLOYMENT
  HYPER_CARDS: "0x0000000000000000000000000000000000000001", // Placeholder - UPDATE AFTER DEPLOYMENT
  HYPER_CARD_MARKETPLACE: "0x0000000000000000000000000000000000000002", // Placeholder - UPDATE AFTER DEPLOYMENT  
  HYPER_STAKING: "0x0000000000000000000000000000000000000003", // Placeholder - UPDATE AFTER DEPLOYMENT
  
  // HYPE payment destination
  HYPE_DESTINATION: "0xa6D8DE9A545aedBE612f5643527C2C4ED3df8411",
  
  // Token addresses on HyperEVM (these are correct)
  HYPE_TOKEN: "0x4Ed6Add0D693842c7A8c3C07732B91e42B6Bb4E5"
};

// HyperEVM network configuration
export const HYPEREVM_CONFIG = {
  chainId: '0x3e7', // 999 in hex
  chainName: 'HyperEVM',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.hyperliquid.xyz/evm'],
  blockExplorerUrls: ['https://explorer.hyperliquid.xyz'],
};

// Pack types and configurations for Trading Cards
export const PACK_TYPES = {
  COMMON: 1,
  EPIC: 2
};

export const PACK_INFO = {
  [PACK_TYPES.COMMON]: {
    name: "Common Pack",
    price: "0.00001", // Fixed price in HYPE
    maxSupply: 10000,
    description: "Trading card pack - costs 0.00001 HYPE"
  },
  [PACK_TYPES.EPIC]: {
    name: "Epic Pack", 
    price: "0.00001", // Fixed price in HYPE
    maxSupply: 5000,
    description: "Epic trading card pack - costs 0.00001 HYPE"
  }
};