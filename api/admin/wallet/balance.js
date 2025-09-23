// Protected wallet balance checker for admin use
import { extractTokenFromCookie, verifyAdminToken } from '../auth-utils.js';

// HyperEVM RPC configuration
const HYPEREV_RPC_URL = 'https://rpc.hyperevmchain.org';

/**
 * Validate Ethereum address format
 */
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get wallet balance from HyperEVM blockchain
 */
async function getWalletBalance(address) {
  try {
    const response = await fetch(HYPEREV_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1
      }),
      timeout: 5000 // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`RPC request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }
    
    // Convert from wei to HYPE (18 decimals)
    const balanceWei = BigInt(data.result);
    const balanceHYPE = Number(balanceWei) / Math.pow(10, 18);
    
    return {
      address,
      balanceWei: data.result,
      balanceHYPE: balanceHYPE,
      balanceFormatted: balanceHYPE.toFixed(6) + ' HYPE',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Failed to fetch wallet balance:', error);
    throw error;
  }
}

/**
 * Get transaction count (nonce) for address activity indicator
 */
async function getTransactionCount(address) {
  try {
    const response = await fetch(HYPEREV_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
        id: 2
      }),
      timeout: 5000
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }
    
    return parseInt(data.result, 16);
    
  } catch (error) {
    console.error('Failed to fetch transaction count:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  // CORS for admin routes
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://hypack.xyz',
    'https://hyperpacks-trading-platform.vercel.app',
    'http://localhost:5000'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authentication check
    const token = extractTokenFromCookie(req.headers.cookie);
    const payload = verifyAdminToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get address from query parameter
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address parameter is required'
      });
    }

    if (!isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    // Get balance and transaction count in parallel
    const [balanceInfo, txCount] = await Promise.all([
      getWalletBalance(address),
      getTransactionCount(address)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...balanceInfo,
        transactionCount: txCount,
        activityLevel: txCount === 0 ? 'No activity' : 
                      txCount < 10 ? 'Low activity' :
                      txCount < 100 ? 'Medium activity' : 'High activity'
      }
    });

  } catch (error) {
    console.error('Wallet balance check error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet information',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}