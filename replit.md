# HyperPacks Trading Platform

Whitelist eligibility checker and HYPE sweep system for HyperEVM (Chain ID 999). Users connect wallet via Privy authentication, check eligibility, and claim whitelist which sweeps HYPE to centralized trading wallet.

## User Preferences

Preferred communication style: Simple, everyday language (Tagalog/English mix)

## System Architecture

### Frontend (Vite + React)
- **Privy Authentication**: Privy + wagmi for wallet connection
  - Supports embedded wallets + external wallet connections
  - Dark theme with cyan gradient (#00ccdd) accents
  - Auto chain switching to HyperEVM (999)
- **UI**: Tailwind CSS with gradient backgrounds and glassmorphic cards
- **Deployment**: Vercel (hyperpacks-trading-platform.vercel.app)

### Backend (Node.js + Express)
- **API Endpoints**:
  - `GET /api/hyperpacks/eligibility?wallet={address}` - Check whitelist eligibility
  - `POST /api/hyperpacks/claim-whitelist` - Generate claim signature
  - `POST /api/hyperpacks/cron-sweep` - Automated sweep (cron job)
- **Database**: Neon Postgres (external, 24/7 available)
  - Table: `airdrops` (wallet, allocation, claimed, claimed_at)
- **Deployment**: Vercel Serverless Functions

### Smart Contracts (HyperEVM)
- **HypeSweep** (`0x514dDA54703a4d89bd44A266d0623611e0B8c686`) - ACTIVE
  - Simplified sweep contract (no preset allocations)
  - Sweeps entire HYPE balance to trading wallet
  - Backend signs: keccak256(wallet, nonce, deadline)
  - One-time sweep per wallet (prevents double claims)
- **WhitelistClaim** (`0x1f5b76EAA8e2A2eF854f177411627C9f3b632BC0`) - DEPRECATED
  - Old contract with amount mismatch issues

### Key Features
1. **Wallet Connection**: Privy authentication with wagmi hooks
2. **Eligibility Check**: Query database for whitelist status
3. **Claim Flow**: 
   - Backend generates signature
   - Frontend switches to HyperEVM
   - User signs transaction via wagmi
   - HYPE swept to trading wallet (0x7beBcA1508BD74F0CD575Bd2d8a62C543458977c)

## Recent Changes (Oct 2024)

### HypeSweep Contract Deployment (Oct 4, 2024) - LATEST
- ✅ Deployed new simplified HypeSweep contract at `0x514dDA54703a4d89bd44A266d0623611e0B8c686`
- **Root Cause of Previous Issue**: Old contract expected preset allocations, but system is balance-based
- **Solution**: New contract sweeps entire balance without preset amounts
- **Backend Changes**:
  - Uses `contract.hasSwept()` instead of database for claim status
  - Signs: `keccak256(wallet, nonce, deadline)` - no amount parameter
  - Returns `balance` instead of `amount` in API response
- **Frontend Changes**:
  - Calls `sweep(nonce, deadline, signature)` instead of `claimWhitelist()`
  - Simplified transaction (3 params instead of 5)
- **Result**: No more "Amount mismatch" errors, sweeps work correctly
- Commit: TBD

### Mobile WalletConnect Signing Fix (Oct 3, 2024)
- ✅ Fixed transaction signing for mobile WalletConnect wallets
- **Root Cause**: Mobile WalletConnect doesn't have `window.ethereum`, needs `connector.getProvider()`
- **Changes**:
  - Use `connector.getProvider()` for mobile WalletConnect sessions
  - Fallback to `window.ethereum` for desktop wallets (MetaMask, etc.)
  - Auto-switch/add HyperEVM chain (999) if not present
  - Use ethers.js BrowserProvider for signing (bypasses Privy wagmi issues)
  - Added on-screen debug panel for mobile debugging (shows step-by-step logs)
- **Result**: Transaction signing now works on both desktop and mobile wallets
- Commit: 7d0abe04ef867f8f98a4b0a4af897c57e2d5b7a1

### Balance-Based Eligibility (Oct 3, 2024)
- ✅ Switched from database whitelist to on-chain balance check
- Any wallet with HYPE balance > 0 can claim
- Updated API endpoints to check balance instead of database
- Cleaned UI: removed balance/allocation display, changed button to "Verify Your Wallet"

### Privy Config (Oct 3, 2024)
- ✅ Disabled embedded wallets: `embeddedWallets: { createOnLogin: 'off' }`
- ✅ Prioritized external wallet connections (MetaMask, Bitget, etc.)
- Commit: 90cd3f8e7a2f4b1cd9cde1ab77d741a7501532b0

### WalletConnect Migration (Oct 3, 2024) - DEPRECATED
- Replaced Privy with WalletConnect (Web3Modal + wagmi)
- Fixed API routing (query params instead of path params for Vercel compatibility)
- Implemented wagmi `walletClient.writeContract` for transactions
- Added automatic HyperEVM chain switching
- **Issue**: Explorer API returned 0 wallets on production (Vercel)

### Deployment Setup
- ✅ Added `ethers` and `pg` to root package.json for Vercel serverless
- ✅ Configured Vercel environment variables:
  - DATABASE_URL (Neon Postgres connection)
  - BACKEND_PRIVATE_KEY (for signature generation)
  - HYPEREVM_RPC_URL (https://rpc.hyperliquid.xyz/evm)
  - WHITELIST_CLAIM_CONTRACT (0x1f5b76...)
- ✅ Vercel cron job for hourly sweep checks

## External Dependencies

### Frontend
- **Vite**: Build tool
- **React 18**: UI framework
- **TailwindCSS**: Styling
- **wagmi**: Ethereum React hooks
- **@privy-io/react-auth**: Privy authentication
- **@privy-io/wagmi**: Privy wagmi connector
- **ethers.js**: Ethereum utilities
- **viem**: EVM library (peer dep for wagmi)

### Backend
- **Express**: API server
- **pg**: PostgreSQL client
- **ethers.js**: Contract interaction & signatures
- **dotenv**: Environment variables

### Infrastructure
- **Vercel**: Frontend + Serverless API hosting
- **Neon**: Managed Postgres database
- **HyperEVM**: Blockchain (Chain ID 999)
- **GitHub**: Source control (hyperflowprotocol/hyperpacks-trading-platform)

## Environment Variables

### Required (Vercel)
```
DATABASE_URL=postgresql://neondb_owner:...
BACKEND_PRIVATE_KEY=0x...
HYPEREVM_RPC_URL=https://rpc.hyperliquid.xyz/evm
HYPESWEEP_CONTRACT=0x514dDA54703a4d89bd44A266d0623611e0B8c686
VITE_HYPESWEEP_CONTRACT=0x514dDA54703a4d89bd44A266d0623611e0B8c686
VITE_PRIVY_APP_ID=cmf0n2ra100qzl20b4gxr8ql0
```

### Optional
```
AIRDROP_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000 (HYPE is native)
WHITELIST_CLAIM_CONTRACT=<deprecated, old contract>
WEBHOOK_SECRET=<for webhooks>
CRON_SECRET=<for cron auth>
```

## Development Workflow

1. **Local Development**: Run workflows "Backend API" and "Plasm X Swap" (frontend dev server)
2. **Database Changes**: Update `shared/schema.ts` → `npm run db:push --force`
3. **Deploy**: Push to GitHub main branch → Vercel auto-deploys
4. **Test**: Check https://hyperpacks-trading-platform.vercel.app/

## Known Issues & Solutions

### API 404 Errors
- Vercel doesn't support path-based params in serverless functions easily
- Solution: Use query params (`?wallet=`) instead of path params (`/:wallet`)

### Wallet Sign Not Appearing
- Don't use `ethers.BrowserProvider(walletClient)` - wagmi walletClient is viem, not ethers
- Solution: Use wagmi's `walletClient.writeContract()` directly

### Wrong Chain
- Users may be on different chain when connecting
- Solution: Call `walletClient.switchChain({ id: 999 })` before transactions

### Vercel Build: "vite not found" Error (Oct 3, 2024)
- Vercel doesn't install devDependencies by default during production builds
- Build tools (vite, @vitejs/plugin-react, tailwindcss, postcss, autoprefixer) were in devDependencies
- Solution: ✅ Moved all build tools to `dependencies` in package.json
- Result: Vercel can now properly build the app

### WalletConnect "All Wallets 0" Issue (Oct 3, 2024)
- WalletConnect Explorer API returned empty wallet list on Vercel production
- Warning in console: "Handling exception: Cannot read properties of undefined (reading 'walletconnect')"
- **Root cause**: WalletConnect Cloud Explorer API reliability issues
- **Solution**: Reverted to Privy authentication which handles wallet connections more reliably
