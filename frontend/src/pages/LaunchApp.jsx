import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/LaunchApp.css';

const LaunchApp = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [showToast, setShowToast] = useState(false);

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

          {/* Simple Call to Action */}
          <section className="cta-section">
            <div className="section-card">
              <h2 className="brand-gradient-text">Welcome to HyperPack</h2>
              <p>Join the HYPACK token presale and be part of the future!</p>
              <Link to="/presale" className="btn btn-primary">
                View Token Presale
              </Link>
            </div>
          </section>

        </div>
      </main>

      <Footer />

      {/* Toast Notification */}
      {showToast && (
        <div className="toast">
          Please connect your wallet
        </div>
      )}

    </div>
  );
};

export default LaunchApp;