import { http, createConfig } from 'wagmi'
import { walletConnect, injected, coinbaseWallet } from 'wagmi/connectors'

export const projectId = '423de6f5958ca507cfba9cff1a0df418'

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
    walletConnect({ 
      projectId,
      metadata: {
        name: 'HyperPacks',
        description: 'HyperPacks Whitelist Platform',
        url: 'https://hyperpacks-trading-platform.vercel.app',
        icons: ['https://hyperpacks-trading-platform.vercel.app/logo.png']
      },
      showQrModal: true
    }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: 'HyperPacks',
      appLogoUrl: 'https://hyperpacks-trading-platform.vercel.app/logo.png',
    }),
  ],
})
