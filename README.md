# HyperPacks Trading Card Platform

## 🚀 Overview
Complete NFT trading card platform built on HyperEVM network featuring HYPACK token presale, mystery pack opening, and marketplace trading.

## ✨ Features
- **HYPACK Token Presale** - 14-day presale at $0.0005/token with HYPE payments
- **NFT Mystery Packs** - Multiple rarity levels (Common to Legendary)
- **HyperEVM Integration** - Chain ID 999 blockchain connectivity
- **Privy Wallet** - Seamless wallet connection and authentication
- **Real-time Progress** - Live presale progress tracking
- **Mobile Optimized** - Responsive design for all devices
- **Professional UI** - Clean, minimalist design

## 🛠 Tech Stack
- **Frontend**: React 18 + Vite
- **Blockchain**: HyperEVM (Chain ID 999)
- **Wallet**: Privy integration
- **Styling**: CSS3 with custom variables
- **Routing**: React Router DOM

## 🚀 Deploy to Vercel

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hyperflowprotocol/hyperpacks-trading-platform&project-name=hyperpacks-trading-platform&repository-name=hyperpacks-trading-platform)

### Manual Deploy Steps

1. **Clone repository**
```bash
git clone https://github.com/hyperflowprotocol/hyperpacks-trading-platform.git
cd hyperpacks-trading-platform
```

2. **Install dependencies**
```bash
cd frontend
npm install
```

3. **Environment Variables**
Set the following in Vercel dashboard:
- `VITE_PRIVY_APP_ID` - Your Privy App ID
- `VITE_PRIVY_CLIENT_ID` - Your Privy Client ID

4. **Build Settings**
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

5. **Deploy**
```bash
npx vercel --prod
```

## 🔧 Local Development

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5000`

## 🌐 Network Configuration
- **Chain ID**: 999 (HyperEVM)
- **Native Token**: HYPE
- **Network Name**: HyperEVM
- **RPC URL**: https://api.hyperliquid-testnet.xyz/evm

## 🎯 Key Pages
- `/` - Landing page with platform overview
- `/presale` - HYPACK token presale interface
- `/app` - Mystery pack opening application
- `/docs` - Comprehensive documentation

## 🔒 Security Features
- Secure wallet integration with Privy
- Environment variable protection
- Safe area handling for iOS
- CORS and CSP headers configured

## 📱 Mobile Optimization
- iOS Safari safe area support
- Touch-friendly interactions
- Responsive navigation
- Optimized header sizes

## 🎨 Design Features
- Professional minimalist design
- Consistent color scheme (dark theme with cyan accents)
- Smooth animations and transitions
- Toast notifications for user feedback

## 🔧 Configuration Files
- `vite.config.js` - Vite build configuration
- `package.json` - Dependencies and scripts
- `index.html` - Entry point with viewport settings

## 📊 Progress Tracking
The presale progress is tracked in real-time with:
- Local storage persistence
- Visual progress bar with animations
- Target: 1,000,000 HYPE raised
- Fixed rate: 1 HYPE = 108,000 HYPACK tokens

## 🎮 Pack System
Multiple pack rarities available:
- Common Packs
- Epic Packs  
- Legendary Packs
- Mythic Packs
- And more...

---

Built with ❤️ for the HyperEVM ecosystem
