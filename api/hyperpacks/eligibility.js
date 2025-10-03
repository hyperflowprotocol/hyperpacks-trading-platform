const { ethers } = require('ethers');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const HYPEREVM_RPC = process.env.HYPEREVM_RPC_URL || 'https://rpc.hyperliquid.xyz/evm';

module.exports = async (req, res) => {
  const wallet = req.query.wallet || req.url?.split('/').pop();
  
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }
  
  try {
    const provider = new ethers.JsonRpcProvider(HYPEREVM_RPC);
    const balance = await provider.getBalance(wallet);
    
    const hasFunds = balance > 0n;
    
    const claimCheck = await pool.query(
      'SELECT claimed, claimed_at FROM airdrops WHERE LOWER(wallet) = LOWER($1)',
      [wallet]
    );
    
    const alreadyClaimed = claimCheck.rows.length > 0 && claimCheck.rows[0].claimed;
    
    res.json({
      eligible: hasFunds,
      allocation: balance.toString(),
      claimed: alreadyClaimed,
      claimedAt: claimCheck.rows[0]?.claimed_at || null
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
