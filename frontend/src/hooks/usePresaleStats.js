import { useState, useEffect } from 'react';

const usePresaleStats = () => {
  const [stats, setStats] = useState({
    raised: 0,
    goal: 0,
    percentage: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Simulate loading then set the actual numbers
    const timer = setTimeout(() => {
      const raised = 500; // 500 HYPE raised  
      const goal = 3000; // 3000 HYPE goal
      const percentage = Math.round((raised / goal) * 100 * 100) / 100; // 16.67%
      
      setStats({
        raised,
        goal,
        percentage,
        loading: false,
        error: null
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return stats;
};

export default usePresaleStats;