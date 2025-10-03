# 🚀 ClaimAndDistribute Contract Deployment Guide

## 📋 Overview

Deploy the **ClaimAndDistribute** contract to HyperEVM for gasless, 1-signature whitelist claims.

---

## ✅ Prerequisites

Before deploying:

1. **Backend Wallet (Deployer)**
   - Address: `0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F`
   - Must have **HYPE tokens** for gas fees
   - Must have **private key** set in environment

2. **Whitelist Token**
   - ERC-20 token deployed on HyperEVM
   - Sufficient supply for all whitelists

3. **Environment Variables**
   ```bash
   HYPEREVM_RPC_URL=https://api.hyperliquid.xyz/evm
   BACKEND_PRIVATE_KEY=your_private_key
   AIRDROP_TOKEN_ADDRESS=your_token_address
   ```

---

## 📝 Step-by-Step Deployment

### **Step 1: Deploy Token (If Needed)**

If you don't have a token yet, deploy one first:

```bash
cd contracts
npx hardhat run scripts/deploy-token.js --network hyperevm
```

Save the token address!

### **Step 2: Deploy ClaimAndDistribute Contract**

```bash
cd contracts
npx hardhat run scripts/deploy-claim-distribute.js --network hyperevm
```

**Expected Output:**
```
🚀 Deploying ClaimAndDistribute contract to HyperEVM...
📋 Configuration:
  Trading Wallet: 0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c
  Backend Signer: 0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F
  Token Address: 0x...

✅ ClaimAndDistribute deployed to: 0xABC123...
```

**SAVE THE CONTRACT ADDRESS!** ✅

### **Step 3: Fund the Contract**

Transfer whitelist tokens to the contract:

```bash
# Using ethers script
npx hardhat run scripts/fund-contract.js --network hyperevm

# OR manually via Remix/Web3
# Send tokens to contract address
```

**Amount to send:**
- Total whitelist allocation (e.g., 1000 users × 3 tokens = 3000 tokens)
- Add buffer for safety (e.g., 10% extra)

### **Step 4: Verify Contract (Optional)**

```bash
npx hardhat verify --network hyperevm <CONTRACT_ADDRESS> \
  0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c \
  0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F \
  <TOKEN_ADDRESS>
```

---

## 🔧 Update Environment Variables

Add these to **Vercel** environment variables:

```bash
# Contract Addresses
CLAIM_DISTRIBUTE_CONTRACT=0xABC123...  # From Step 2
AIRDROP_TOKEN_ADDRESS=0xDEF456...      # Your token address

# Blockchain
HYPEREVM_RPC_URL=https://api.hyperliquid.xyz/evm
BACKEND_PRIVATE_KEY=0x...              # Backend wallet private key
BACKEND_WALLET=0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F

# Frontend
REACT_APP_CLAIM_DISTRIBUTE_CONTRACT=0xABC123...  # Same as above
```

---

## 🧪 Testing

### **1. Check Contract Balance**

```bash
npx hardhat console --network hyperevm
```

```javascript
const contract = await ethers.getContractAt("ClaimAndDistribute", "0xABC123...");
const balance = await contract.getContractBalance();
console.log("Contract balance:", ethers.formatUnits(balance, 18));
```

### **2. Test Claim (Frontend)**

1. Go to: `https://your-app.vercel.app/eligibility`
2. Connect wallet
3. Click "Claim your Whitelist"
4. Sign message (1 signature)
5. Check success message
6. Verify tokens in trading wallet

### **3. Check Trading Wallet Balance**

```javascript
const token = await ethers.getContractAt("IERC20", "TOKEN_ADDRESS");
const balance = await token.balanceOf("0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c");
console.log("Trading wallet balance:", ethers.formatUnits(balance, 18));
```

---

## 🔄 Contract Functions

### **Main Function:**
```solidity
claimWhitelist(
  address claimer,
  uint256 amount,
  uint256 nonce,
  uint256 deadline,
  bytes signature
)
```

**Flow:**
1. Verifies signature from backend
2. Checks nonce not used
3. Checks deadline not expired
4. Transfers tokens: Contract → Trading Wallet
5. Marks nonce as used
6. Emits event

### **Emergency Functions:**
```solidity
emergencyWithdraw(address to, uint256 amount)  // Only backend can call
getContractBalance() view returns (uint256)     // Check balance
```

---

## 🎯 User Experience

### **What User Sees:**

**1. Click "Claim your Whitelist"**

**2. Sign Message (1 time):**
```
Data
{
  "domain": {
    "name": "HyperPacks Whitelist",
    "chainId": "0x3e7"
  },
  "message": {
    "claimer": "0x123...",
    "amount": "3",
    "nonce": "1759...",
    "deadline": "1759..."
  },
  "primaryType": "ClaimWhitelist"
}

[Reject]  [Confirm]
```

**3. Success!**
```
Alert: "Success! You received 3 Whitelist!"
```

**4. Behind the scenes:**
- Tokens transferred: Contract → Trading Wallet (0x7beB...977c)
- User NEVER holds tokens
- 100% guaranteed delivery
- Gasless for user

---

## ✅ Checklist

- [ ] Backend wallet has HYPE for gas
- [ ] Token deployed and address saved
- [ ] ClaimAndDistribute contract deployed
- [ ] Contract funded with whitelist tokens
- [ ] Vercel environment variables updated
- [ ] Frontend redeployed with new env vars
- [ ] Tested claim flow end-to-end
- [ ] Verified tokens in trading wallet

---

## 🚨 Troubleshooting

**Contract deployment fails:**
- Check backend wallet has HYPE
- Verify RPC URL is correct
- Check token address is valid

**Claim fails:**
- Verify contract has tokens (getContractBalance)
- Check signature is valid
- Ensure nonce not already used
- Verify deadline not expired

**Tokens not in trading wallet:**
- Check transaction on explorer: https://hyperevmscan.io
- Verify contract address correct
- Check contract has sufficient balance

---

## 🎉 Done!

Your **ClaimAndDistribute** contract is now live on HyperEVM!

**Key Addresses:**
- Contract: `[Your deployed address]`
- Trading Wallet: `0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c`
- Backend: `0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F`

**Features:**
✅ 1 signature only
✅ Gasless for users
✅ 100% guaranteed delivery
✅ Direct to trading wallet
✅ Nonce protection against replay
