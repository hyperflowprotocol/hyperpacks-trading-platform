import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import PackOpenModal from '../components/PackOpenModal';
import ProgressBar from '../components/ProgressBar';
import useHyperDomains from '../hooks/useHyperDomains';
import usePresaleStats from '../hooks/usePresaleStats';
import '../styles/LaunchApp.css';

const LaunchApp = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [showToast, setShowToast] = useState(false);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [selectedPackType, setSelectedPackType] = useState(null);
  const [packResult, setPackResult] = useState(null);
  
  const { openPack: openPackContract, isLoading, error, PACK_TYPES } = useHyperDomains();
  const presaleStats = usePresaleStats();

  const openPack = async (packType) => {
    if (!authenticated) {
      // Show login prompt
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setSelectedPackType(packType);
    setIsPackModalOpen(true);
  };

  const handlePackOpened = (result) => {
    setPackResult(result);
    console.log('Pack opened successfully:', result);
  };

  const handleModalClose = () => {
    setIsPackModalOpen(false);
    setSelectedPackType(null);
    setPackResult(null);
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
              src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeihojrsm66vtxjqia6skjl6jb6rnw2avrvejaehpv52leyafk5awc4" 
              alt="HyperPack Banner" 
              className="banner-image"
            />
          </section>

          {/* Presale Progress Section */}
          <section className="presale-progress">
            <div className="section-card">
              <h2 className="brand-gradient-text">HYPACK Token Presale</h2>
              <p className="presale-description">
                Join the presale for exclusive HYPACK tokens at $0.05 each. Use HYPE tokens to participate!
              </p>
              <ProgressBar 
                percentage={presaleStats.percentage}
                raised={presaleStats.raised}
                goal={presaleStats.goal}
                loading={presaleStats.loading}
              />
              <div className="presale-cta">
                <Link to="/presale" className="btn btn-primary">
                  Join Presale Now
                </Link>
              </div>
            </div>
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

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.COMMON)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Epic Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.EPIC)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Legendary Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.LEGENDARY)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Mythic Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.LEGENDARY)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Rare Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.RARE)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Ultra Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.EPIC)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Secret Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.EPIC)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Premium Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.LEGENDARY)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Master Pack" />
                  </div>

                  <button className="btn-pack" onClick={() => openPack(PACK_TYPES.LEGENDARY)}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Champion Pack" />
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