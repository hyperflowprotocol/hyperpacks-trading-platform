// HyperPacks Presale Configuration
export const PRESALE_CONFIG = {
  // Contract addresses and blockchain
  PRESALE_WALLET_ADDRESS: '0x7b5C8C1D5e0032616cfB87e95E43641e2b08560a', // Real presale wallet
  CHAIN_ID: 999, // HyperEVM
  CHAIN_ID_HEX: '0x3e7',
  RPC_URL: 'https://rpc.hyperevmchain.org',
  
  // Presale economics
  TARGET_RAISE: 1000, // Total HYPE target
  HYPACK_PER_HYPE: 108000, // 1 HYPE = 108,000 HYPACK
  TOKEN_PRICE_USD: 0.0005, // $0.0005 per HYPACK
  
  // Purchase limits
  MIN_PURCHASE_HYPE: 0.01, // Minimum 0.01 HYPE
  MAX_PURCHASE_HYPE: 100, // Maximum 100 HYPE per transaction
  
  // Baseline for display (minimum to show progress)
  BASELINE_AMOUNT: 629, // Starting display amount in HYPE
  
  // Network configuration
  NETWORK_CONFIG: {
    chainId: '0x3e7',
    chainName: 'HyperEVM',
    nativeCurrency: {
      name: 'HYPE',
      symbol: 'HYPE',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.hyperevmchain.org'],
    blockExplorerUrls: ['https://explorer.hyperevmchain.org'],
  }
};

export default PRESALE_CONFIG;