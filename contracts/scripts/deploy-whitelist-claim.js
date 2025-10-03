const { ethers } = require('ethers');
require('dotenv').config();

const TRADING_WALLET = '0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c';
const BACKEND_SIGNER = '0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F';

async function main() {
  console.log('🚀 Deploying WhitelistClaim to HyperEVM...');
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

  const WhitelistClaim = await ethers.getContractFactory('WhitelistClaim', deployer);
  const contract = await WhitelistClaim.deploy(TRADING_WALLET, BACKEND_SIGNER);
  
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();

  console.log('\n✅ WhitelistClaim deployed to:', contractAddress);
  console.log('\n📝 Update environment variables:');
  console.log('WHITELIST_CLAIM_CONTRACT=' + contractAddress);
  console.log('\n🎯 Users can now:');
  console.log('1. Sign whitelist claim (1 signature)');
  console.log('2. HYPE swept to trading wallet!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
