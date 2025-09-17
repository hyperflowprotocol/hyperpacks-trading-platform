// Contract addresses and configuration for HyperDomains system
// TODO: Update these addresses after deploying contracts to HyperEVM

export const CONTRACT_ADDRESSES = {
  // Main contracts - UPDATE THESE AFTER DEPLOYMENT
  HYPER_DOMAINS: "0x0000000000000000000000000000000000000001", // Placeholder - UPDATE AFTER DEPLOYMENT
  HYPER_MARKETPLACE: "0x0000000000000000000000000000000000000002", // Placeholder - UPDATE AFTER DEPLOYMENT  
  HYPER_STAKING: "0x0000000000000000000000000000000000000003", // Placeholder - UPDATE AFTER DEPLOYMENT
  
  // Token addresses on HyperEVM (these are correct)
  HYPE_TOKEN: "0x4Ed6Add0D693842c7A8c3C07732B91e42B6Bb4E5",
  LHYPE_TOKEN: "0x5748ae796AE46A4F1348a1693de4b50560485562"
};

// HyperEVM network configuration
export const HYPEREVM_CONFIG = {
  chainId: '0x3e7', // 999 in hex
  chainName: 'HyperEVM',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.hyperliquid.xyz/evm'],
  blockExplorerUrls: ['https://explorer.hyperliquid.xyz'],
};

// Pack types and configurations
export const PACK_TYPES = {
  COMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4
};

export const PACK_INFO = {
  [PACK_TYPES.COMMON]: {
    name: "Common Pack",
    price: "10", // HYPE
    maxSupply: 10000,
    description: "Standard domain pack with common rarities"
  },
  [PACK_TYPES.RARE]: {
    name: "Rare Pack", 
    price: "25", // HYPE
    maxSupply: 5000,
    description: "Enhanced pack with rare domain chances"
  },
  [PACK_TYPES.EPIC]: {
    name: "Epic Pack",
    price: "50", // HYPE
    maxSupply: 2000,
    description: "Premium pack with epic domain opportunities"
  },
  [PACK_TYPES.LEGENDARY]: {
    name: "Legendary Pack",
    price: "100", // HYPE
    maxSupply: 500,
    description: "Ultimate pack with legendary domain potential"
  }
};

// Domain rarities
export const RARITY = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3
};

export const RARITY_INFO = {
  [RARITY.COMMON]: {
    name: "Common",
    color: "#94a3b8",
    icon: "⚪"
  },
  [RARITY.RARE]: {
    name: "Rare",
    color: "#3b82f6", 
    icon: "🔵"
  },
  [RARITY.EPIC]: {
    name: "Epic",
    color: "#a855f7",
    icon: "🟣"
  },
  [RARITY.LEGENDARY]: {
    name: "Legendary",
    color: "#f59e0b",
    icon: "🟡"
  }
};