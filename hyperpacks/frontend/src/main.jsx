import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { config, hyperEVM } from './config/wagmi'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient()

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    if (error?.message?.includes('not an Object') || error?.message?.includes('"name"')) {
      console.warn('Suppressing Privy SDK error:', error.message);
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (!error?.message?.includes('not an Object') && !error?.message?.includes('"name"')) {
      console.error('Error:', error, errorInfo);
    }
  }

  render() {
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID || 'cmf0n2ra100qzl20b4gxr8ql0'}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#00ccdd',
          },
          loginMethods: ['wallet'],
          embeddedWallets: {
            createOnLogin: 'off',
          },
          externalWallets: {
            coinbaseWallet: {
              connectionOptions: 'all',
            },
          },
          defaultChain: hyperEVM,
          supportedChains: [hyperEVM],
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <BrowserRouter>
              <App />
              <Analytics />
            </BrowserRouter>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
