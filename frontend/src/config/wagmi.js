import { http, createConfig } from 'wagmi'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'

export const projectId = '2f05a7caa5b2d2169eb4dd2a9e2b35b0'

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
  connectors: [
    walletConnect({ projectId, showQrModal: false }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: 'HyperPacks',
      appLogoUrl: 'https://hyperpacks-trading-platform.vercel.app/logo.png',
    }),
  ],
})
