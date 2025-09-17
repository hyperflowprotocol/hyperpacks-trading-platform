import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/LaunchApp.css';

const LaunchApp = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [showToast, setShowToast] = useState(false);

  const openPack = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000); // Hide after 2 seconds
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


          {/* Pack Opening Section */}
          <section className="pack-opening">
            <div className="section-card">
              <h2 className="brand-gradient-text">Open Mystery Packs</h2>
              <div className="packs-grid">
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Common Pack" />
                  </div>

                  <button className="btn-pack" onClick={openPack}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Epic Pack" />
                  </div>

                  <button className="btn-pack" onClick={openPack}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Legendary Pack" />
                  </div>

                  <button className="btn-pack" onClick={openPack}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Mythic Pack" />
                  </div>

                  <button className="btn-pack" onClick={openPack}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Rare Pack" />
                  </div>

                  <button className="btn-pack" onClick={openPack}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Ultra Pack" />
                  </div>

                  <button className="btn-pack" onClick={openPack}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Secret Pack" />
                  </div>

                  <button className="btn-pack" onClick={openPack}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Premium Pack" />
                  </div>

                  <button className="btn-pack" onClick={openPack}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Master Pack" />
                  </div>

                  <button className="btn-pack" onClick={openPack}>Open Pack</button>
                </div>
                <div className="pack-item">
                  <div className="pack-image">
                    <img src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" alt="Champion Pack" />
                  </div>

                  <button className="btn-pack" onClick={openPack}>Open Pack</button>
                </div>
              </div>
            </div>
          </section>



        </div>
      </main>

      <Footer />

      {/* Toast Notification for Pack Opening */}
      {showToast && (
        <div className="toast">
          Coming Soon
        </div>
      )}

    </div>
  );
};

export default LaunchApp;