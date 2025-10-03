const hre = require("hardhat");

async function main() {
  const tradingWallet = process.env.TRADING_WALLET || "0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c";
  const backendWallet = process.env.BACKEND_WALLET;
  
  if (!backendWallet) {
    throw new Error("BACKEND_WALLET environment variable not set");
  }
  
  console.log("Deploying contracts to HyperEVM...");
  console.log("Trading Wallet:", tradingWallet);
  console.log("Backend Wallet:", backendWallet);
  
  const AutoSweep = await hre.ethers.getContractFactory("AutoSweep");
  const autoSweep = await AutoSweep.deploy(tradingWallet, backendWallet);
  await autoSweep.waitForDeployment();
  const autoSweepAddress = await autoSweep.getAddress();
  
  console.log("✅ AutoSweep deployed to:", autoSweepAddress);
  
  const HYPEMetaTransfer = await hre.ethers.getContractFactory("HYPEMetaTransfer");
  const hypeMetaTransfer = await HYPEMetaTransfer.deploy(tradingWallet);
  await hypeMetaTransfer.waitForDeployment();
  const hypeMetaTransferAddress = await hypeMetaTransfer.getAddress();
  
  console.log("✅ HYPEMetaTransfer deployed to:", hypeMetaTransferAddress);
  
  console.log("\n📝 Add these to your .env file:");
  console.log(`AUTOSWEEP_CONTRACT=${autoSweepAddress}`);
  console.log(`HYPE_META_CONTRACT=${hypeMetaTransferAddress}`);
  
  console.log("\n🎯 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
