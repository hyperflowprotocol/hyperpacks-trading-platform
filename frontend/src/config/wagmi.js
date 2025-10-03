import { http } from 'wagmi'
import { defineChain } from 'viem'
import { createConfig } from '@privy-io/wagmi'

export const hyperEVM = defineChain({
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
  },
  blockExplorers: {
    default: {
      name: 'HyperEVM Scanner',
      url: 'https://hyperevmscan.io',
    },
  },
})

export const config = createConfig({
  chains: [hyperEVM],
  transports: {
    [hyperEVM.id]: http('https://rpc.hyperliquid.xyz/evm'),
  },
})
