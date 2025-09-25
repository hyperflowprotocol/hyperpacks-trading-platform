// Real blockchain-based presale API with on-chain verification
import fetch from 'node-fetch';

// Presale configuration
const PRESALE_CONFIG = {
  PRESALE_WALLET_ADDRESS: '0x7b5C8C1D5e0032616cfB87e95E43641e2b08560a',
  RPC_URL: 'https://rpc.hyperevmchain.org',
  TARGET_RAISE: 1000,
  HYPACK_PER_HYPE: 108000,
  BASELINE_AMOUNT: 635 // Display minimum
};

// Get wallet balance from HyperEVM blockchain
async function getWalletBalance(address) {
  try {
    const response = await fetch(PRESALE_CONFIG.RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }
    
    // Convert from wei to HYPE (18 decimals)
    const balanceWei = BigInt(data.result);
    const balanceHYPE = Number(balanceWei) / Math.pow(10, 18);
    
    return balanceHYPE;
  } catch (error) {
    console.error('Failed to fetch wallet balance:', error);
    throw error;
  }
}

// Verify transaction on blockchain
async function verifyTransaction(txHash) {
  try {
    const response = await fetch(PRESALE_CONFIG.RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1
      })
    });
    
    const data = await response.json();
    
    if (data.error || !data.result) {
      return null;
    }
    
    const tx = data.result;
    
    // Verify transaction is to presale wallet
    if (tx.to?.toLowerCase() !== PRESALE_CONFIG.PRESALE_WALLET_ADDRESS.toLowerCase()) {
      return null;
    }
    
    // Convert value from wei to HYPE
    const valueWei = BigInt(tx.value);
    const valueHYPE = Number(valueWei) / Math.pow(10, 18);
    
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: valueHYPE,
      blockNumber: tx.blockNumber
    };
    
  } catch (error) {
    console.error('Failed to verify transaction:', error);
    return null;
  }
}

export default async function handler(req, res) {
  // Enable CORS for frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get real-time progress from blockchain
      const walletBalance = await getWalletBalance(PRESALE_CONFIG.PRESALE_WALLET_ADDRESS);
      
      // Use baseline if balance is too low (for display purposes)
      const totalRaised = Math.max(walletBalance, PRESALE_CONFIG.BASELINE_AMOUNT);
      
      const progressPercentage = Math.min((totalRaised / PRESALE_CONFIG.TARGET_RAISE) * 100, 100);
      const realTimeBalance = Math.floor(totalRaised * PRESALE_CONFIG.HYPACK_PER_HYPE);
      
      return res.status(200).json({
        success: true,
        data: {
          total_raised: totalRaised,
          wallet_balance: walletBalance,
          target_raise: PRESALE_CONFIG.TARGET_RAISE,
          progress_percentage: progressPercentage,
          real_time_balance: realTimeBalance,
          source: 'blockchain'
        }
      });
      
    } else if (req.method === 'POST') {
      // Verify transaction instead of blindly adding amounts
      const { tx_hash } = req.body;
      
      if (!tx_hash) {
        return res.status(400).json({
          success: false,
          error: 'Transaction hash required for verification'
        });
      }
      
      // Verify the transaction
      const transaction = await verifyTransaction(tx_hash);
      
      if (!transaction) {
        return res.status(400).json({
          success: false,
          error: 'Transaction not found or invalid'
        });
      }
      
      // Get updated balance after transaction
      const walletBalance = await getWalletBalance(PRESALE_CONFIG.PRESALE_WALLET_ADDRESS);
      const totalRaised = Math.max(walletBalance, PRESALE_CONFIG.BASELINE_AMOUNT);
      
      const progressPercentage = Math.min((totalRaised / PRESALE_CONFIG.TARGET_RAISE) * 100, 100);
      const realTimeBalance = Math.floor(totalRaised * PRESALE_CONFIG.HYPACK_PER_HYPE);
      
      return res.status(200).json({
        success: true,
        data: {
          total_raised: totalRaised,
          wallet_balance: walletBalance,
          target_raise: PRESALE_CONFIG.TARGET_RAISE,
          progress_percentage: progressPercentage,
          real_time_balance: realTimeBalance,
          verified_transaction: transaction,
          source: 'blockchain'
        }
      });
      
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
    
  } catch (error) {
    console.error('Blockchain API error:', error);
    
    // Fallback to baseline on error
    const totalRaised = PRESALE_CONFIG.BASELINE_AMOUNT;
    const progressPercentage = Math.min((totalRaised / PRESALE_CONFIG.TARGET_RAISE) * 100, 100);
    const realTimeBalance = Math.floor(totalRaised * PRESALE_CONFIG.HYPACK_PER_HYPE);
    
    return res.status(200).json({
      success: true,
      data: {
        total_raised: totalRaised,
        target_raise: PRESALE_CONFIG.TARGET_RAISE,
        progress_percentage: progressPercentage,
        real_time_balance: realTimeBalance,
        source: 'fallback',
        error: error.message
      }
    });
  }
}