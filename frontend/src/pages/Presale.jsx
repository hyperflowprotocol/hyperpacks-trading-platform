import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets, useSendTransaction } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import '../styles/Presale.css';

const Presale = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const [hypeAmount, setHypeAmount] = useState(''); // Amount of HYPE tokens user wants to spend
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeBalance, setRealTimeBalance] = useState(0); // Real-time balance from contract
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [totalRaised, setTotalRaised] = useState(0); // Track total HYPE raised
  
  // Toast notification state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info'
  });

  const showToast = (message, type = 'info', duration = 5000) => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Presale configuration
  const TOKEN_PRICE = 0.0005; // $0.0005 per HYPACK token (matches docs)
  const CONTRACT_ADDRESS = '0x7b5C8C1D5e0032616cfB87e95E43641e2b08560a'; // Real contract address
  const TARGET_RAISE = 3000; // Target: 3,000 HYPE


  const handleInputChange = (e) => {
    const value = e.target.value;
    setHypeAmount(value);
  };


  // Load saved progress from localStorage and calculate progress
  useEffect(() => {
    // Function to update progress from localStorage
    const updateProgressFromStorage = () => {
      const BASELINE_RAISED = 500; // 500 HYPE baseline
      const saved = localStorage.getItem('hyperpack-total-raised');
      let total = saved ? parseFloat(saved) : BASELINE_RAISED;
      
      // Enforce baseline: if saved value is invalid or too low, reset to baseline
      if (!Number.isFinite(total) || total < BASELINE_RAISED) {
        total = BASELINE_RAISED;
        localStorage.setItem('hyperpack-total-raised', total.toString());
      }
      
      setTotalRaised(total);
      
      // Calculate progress percentage
      const progress = Math.min((total / TARGET_RAISE) * 100, 100);
      setProgressPercentage(progress);
      
      // Calculate total HYPACK tokens distributed using fixed rate: 1 HYPE = 108,000 HYPACK
      const HYPACK_PER_HYPE = 108000;
      const tokensDistributed = Math.floor(total * HYPACK_PER_HYPE);
      setRealTimeBalance(tokensDistributed);
    };

    // Load initial progress
    updateProgressFromStorage();

    // Add event listener for cross-tab sync
    const handleStorageChange = (e) => {
      if (e.key === 'hyperpack-total-raised' && e.newValue !== null) {
        updateProgressFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Run once on mount to load saved progress

  // Calculate HYPACK tokens from HYPE amount - FIXED RATE: 1 HYPE = 108,000 HYPACK
  const hypeAmountNum = parseFloat(hypeAmount) || 0;
  const HYPACK_PER_HYPE = 108000; // Fixed rate: 1 HYPE = 108,000 HYPACK tokens
  const tokenQuantity = Math.floor(hypeAmountNum * HYPACK_PER_HYPE); // HYPACK tokens they'll get
  const totalCostInHype = hypeAmountNum; // Total cost in HYPE tokens (same as input)
  const hypaTokensNeeded = hypeAmountNum > 0 ? hypeAmountNum.toFixed(6) : '0'; // HYPE amount user will spend

  // Helper function to switch to HyperEVM network
  const switchToHyperEVM = async (provider) => {
    try {
      // Try to switch to HyperEVM
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x3e7' }], // Chain ID 999 in hex
      });
      return true;
    } catch (switchError) {
      // If the chain doesn't exist in wallet, add it
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x3e7',
              chainName: 'Hyperliquid',
              nativeCurrency: {
                name: 'HYPE',
                symbol: 'HYPE',
                decimals: 18,
              },
              rpcUrls: [
                'https://1rpc.io/hyperliquid',
                'https://999.rpc.thirdweb.com',
                'https://rpc.hyperliquid.xyz/evm'
              ],
              blockExplorerUrls: ['https://hyperevmscan.io'],
            }],
          });
          return true;
        } catch (addError) {
          console.error('Error adding HyperEVM network:', addError);
          throw new Error('Failed to add HyperEVM network to wallet. Please add it manually.');
        }
      } else if (switchError.code === 4001) {
        throw new Error('Network switch cancelled by user. Please switch to HyperEVM network to continue.');
      } else {
        console.error('Error switching network:', switchError);
        throw new Error('Failed to switch to HyperEVM network. Please switch manually.');
      }
    }
  };

  // Helper function to check current chain
  const getCurrentChain = async (provider) => {
    try {
      const chainId = await provider.request({ method: 'eth_chainId' });
      return chainId;
    } catch (error) {
      console.error('Error getting current chain:', error);
      return null;
    }
  };

  // Purchase handler - External wallet integration for proper mobile flow
  const handlePurchase = async () => {
    console.log('User object:', user);
    console.log('Authenticated:', authenticated);
    console.log('Wallets:', wallets);
    
    if (!authenticated || wallets.length === 0) {
      showToast('Please connect your wallet first!', 'error');
      return;
    }

    if (hypeAmountNum <= 0) {
      showToast('Please enter a valid HYPE amount!', 'error');
      return;
    }

    setIsLoading(true);
    hideToast();

    try {
      const wallet = wallets[0];
      console.log('Wallet type:', wallet.walletClientType);
      
      showToast('Preparing transaction...', 'info', 0);
      
      let txHash;
      
      // Helper function to convert decimal string to Wei (18 decimals) without floating point
      const toWei = (amount) => {
        const amountStr = amount.toString();
        const [whole, decimal = ''] = amountStr.split('.');
        const paddedDecimal = decimal.padEnd(18, '0').substring(0, 18);
        return BigInt(whole + paddedDecimal);
      };
      
      // Check if it's an external wallet (MetaMask, OKX, etc.)
      if (wallet.walletClientType !== 'privy') {
        // External wallet - use direct provider for proper mobile app flow
        console.log('Using external wallet flow');
        showToast('Preparing wallet...', 'info', 0);
        
        const provider = await wallet.getEthereumProvider();
        
        // Check current chain and switch to HyperEVM if needed
        showToast('Checking network...', 'info', 0);
        const currentChain = await getCurrentChain(provider);
        console.log('Current chain:', currentChain);
        
        if (currentChain !== '0x3e7') {
          showToast('Switching to HyperEVM network...', 'warning', 0);
          try {
            await switchToHyperEVM(provider);
            showToast('Network switched successfully!', 'success', 2000);
          } catch (networkError) {
            throw networkError; // This will be caught by the outer try-catch
          }
        }
        
        showToast('Opening wallet app...', 'info', 0);
        
        // Convert HYPE to Wei using precise decimal conversion
        const hypeInWei = toWei(hypeAmountNum);
        
        // Request transaction through wallet's provider
        txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: wallet.address,
            to: CONTRACT_ADDRESS,
            value: '0x' + hypeInWei.toString(16),
          }]
        });
        
      } else {
        // Embedded wallet - use Privy's sendTransaction
        console.log('Using embedded wallet flow');
        showToast('Please confirm the transaction...', 'info', 0);
        
        // Convert HYPE to Wei using precise decimal conversion
        const hypeInWei = toWei(hypeAmountNum);
        
        const result = await sendTransaction(
          {
            to: CONTRACT_ADDRESS,
            value: hypeInWei.toString(),
            chainId: 999,
            data: '0x'
          },
          {
            address: wallet.address,
            uiOptions: {
              showWalletUIs: true,
              header: "Purchase HYPACK Tokens",
              description: `Send ${hypeAmountNum} HYPE to purchase ${tokenQuantity.toLocaleString()} HYPACK tokens`,
              buttonText: "Confirm Purchase"
            }
          }
        );
        
        txHash = result.hash;
      }
      
      showToast('Transaction submitted! Waiting for confirmation...', 'info', 0);
      console.log('Transaction Hash:', txHash);
      
      // Success message (but don't update progress until confirmed)
      showToast(`Transaction submitted successfully! Hash: ${txHash.slice(0, 10)}... Progress will update after confirmation.`, 'success', 8000);
      
      // TODO: In production, wait for transaction confirmation before updating progress
      // For demo purposes, update progress after a delay to simulate confirmation
      setTimeout(() => {
        // Update progress after simulated confirmation
        const newTotal = totalRaised + hypeAmountNum;
        setTotalRaised(newTotal);
        
        // Save to localStorage
        localStorage.setItem('hyperpack-total-raised', newTotal.toString());
        
        // Update progress percentage
        const newProgress = Math.min((newTotal / TARGET_RAISE) * 100, 100);
        setProgressPercentage(newProgress);
        
        // Update HYPACK tokens distributed using fixed rate
        const HYPACK_PER_HYPE = 108000;
        const tokensDistributed = Math.floor(newTotal * HYPACK_PER_HYPE);
        setRealTimeBalance(tokensDistributed);
        
        showToast('Transaction confirmed! Progress updated.', 'success');
      }, 3000); // 3 second delay to simulate confirmation wait
      
      // Reset form after success
      setTimeout(() => {
        setHypeAmount('');
      }, 10000);
      
    } catch (error) {
      console.error('Purchase error:', error);
      
      let errorMessage = 'Transaction failed. Please try again.';
      
      // Network switching errors
      if (error.message?.includes('Network switch cancelled') || error.message?.includes('network switch')) {
        errorMessage = error.message;
      } else if (error.message?.includes('Failed to add HyperEVM network') || error.message?.includes('add it manually')) {
        errorMessage = 'Please manually add HyperEVM network to your wallet. Chain ID: 999, RPC: https://1rpc.io/hyperliquid';
      } else if (error.message?.includes('Failed to switch to HyperEVM') || error.message?.includes('switch manually')) {
        errorMessage = 'Please manually switch to HyperEVM network in your wallet.';
      }
      // Transaction errors
      else if (error.code === 4001 || error.message?.includes('user rejected') || error.message?.includes('User denied')) {
        errorMessage = 'Transaction cancelled by user.';
      } else if (error.code === -32000 && error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient HYPE balance in your wallet.';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient HYPE balance in your wallet.';
      } else if (error.code === -32603 || error.message?.includes('internal error')) {
        errorMessage = 'Internal wallet error. Please try again or restart your wallet.';
      } else if (error.code === -32002) {
        errorMessage = 'Request already pending in wallet. Please check your wallet.';
      } else if (error.code === 4100) {
        errorMessage = 'Wallet not connected properly. Please reconnect your wallet.';
      } else if (error.code === 4902) {
        errorMessage = 'HyperEVM network not found in wallet. Adding network...';
      }
      // Connection and network errors
      else if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('HTTP request failed') || error.message?.includes('fetch')) {
        errorMessage = 'Connection error. Please check your internet and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      // Wallet connection errors
      else if (error.message?.includes('No wallet') || error.message?.includes('wallet not found')) {
        errorMessage = 'Wallet not found. Please ensure your wallet is installed and unlocked.';
      } else if (error.message?.includes('MetaMask') && error.message?.includes('not installed')) {
        errorMessage = 'MetaMask not detected. Please install MetaMask browser extension.';
      }
      // Contract and gas errors
      else if (error.message?.includes('gas') || error.message?.includes('Gas')) {
        errorMessage = 'Transaction failed due to gas issues. Please try again with higher gas.';
      } else if (error.message?.includes('revert') || error.message?.includes('execution reverted')) {
        errorMessage = 'Transaction reverted. Please check contract conditions and try again.';
      }
      // Generic error with message
      else if (error.message && error.message.length < 200) {
        errorMessage = error.message;
      }
      // Unknown error
      else {
        errorMessage = 'Unknown error occurred. Please try again or contact support.';
      }
      
      showToast(errorMessage, 'error', 10000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="presale-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text brand-gradient-text">HyperPack</span>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/app" className="nav-link">App</Link>
            <button 
              className={`connect-wallet-btn ${authenticated ? 'connected' : ''}`}
              onClick={ready ? (authenticated ? logout : () => {
                console.log('Attempting login...');
                login();
              }) : () => {}}
              disabled={!ready}
            >
              {!ready 
                ? 'Loading...'
                : (authenticated && wallets[0]?.address
                  ? `${wallets[0].address.slice(0, 6)}...${wallets[0].address.slice(-4)}` 
                  : 'Connect Wallet'
                )
              }
            </button>
          </div>
        </div>
      </nav>

      {/* Main Presale Content */}
      <main className="presale-main">
        <div className="presale-container">
          
          {/* Header Section */}
          <section className="presale-header">
            <h1 className="presale-title">
              <span className="brand-gradient-text">HYPACK Token Presale</span>
            </h1>
            <p className="presale-subtitle">
              Get exclusive HYPACK tokens now! 🚀
            </p>
            <p className="presale-description">
              Join the presale and become part of the HyperPack ecosystem.
            </p>
          </section>

          {/* Banner Section */}
          <section className="banner-section">
            <img 
              src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeihojrsm66vtxjqia6skjl6jb6rnw2avrvejaehpv52leyafk5awc4" 
              alt="HyperPack Banner" 
              className="banner-image"
            />
          </section>

          {/* Purchase Section */}
          <section className="purchase-section">
            <div className="purchase-card">
              <h3 className="purchase-title brand-gradient-text">Buy HYPACK Tokens</h3>
              
              <div className="quantity-selector">
                <label className="quantity-label">How much HYPE do you want to spend?</label>
                <div className="quantity-controls">
                  <input 
                    type="number" 
                    className="quantity-input"
                    value={hypeAmount}
                    onChange={handleInputChange}
                    min="0.000001"
                    step="0.000001"
                    placeholder="Enter HYPE amount"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="purchase-summary">
                {/* Progress Bar */}
                <div className="progress-section-inline">
                  <div className="progress-bar-container">
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${Math.max(progressPercentage, progressPercentage > 0 ? 0.5 : 0)}%` }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {progressPercentage < 0.1 && progressPercentage > 0 
                        ? `${progressPercentage.toFixed(4)}% Complete`
                        : `${progressPercentage.toFixed(1)}% Complete`
                      }
                    </div>
                  </div>
                </div>
                
                <div className="summary-row">
                  <span>Raised:</span>
                  <span>{totalRaised.toFixed(2)} / {TARGET_RAISE.toLocaleString()} HYPE</span>
                </div>
                <div className="summary-row">
                  <span>You Get:</span>
                  <span>{tokenQuantity.toLocaleString()} HYPACK</span>
                </div>
                <div className="summary-row">
                  <span>Total Cost:</span>
                  <span>{totalCostInHype.toFixed(6)} HYPE</span>
                </div>
                <div className="summary-row payment-method">
                  <span className="payment-label">Payment:</span>
                  <span className="payment-value">{hypaTokensNeeded} HYPE tokens</span>
                </div>
              </div>

              {/* Transaction progress info */}
              <div className="transaction-info">
                <p className="text-secondary">Transaction progress will be updated in real-time</p>
              </div>

              {authenticated ? (
                <button 
                  className={`purchase-btn ${isLoading ? 'loading' : ''}`}
                  onClick={handlePurchase}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>
                      <span className="loading-spinner"></span>
                      Processing...
                    </span>
                  ) : (
                    'Buy Now!'
                  )}
                </button>
              ) : (
                <button 
                  className="connect-btn"
                  onClick={login}
                >
                  Connect Wallet
                </button>
              )}

              <p className="purchase-note">
                Tokens will be received immediately after presale completion.
              </p>
            </div>
          </section>



        </div>
      </main>

      <Footer />

      {/* Toast Notifications */}
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={toast.type === 'error' ? 10000 : 5000}
      />
    </div>
  );
};

export default Presale;