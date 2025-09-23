// Protected wallet activity checker for admin use
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
 * Get recent blocks to scan for transactions
 */
async function getRecentBlocks(blockCount = 100) {
  try {
    // Get latest block number
    const latestResponse = await fetch(HYPEREV_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      }),
      timeout: 5000
    });
    
    const latestData = await latestResponse.json();
    if (latestData.error) {
      throw new Error(`RPC Error: ${latestData.error.message}`);
    }
    
    const latestBlock = parseInt(latestData.result, 16);
    const startBlock = Math.max(0, latestBlock - blockCount);
    
    return { latestBlock, startBlock };
    
  } catch (error) {
    console.error('Failed to get recent blocks:', error);
    throw error;
  }
}

/**
 * Get transactions for a specific block
 */
async function getBlockTransactions(blockNumber) {
  try {
    const response = await fetch(HYPEREV_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [`0x${blockNumber.toString(16)}`, true], // true to get full transaction objects
        id: 1
      }),
      timeout: 5000
    });
    
    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }
    
    return data.result?.transactions || [];
    
  } catch (error) {
    console.error(`Failed to get block ${blockNumber} transactions:`, error);
    return [];
  }
}

/**
 * Find transactions involving specific address
 */
async function findWalletActivity(address, blockCount = 50) {
  try {
    const { latestBlock, startBlock } = await getRecentBlocks(blockCount);
    const targetAddress = address.toLowerCase();
    const matchingTxs = [];
    
    // Scan recent blocks for transactions (limited to prevent timeouts)
    const blocksToScan = Math.min(blockCount, 20); // Limit to 20 blocks for performance
    const promises = [];
    
    for (let i = 0; i < blocksToScan; i++) {
      const blockNum = latestBlock - i;
      if (blockNum >= 0) {
        promises.push(getBlockTransactions(blockNum));
      }
    }
    
    const blockResults = await Promise.allSettled(promises);
    
    blockResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const transactions = result.value;
        
        transactions.forEach(tx => {
          if (tx && (
            tx.from?.toLowerCase() === targetAddress || 
            tx.to?.toLowerCase() === targetAddress
          )) {
            const valueWei = BigInt(tx.value || '0');
            const valueHYPE = Number(valueWei) / Math.pow(10, 18);
            
            matchingTxs.push({
              hash: tx.hash,
              blockNumber: parseInt(tx.blockNumber, 16),
              from: tx.from,
              to: tx.to,
              value: valueHYPE,
              valueFormatted: valueHYPE.toFixed(6) + ' HYPE',
              gasPrice: tx.gasPrice,
              gasUsed: tx.gas,
              type: tx.from?.toLowerCase() === targetAddress ? 'sent' : 'received',
              timestamp: null // Block timestamp not included in basic scan
            });
          }
        });
      }
    });
    
    // Sort by block number (most recent first)
    matchingTxs.sort((a, b) => b.blockNumber - a.blockNumber);
    
    return {
      address,
      scannedBlocks: blocksToScan,
      latestBlock,
      transactions: matchingTxs.slice(0, 20), // Limit to 20 most recent
      totalFound: matchingTxs.length
    };
    
  } catch (error) {
    console.error('Failed to find wallet activity:', error);
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
    const { address, blocks } = req.query;
    
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

    const blockCount = blocks ? Math.min(parseInt(blocks), 100) : 50;
    
    // Find wallet activity
    const activity = await findWalletActivity(address, blockCount);

    return res.status(200).json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('Wallet activity check error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet activity',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}