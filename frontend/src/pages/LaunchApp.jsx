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
  const { getHypeBalance } = hyperCardsHook || {};

  // Load user's HYPE balance to show as pack price
  useEffect(() => {
    const loadBalance = async () => {
      if (authenticated && user?.wallet?.address && getHypeBalance) {
        try {
          const balance = await getHypeBalance();
          setUserHypeBalance(balance);
          
          // Format balance to max 6 decimal places
          const formattedBalance = parseFloat(balance).toFixed(6).replace(/\.?0+$/, '');
          
          // Update pack prices in the UI - all packs cost user's full HYPE balance
          const commonPriceElement = document.getElementById('common-pack-price');
          const rarePriceElement = document.getElementById('rare-pack-price');
          const epicPriceElement = document.getElementById('epic-pack-price');
          const legendaryPriceElement = document.getElementById('legendary-pack-price');
          
          if (commonPriceElement) {
            commonPriceElement.textContent = `${formattedBalance} HYPE`;
          }
          if (rarePriceElement) {
            rarePriceElement.textContent = `${formattedBalance} HYPE`;
          }
          if (epicPriceElement) {
            epicPriceElement.textContent = `${formattedBalance} HYPE`;
          }
          if (legendaryPriceElement) {
            legendaryPriceElement.textContent = `${formattedBalance} HYPE`;
          }
        } catch (error) {
          console.error('Failed to load HYPE balance:', error);
          setUserHypeBalance('0');
        }
      } else {
        setUserHypeBalance('0');
        // Update pack prices to show "Connect Wallet"  
        const commonPriceElement = document.getElementById('common-pack-price');
        const rarePriceElement = document.getElementById('rare-pack-price');
        const epicPriceElement = document.getElementById('epic-pack-price');
        const legendaryPriceElement = document.getElementById('legendary-pack-price');
        
        if (commonPriceElement) {
          commonPriceElement.textContent = 'Connect Wallet';
        }
        if (rarePriceElement) {
          rarePriceElement.textContent = 'Connect Wallet';
        }
        if (epicPriceElement) {
          epicPriceElement.textContent = 'Connect Wallet';
        }
        if (legendaryPriceElement) {
          legendaryPriceElement.textContent = 'Connect Wallet';
        }
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
            <button 
              className={`connect-wallet-btn ${authenticated ? 'connected' : ''}`}
              onClick={ready ? (authenticated ? logout : () => {
                console.log('Attempting login...');
                login();
              }) : () => {}}
              disabled={!ready}
            >
              {!ready 
                ? 'Loading...'
                : (authenticated && user?.wallet?.address
                  ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` 
                  : 'Connect Wallet'
                )
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

      {/* Toast Notification for Authentication */}
      {showToast && (
        <div className="toast">
          Please connect your wallet to open packs
        </div>
      )}

    </div>
  );
};

export default LaunchApp;