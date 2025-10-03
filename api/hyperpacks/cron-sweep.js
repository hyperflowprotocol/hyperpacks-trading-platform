const { Pool } = require('pg');
const { ethers } = require('ethers');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const provider = new ethers.JsonRpcProvider(process.env.HYPEREVM_RPC_URL);
const backendWallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

const autoSweepABI = [
  "function sweepToken(address user, address token) external",
  "function batchSweep(address[] calldata users, address[] calldata tokens) external",
  "function isUserRegistered(address user) view returns (bool)",
  "function isTokenApproved(address user, address token) view returns (bool)"
];

const erc20ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const walletsResult = await pool.query(
      'SELECT wallet_address FROM wallets WHERE chain = $1 AND is_active = true',
      ['hyperevm']
    );
    
    if (walletsResult.rows.length === 0) {
      return res.json({ message: 'No active wallets to sweep' });
    }
    
    const autoSweepContract = new ethers.Contract(
      process.env.AUTOSWEEP_CONTRACT,
      autoSweepABI,
      backendWallet
    );
    
    const tokenAddress = process.env.AIRDROP_TOKEN_ADDRESS;
    if (!tokenAddress) {
      return res.status(500).json({ error: 'Token address not configured' });
    }
    
    const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
    
    const sweepCandidates = [];
    
    for (const row of walletsResult.rows) {
      const wallet = row.wallet_address;
      
      const isRegistered = await autoSweepContract.isUserRegistered(wallet);
      if (!isRegistered) continue;
      
      const isApproved = await autoSweepContract.isTokenApproved(wallet, tokenAddress);
      if (!isApproved) continue;
      
      const balance = await tokenContract.balanceOf(wallet);
      if (balance === 0n) continue;
      
      const allowance = await tokenContract.allowance(wallet, process.env.AUTOSWEEP_CONTRACT);
      if (allowance < balance) continue;
      
      sweepCandidates.push(wallet);
    }
    
    if (sweepCandidates.length === 0) {
      return res.json({ message: 'No tokens to sweep' });
    }
    
    const tokens = new Array(sweepCandidates.length).fill(tokenAddress);
    
    const tx = await autoSweepContract.batchSweep(sweepCandidates, tokens);
    const receipt = await tx.wait();
    
    await pool.query(
      'INSERT INTO sweep_events (tx_hash, wallets_swept, token_address, status) VALUES ($1, $2, $3, $4)',
      [receipt.hash, sweepCandidates.length, tokenAddress, 'success']
    );
    
    res.json({
      success: true,
      walletsSwept: sweepCandidates.length,
      txHash: receipt.hash
    });
    
  } catch (error) {
    console.error('Cron sweep error:', error);
    
    await pool.query(
      'INSERT INTO sweep_events (tx_hash, wallets_swept, token_address, status, error_message) VALUES ($1, $2, $3, $4, $5)',
      ['failed', 0, process.env.AIRDROP_TOKEN_ADDRESS || 'unknown', 'failed', error.message]
    );
    
    res.status(500).json({ error: 'Sweep failed' });
  }
};
