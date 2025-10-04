import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const Landing = () => {

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text brand-gradient-text">HyperPack</span>
          </div>
          <div className="nav-links">
            {/* No wallet connection on landing page */}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          
          {/* Banner Section */}
          <section className="banner-section">
            <img 
              src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeidregjjs577tozk7nw3mod3kov24wy54k2cqjtkuh6556ccnsft6u" 
              alt="HyperPack Banner" 
              className="banner-image"
            />
          </section>
          
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="brand-gradient-text">HyperPack Trading Cards</span>
            </h1>
            <p className="hero-subtitle">
              Experience the ultimate trading card platform on HyperEVM. 
              Open mystery packs, trade rare cards, and collect exclusive rewards.
            </p>
            <div className="hero-buttons">
              <Link to="/app" className="btn-primary">Launch App</Link>
              <Link to="/presale" className="btn-secondary">Join Presale</Link>
              <Link to="/eligibility" className="btn-secondary">Eligibility Checker</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
};

export default Landing;