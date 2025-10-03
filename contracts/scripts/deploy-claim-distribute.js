const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Deploying ClaimAndDistribute contract to HyperEVM...');
  
  // Addresses
  const TRADING_WALLET = '0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c';
  const BACKEND_SIGNER = '0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F';
  const TOKEN_ADDRESS = process.env.AIRDROP_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
  
  if (TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.error('❌ Please set AIRDROP_TOKEN_ADDRESS in .env');
    process.exit(1);
  }
  
  console.log('📋 Configuration:');
  console.log('  Trading Wallet:', TRADING_WALLET);
  console.log('  Backend Signer:', BACKEND_SIGNER);
  console.log('  Token Address:', TOKEN_ADDRESS);
  
  // Deploy contract
  const ClaimAndDistribute = await ethers.getContractFactory('ClaimAndDistribute');
  const contract = await ClaimAndDistribute.deploy(
    TRADING_WALLET,
    BACKEND_SIGNER,
    TOKEN_ADDRESS
  );
  
  await contract.deployed();
  
  console.log('✅ ClaimAndDistribute deployed to:', contract.address);
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Transfer whitelist tokens to contract:', contract.address);
  console.log('2. Add contract address to Vercel env: CLAIM_DISTRIBUTE_CONTRACT=' + contract.address);
  console.log('3. Update frontend to use new contract');
  console.log('');
  console.log('💡 To fund contract:');
  console.log('  npx hardhat run scripts/fund-contract.js --network hyperevm');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
