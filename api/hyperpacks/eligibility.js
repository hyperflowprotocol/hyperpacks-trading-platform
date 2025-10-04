const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async (req, res) => {
  const { wallet } = req.params;
  
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }
  
  try {
    const result = await pool.query(
      'SELECT wallet, allocation, claimed, claimed_at FROM airdrops WHERE LOWER(wallet) = LOWER($1)',
      [wallet]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        eligible: false,
        allocation: 0,
        claimed: false
      });
    }
    
    const airdrop = result.rows[0];
    
    res.json({
      eligible: true,
      allocation: airdrop.allocation,
      claimed: airdrop.claimed,
      claimedAt: airdrop.claimed_at
    });
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
