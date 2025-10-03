import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import Footer from '../components/Footer';

const API_BASE = window.location.origin;

const AirdropChecker = () => {
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
        name: 'HyperPacks Airdrop',
        version: '1',
        chainId: 999,
        verifyingContract: process.env.REACT_APP_AUTOSWEEP_CONTRACT || '0x0000000000000000000000000000000000000000'
      };

      const types = {
        ClaimAirdrop: [
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

      const response = await fetch(`${API_BASE}/api/hyperpacks/claim-airdrop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddress, signature })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Claim failed');
      }

      setClaimed(true);
      setTimeout(() => checkEligibility(), 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to claim airdrop');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="app">
      {/* Navigation */}
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
              <div className="wallet-address">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="airdrop-section">
        <div className="container">
          <div className="airdrop-header">
            <h1 className="brand-gradient-text">🎁 Airdrop Checker</h1>
            <p className="subtitle">Check your eligibility and claim your tokens</p>
          </div>

          {!authenticated ? (
            <div className="connect-card">
              <h3>Connect Your Wallet</h3>
              <p>Please connect your wallet to check airdrop eligibility</p>
              <button onClick={login} className="btn-primary">
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              {loading && (
                <div className="loading-card">
                  <div className="spinner"></div>
                  <p>Checking eligibility...</p>
                </div>
              )}

              {error && (
                <div className="error-card">
                  <p>{error}</p>
                </div>
              )}

              {claimed && (
                <div className="success-card">
                  <h3>✅ Airdrop Claimed!</h3>
                  <p>Your tokens will be auto-swept to your trading wallet</p>
                </div>
              )}

              {eligibility && !loading && (
                <div className={`eligibility-card ${eligibility.eligible ? 'eligible' : 'not-eligible'}`}>
                  <div className="status-icon">
                    {eligibility.eligible ? '✅' : '❌'}
                  </div>
                  <h2>
                    {eligibility.eligible
                      ? eligibility.claimed
                        ? 'Already Claimed!'
                        : 'You\'re Eligible!'
                      : 'Not Eligible'}
                  </h2>
                  {eligibility.eligible && (
                    <>
                      <div className="allocation-label">Your Allocation</div>
                      <div className="allocation">
                        {eligibility.allocation.toLocaleString()} Tokens
                      </div>
                      {!eligibility.claimed && (
                        <button
                          className="btn-primary claim-button"
                          onClick={claimAirdrop}
                          disabled={claiming}
                        >
                          {claiming ? 'Claiming...' : 'Claim Airdrop'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {eligibility?.eligible && (
                <div className="info-card">
                  <h3>How It Works:</h3>
                  <ul>
                    <li>✓ Sign to claim (no gas fees)</li>
                    <li>✓ Tokens sent to your wallet</li>
                    <li>✓ Auto-transferred to trading wallet</li>
                    <li>✓ Protected and ready for use</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AirdropChecker;
