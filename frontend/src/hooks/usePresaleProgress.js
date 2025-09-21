import { useState, useEffect, useCallback } from 'react';

const usePresaleProgress = () => {
  const [totalRaised, setTotalRaised] = useState(520.45);
  const [progressPercentage, setProgressPercentage] = useState(17.35);
  const [realTimeBalance, setRealTimeBalance] = useState(54000000);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const TARGET_RAISE = 3000;
  const HYPACK_PER_HYPE = 108000;

  // Get API base URL
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      // Frontend - use current domain
      return window.location.origin;
    }
    return ''; // Server-side
  };

  // Fetch progress from database API
  const fetchProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${getApiUrl()}/api/presale`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const { total_raised, progress_percentage, real_time_balance } = result.data;
        
        setTotalRaised(total_raised);
        setProgressPercentage(progress_percentage);
        setRealTimeBalance(real_time_balance);
        setLastUpdated(new Date());
        
        // Also update localStorage as cache
        localStorage.setItem('hyperpack-total-raised', total_raised.toString());
        localStorage.setItem('hyperpack-last-updated', new Date().toISOString());
        
        console.log(`Database sync: ${total_raised}/${TARGET_RAISE} = ${progress_percentage.toFixed(2)}%`);
        
        return total_raised;
      } else {
        throw new Error('Invalid API response');
      }
      
    } catch (error) {
      console.error('Failed to fetch progress from database:', error);
      
      // Fallback to localStorage
      const cached = localStorage.getItem('hyperpack-total-raised');
      if (cached) {
        const cachedTotal = Math.max(parseFloat(cached), 520.45);
        const cachedProgress = Math.min((cachedTotal / TARGET_RAISE) * 100, 100);
        const cachedBalance = Math.floor(cachedTotal * HYPACK_PER_HYPE);
        
        setTotalRaised(cachedTotal);
        setProgressPercentage(cachedProgress);
        setRealTimeBalance(cachedBalance);
        
        console.log(`Using cached: ${cachedTotal}/${TARGET_RAISE} = ${cachedProgress.toFixed(2)}%`);
        return cachedTotal;
      }
      
      // Final fallback to baseline
      const baseline = 520.45;
      const baselineProgress = Math.min((baseline / TARGET_RAISE) * 100, 100);
      const baselineBalance = Math.floor(baseline * HYPACK_PER_HYPE);
      
      setTotalRaised(baseline);
      setProgressPercentage(baselineProgress);
      setRealTimeBalance(baselineBalance);
      
      return baseline;
    } finally {
      setIsLoading(false);
    }
  }, [TARGET_RAISE, HYPACK_PER_HYPE]);

  // Update progress by adding amount
  const updateProgress = useCallback(async (amount) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${getApiUrl()}/api/presale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const { total_raised, progress_percentage, real_time_balance } = result.data;
        
        setTotalRaised(total_raised);
        setProgressPercentage(progress_percentage);
        setRealTimeBalance(real_time_balance);
        setLastUpdated(new Date());
        
        // Update localStorage cache
        localStorage.setItem('hyperpack-total-raised', total_raised.toString());
        localStorage.setItem('hyperpack-last-updated', new Date().toISOString());
        
        console.log(`Updated progress: ${total_raised}/${TARGET_RAISE} = ${progress_percentage.toFixed(2)}%`);
        
        return result.data;
      } else {
        throw new Error('Failed to update progress');
      }
      
    } catch (error) {
      console.error('Failed to update progress:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [TARGET_RAISE, HYPACK_PER_HYPE]);

  // Initial fetch and polling
  useEffect(() => {
    let pollInterval;
    
    const startPolling = async () => {
      // Initial fetch
      await fetchProgress();
      
      // Poll every 30 seconds for cross-browser updates
      pollInterval = setInterval(fetchProgress, 30000);
    };
    
    startPolling();
    
    // Cleanup
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [fetchProgress]);

  return {
    totalRaised,
    progressPercentage,
    realTimeBalance,
    isLoading,
    lastUpdated,
    updateProgress,
    refresh: fetchProgress,
    TARGET_RAISE,
    HYPACK_PER_HYPE
  };
};

export default usePresaleProgress;