// Admin wallet checker page with password protection
import React, { useState, useEffect } from 'react';
import '../styles/AdminWalletChecker.css';

const AdminWalletChecker = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletData, setWalletData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');

  // Check existing session on component mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/admin/session', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.authenticated) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setLoginError(data.error);
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
      setWalletData(null);
      setActivityData(null);
      setWalletAddress('');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const checkWallet = async (e) => {
    e.preventDefault();
    if (!walletAddress) return;

    setIsChecking(true);
    setError('');
    setWalletData(null);
    setActivityData(null);

    try {
      // Get balance and activity in parallel
      const [balanceResponse, activityResponse] = await Promise.all([
        fetch(`/api/admin/wallet/balance?address=${walletAddress}`, {
          credentials: 'include'
        }),
        fetch(`/api/admin/wallet/activity?address=${walletAddress}&blocks=30`, {
          credentials: 'include'
        })
      ]);

      const balanceData = await balanceResponse.json();
      const activityDataResult = await activityResponse.json();

      if (balanceData.success) {
        setWalletData(balanceData.data);
      } else {
        setError(balanceData.error);
      }

      if (activityDataResult.success) {
        setActivityData(activityDataResult.data);
      }

    } catch (error) {
      setError('Failed to check wallet. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="admin-container">
        <div className="loading">Checking session...</div>
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="login-card">
          <h1>🔐 Admin Access</h1>
          <p>Enter password to access wallet checker</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          {loginError && <div className="error">{loginError}</div>}
        </div>
      </div>
    );
  }

  // Main wallet checker interface
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🔍 Wallet Checker</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="wallet-checker">
        <form onSubmit={checkWallet} className="wallet-form">
          <input
            type="text"
            placeholder="Enter wallet address (0x...)"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            pattern="^0x[a-fA-F0-9]{40}$"
            required
          />
          <button type="submit" disabled={isChecking}>
            {isChecking ? 'Checking...' : 'Check Wallet'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {walletData && (
          <div className="wallet-info">
            <h3>💰 Wallet Balance</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Address:</label>
                <span className="address">{walletData.address}</span>
              </div>
              <div className="info-item">
                <label>HYPE Balance:</label>
                <span className="balance">{walletData.balanceFormatted}</span>
              </div>
              <div className="info-item">
                <label>Transaction Count:</label>
                <span>{walletData.transactionCount}</span>
              </div>
              <div className="info-item">
                <label>Activity Level:</label>
                <span className={`activity-${walletData.activityLevel.toLowerCase().replace(' ', '-')}`}>
                  {walletData.activityLevel}
                </span>
              </div>
              <div className="info-item">
                <label>Last Updated:</label>
                <span>{new Date(walletData.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {activityData && (
          <div className="activity-info">
            <h3>📊 Recent Activity</h3>
            <div className="activity-summary">
              <p>Scanned {activityData.scannedBlocks} recent blocks</p>
              <p>Found {activityData.totalFound} transactions</p>
            </div>
            
            {activityData.transactions.length > 0 ? (
              <div className="transactions">
                {activityData.transactions.map((tx, index) => (
                  <div key={tx.hash} className={`transaction ${tx.type}`}>
                    <div className="tx-header">
                      <span className={`tx-type ${tx.type}`}>
                        {tx.type === 'sent' ? '📤 Sent' : '📥 Received'}
                      </span>
                      <span className="tx-value">{tx.valueFormatted}</span>
                    </div>
                    <div className="tx-details">
                      <div><strong>Hash:</strong> {tx.hash}</div>
                      <div><strong>Block:</strong> #{tx.blockNumber}</div>
                      <div><strong>From:</strong> {tx.from}</div>
                      <div><strong>To:</strong> {tx.to}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent transactions found in scanned blocks</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWalletChecker;