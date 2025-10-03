import { http } from 'wagmi'
import { createConfig } from '@privy-io/wagmi'

export const hyperEVM = {
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
    public: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Scanner',
      url: 'https://hyperevmscan.io',
    },
  },
  testnet: false,
}

export const config = createConfig({
  chains: [hyperEVM],
  transports: {
    [hyperEVM.id]: http('https://rpc.hyperliquid.xyz/evm'),
  },
})
