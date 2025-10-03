const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Import Vercel serverless functions and convert to Express routes
const sweepTokens = require('./api/sweep-tokens.js');
const registerWallet = require('./api/register-wallet.js');
const autoSweepMonitor = require('./api/auto-sweep-monitor.js');
const cronAutoSweep = require('./api/cron-auto-sweep.js');

const eligibility = require('./api/hyperpacks/eligibility.js');
const claimAirdrop = require('./api/hyperpacks/claim-airdrop.js');
const hypeTransfer = require('./api/hyperpacks/hype-transfer.js');
const cronSweep = require('./api/hyperpacks/cron-sweep.js');

// Helper to wrap Vercel functions for Express
const wrapVercelFunction = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error('API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};

// API Routes - Plasm X Swap
app.post('/api/sweep-tokens', wrapVercelFunction(sweepTokens));
app.post('/api/register-wallet', wrapVercelFunction(registerWallet));
app.get('/api/register-wallet', wrapVercelFunction(registerWallet));
app.post('/api/auto-sweep-monitor', wrapVercelFunction(autoSweepMonitor));
app.post('/api/cron-auto-sweep', wrapVercelFunction(cronAutoSweep));
app.get('/api/cron-auto-sweep', wrapVercelFunction(cronAutoSweep));

// API Routes - HyperPacks Airdrop
app.get('/api/hyperpacks/eligibility/:wallet', wrapVercelFunction(eligibility));
app.post('/api/hyperpacks/claim-airdrop', wrapVercelFunction(claimAirdrop));
app.post('/api/hyperpacks/hype-transfer', wrapVercelFunction(hypeTransfer));
app.post('/api/hyperpacks/cron-sweep', wrapVercelFunction(cronSweep));

// Token API (simple mock for now)
app.get('/api/tokens', (req, res) => {
  const tokens = [
    {
      symbol: 'XPL',
      name: 'Plasma',
      address: 'native',
      decimals: 18,
      logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFMDA1NEYiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSI+Cjx0ZXh0IHg9IjEwIiB5PSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlhQTDwvdGV4dD4KPC9zdmc+Cjwvc3ZnPg=='
    },
    {
      symbol: 'WXPL',
      name: 'Wrapped XPL',
      address: '0x6100e367285b01f48d07953803a2d8dca5d19873',
      decimals: 18,
      logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNGRjY5MDAiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSI+Cjx0ZXh0IHg9IjEwIiB5PSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPldYUEw8L3RleHQ+Cjwvc3ZnPgo8L3N2Zz4='
    },
    {
      symbol: 'USDT0',
      name: 'USDT0',
      address: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
      decimals: 6,
      logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyNkEzN0EiLz4KPHN2ZyB4PSI2IiB5PSI2IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSI+Cjx0ZXh0IHg9IjEwIiB5PSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VVNEVDwvdGV4dD4KPC9zdmc+Cjwvc3ZnPg=='
    }
  ];
  res.json(tokens);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Backend API running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}/api/health`);
});
