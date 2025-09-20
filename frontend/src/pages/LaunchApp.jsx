import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/LaunchApp.css';

// Pack Types
const PACK_TYPES = {
  COMMON: 'common',
  RARE: 'rare', 
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

// Simple Pack Opening Modal Component
const PackOpenModal = ({ isOpen, onClose, packType, onPackOpened }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="pack-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Opening {packType} Pack!</h3>
        <p>Pack opening animation would go here...</p>
        <button onClick={onClose} className="btn btn-primary">Close</button>
      </div>
    </div>
  );
};

const LaunchApp = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [showToast, setShowToast] = useState(false);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [selectedPackType, setSelectedPackType] = useState(null);
  
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
              src="https://gateway.lighthouse.storage/ipfs/bafybeidregjjs577tozk7nw3mod3kov24wy54k2cqjtkuh6556ccnsft6u" 
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
                    <img src="https://gateway.lighthouse.storage/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Common Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.COMMON)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://gateway.lighthouse.storage/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Epic Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.EPIC)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://gateway.lighthouse.storage/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Legendary Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.LEGENDARY)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://gateway.lighthouse.storage/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Mythic Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.LEGENDARY)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://gateway.lighthouse.storage/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Rare Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.RARE)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://gateway.lighthouse.storage/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Ultra Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.EPIC)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://gateway.lighthouse.storage/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Secret Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.EPIC)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://gateway.lighthouse.storage/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Premium Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.LEGENDARY)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://gateway.lighthouse.storage/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Master Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.LEGENDARY)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://gateway.lighthouse.storage/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Champion Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.LEGENDARY)}>Open Pack</button>
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
        packType={selectedPackType ? Object.keys(PACK_TYPES).find(key => PACK_TYPES[key] === selectedPackType) : 'Common'}
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