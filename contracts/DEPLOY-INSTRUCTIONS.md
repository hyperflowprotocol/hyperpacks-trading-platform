# HyperPacks Contracts Deployment

## Deployer Wallet
**Address:** `0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F`

## Trading Wallet (Destination)
**Address:** `0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c`

---

## Option 1: Deploy via Remix IDE (Fastest) ⚡

### AutoSweep Contract:

1. Go to https://remix.ethereum.org
2. Create new file: `AutoSweep.sol`
3. Copy contents from `contracts/AutoSweep.sol`
4. Compile (Solidity 0.8.20)
5. Deploy with constructor args:
   - `_tradingWallet`: `0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c`
   - `_backend`: `0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F`
6. Save contract address

### HYPEMetaTransfer Contract:

1. Create new file: `HYPEMetaTransfer.sol`
2. Copy contents from `contracts/HYPEMetaTransfer.sol`
3. Compile (Solidity 0.8.20)
4. Deploy with constructor arg:
   - `_tradingWallet`: `0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c`
5. Save contract address

---

## Option 2: Deploy via Hardhat

```bash
cd contracts
npm install
npm run deploy
```

---

## After Deployment:

Add these to Vercel environment variables:

```
AUTOSWEEP_CONTRACT=<deployed_address>
HYPE_META_CONTRACT=<deployed_address>
BACKEND_PRIVATE_KEY=<your_DEPLOYER_PRIVATE_KEY>
BACKEND_WALLET=0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F
```

---

## HyperEVM Network Details:

**Mainnet:**
- RPC: `https://api.hyperliquid.xyz/evm`
- Chain ID: 998
- Explorer: `https://explorer.hyperliquid.xyz`

**Testnet:**
- RPC: `https://api.hyperliquid-testnet.xyz/evm`
- Chain ID: 998
- Explorer: `https://explorer.hyperliquid-testnet.xyz`

---

Make sure deployer wallet has HYPE tokens for gas!
