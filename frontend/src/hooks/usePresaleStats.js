import { useState, useEffect, useCallback } from 'react';

const usePresaleStats = () => {
  const [totalRaised, setTotalRaised] = useState(500); // Default baseline
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [realTimeBalance, setRealTimeBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Presale configuration
  const CONTRACT_ADDRESS = '0x7b5C8C1D5e0032616cfB87e95E43641e2b08560a';
  const TARGET_RAISE = 3000;
  const BASELINE_RAISED = 500;
  const HYPACK_PER_HYPE = 108000;
  
  // HyperEVM RPC endpoints
  const RPC_ENDPOINTS = [
    'https://1rpc.io/hyperliquid',
    'https://999.rpc.thirdweb.com',
    'https://rpc.hyperliquid.xyz/evm'
  ];

  // Function to make RPC call with fallback
  const makeRPCCall = async (method, params = []) => {
    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
            id: Date.now(),
          }),
        });
        
        const data = await response.json();
        
        if (data.error) {
          console.warn(`RPC Error from ${rpcUrl}:`, data.error);
          continue;
        }
        
        return data.result;
      } catch (error) {
        console.warn(`RPC Failed for ${rpcUrl}:`, error.message);
        continue;
      }
    }
    
    throw new Error('All RPC endpoints failed');
  };

  // Convert Wei (hex) to HYPE (decimal)
  const weiToHype = (weiHex) => {
    if (!weiHex || weiHex === '0x0') return 0;
    
    // Convert hex to BigInt, then to string for precise decimal handling
    const weiBigInt = BigInt(weiHex);
    const divisor = BigInt('1000000000000000000'); // 18 decimals
    
    const hype = Number(weiBigInt) / Number(divisor);
    return hype;
  };

  // Fetch balance from blockchain
  const fetchOnChainBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get balance from blockchain
      const balanceWei = await makeRPCCall('eth_getBalance', [CONTRACT_ADDRESS, 'latest']);
      const balanceHype = weiToHype(balanceWei);
      
      console.log(`On-chain balance: ${balanceHype} HYPE`);
      
      // Apply baseline (minimum of 500 HYPE for display purposes)
      const effectiveTotal = Math.max(balanceHype, BASELINE_RAISED);
      
      // Update all derived values
      setTotalRaised(effectiveTotal);
      
      const progress = Math.min((effectiveTotal / TARGET_RAISE) * 100, 100);
      setProgressPercentage(progress);
      
      const tokensDistributed = Math.floor(effectiveTotal * HYPACK_PER_HYPE);
      setRealTimeBalance(tokensDistributed);
      
      setLastUpdated(new Date());
      
      // Cache in localStorage for offline fallback
      localStorage.setItem('hyperpack-total-raised', effectiveTotal.toString());
      localStorage.setItem('hyperpack-last-updated', new Date().toISOString());
      
      return effectiveTotal;
      
    } catch (error) {
      console.error('Failed to fetch on-chain balance:', error);
      
      // Fallback to localStorage if available
      const cached = localStorage.getItem('hyperpack-total-raised');
      if (cached) {
        const cachedTotal = Math.max(parseFloat(cached), BASELINE_RAISED);
        setTotalRaised(cachedTotal);
        setProgressPercentage(Math.min((cachedTotal / TARGET_RAISE) * 100, 100));
        setRealTimeBalance(Math.floor(cachedTotal * HYPACK_PER_HYPE));
        
        console.log('Using cached balance:', cachedTotal);
        return cachedTotal;
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [CONTRACT_ADDRESS, TARGET_RAISE, BASELINE_RAISED, HYPACK_PER_HYPE]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    try {
      await fetchOnChainBalance();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  }, [fetchOnChainBalance]);

  // Initial load and polling setup
  useEffect(() => {
    let pollInterval;
    
    const startPolling = async () => {
      // Initial fetch
      try {
        await fetchOnChainBalance();
      } catch (error) {
        console.error('Initial fetch failed:', error);
      }
      
      // Set up polling every 10 seconds
      pollInterval = setInterval(async () => {
        try {
          await fetchOnChainBalance();
        } catch (error) {
          console.error('Polling fetch failed:', error);
        }
      }, 10000); // 10 seconds
    };
    
    startPolling();
    
    // Cleanup
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [fetchOnChainBalance]);

  return {
    totalRaised,
    progressPercentage,
    realTimeBalance,
    isLoading,
    lastUpdated,
    refresh,
    TARGET_RAISE,
    HYPACK_PER_HYPE
  };
};

export default usePresaleStats;