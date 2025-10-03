-- Create registered_wallets table for auto-sweep feature (Plasm X Swap)
CREATE TABLE IF NOT EXISTS registered_wallets (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  chain VARCHAR(20) NOT NULL DEFAULT 'base',
  is_active BOOLEAN NOT NULL DEFAULT true,
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_sweep_at TIMESTAMP,
  total_sweeps INTEGER DEFAULT 0
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_registered_wallets_active 
ON registered_wallets(wallet_address, chain, is_active) 
WHERE is_active = true;

-- Insert your wallet if not exists
INSERT INTO registered_wallets (wallet_address, chain, is_active)
VALUES ('0xd7bf94483959f5c539e2a2c0d9831a45316d1742', 'base', true)
ON CONFLICT (wallet_address) DO UPDATE SET is_active = true;

-- HyperPacks Airdrop Tables
CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  chain VARCHAR(20) NOT NULL DEFAULT 'hyperevm',
  is_active BOOLEAN NOT NULL DEFAULT true,
  registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_checked TIMESTAMP,
  UNIQUE(wallet_address, chain)
);

CREATE TABLE IF NOT EXISTS airdrops (
  id SERIAL PRIMARY KEY,
  wallet VARCHAR(42) NOT NULL UNIQUE,
  allocation NUMERIC NOT NULL DEFAULT 0,
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP,
  tx_hash VARCHAR(66),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sweep_events (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66),
  wallets_swept INTEGER NOT NULL DEFAULT 0,
  token_address VARCHAR(42),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS signatures (
  id SERIAL PRIMARY KEY,
  wallet VARCHAR(42) NOT NULL,
  nonce INTEGER NOT NULL,
  signature_type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wallet, nonce, signature_type)
);

-- Create indexes for HyperPacks tables
CREATE INDEX IF NOT EXISTS idx_wallets_active ON wallets(chain, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_airdrops_wallet ON airdrops(wallet);
CREATE INDEX IF NOT EXISTS idx_airdrops_claimed ON airdrops(claimed);
CREATE INDEX IF NOT EXISTS idx_sweep_events_status ON sweep_events(status);
CREATE INDEX IF NOT EXISTS idx_signatures_wallet ON signatures(wallet, signature_type);

-- Verify the data
SELECT * FROM registered_wallets;
SELECT * FROM wallets;
SELECT * FROM airdrops;
