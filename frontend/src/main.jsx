import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PrivyProvider } from '@privy-io/react-auth'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivyProvider 
      appId="cmf0n2ra100qzl20b4gxr8ql0"
      config={{
        loginMethods: ['wallet', 'email', 'google'],
        appearance: {
          theme: 'dark',
          accentColor: '#00ccdd',
          showWalletLoginFirst: false,
          walletList: ['detected_wallets', 'wallet_connect', 'metamask', 'coinbase_wallet', 'rainbow']
        },
        walletConnect: {
          projectId: '2f05a7caa5b2d2169eb4dd2a9e2b35b0'
        },
        embeddedWallets: {
          createOnLogin: 'all-users',
          showWalletUIs: true
        },
        supportedChains: [
          {
            id: 999,
            name: 'Hyperliquid',
            network: 'hyperevm',
            nativeCurrency: {
              name: 'HYPE',
              symbol: 'HYPE',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: [
                  'https://1rpc.io/hyperliquid',
                  'https://999.rpc.thirdweb.com', 
                  'https://rpc.hyperliquid.xyz/evm'
                ],
              },
              public: {
                http: [
                  'https://1rpc.io/hyperliquid',
                  'https://999.rpc.thirdweb.com',
                  'https://rpc.hyperliquid.xyz/evm'
                ],
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
        ],
        defaultChain: {
          id: 999,
          name: 'Hyperliquid'
        }
      }}
    >
      <BrowserRouter>
        <App />
        <Analytics />
      </BrowserRouter>
    </PrivyProvider>
  </React.StrictMode>,
)