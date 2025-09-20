import React, { useState } from 'react';
import Footer from '../components/Footer';
import '../styles/Docs.css';

// SVG Icon Components
const SVGIcon = ({ type, size = 16 }) => {
  const icons = {
    wave: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M8 4c0-1.1-.9-2-2-2s-2 .9-2 2v8c0 3.3 2.7 6 6 6h4c2.2 0 4-1.8 4-4V9c0-.6-.4-1-1-1s-1 .4-1 1v5c0 1.1-.9 2-2 2h-4c-2.2 0-4-1.8-4-4V4z"/><path d="M9 2c0-.6-.4-1-1-1s-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1V2z"/><path d="M12 1c0-.6-.4-1-1-1s-1 .4-1 1v3c0 .6.4 1 1 1s1-.4 1-1V1z"/><path d="M15 2c0-.6-.4-1-1-1s-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1V2z"/><path d="M18 3c0-.6-.4-1-1-1s-1 .4-1 1v3c0 .6.4 1 1 1s1-.4 1-1V3z"/></svg>,
    rocket: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M9 11H7l-.8-1.6c-.4-.8-.4-1.8 0-2.6L7 6h2v5zm2 4.15V15h4l.5-2H15V9h2l-.5-2H12v8.15z"/><path d="M14 2.9v4.25l5.5 2.25v6.2L14 13.35V21.1l-2-0.9V2.9h2z"/></svg>,
    cards: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M6 2h12c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 2v16h12V4H6z"/><path d="M8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h4v2H8v-2z"/></svg>,
    store: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v12z"/></svg>,
    diamond: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M6 2l2 6h8l2-6h-12zm-1.5 7L12 22l7.5-13h-15zM12 9L9 8h6l-3 1z"/></svg>,
    gaming: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h1v-1c0-3.859-3.141-7-7-7h-4c-3.859 0-7 3.141-7 7v1h1 1v-1c0-2.757 2.243-5 5-5h4c2.757 0 5 2.243 5 5v1z"/></svg>,
    coin: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M9 12l2 2 4-4"/></svg>,
    money: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>,
    card: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>,
    target: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    square: <svg width={size} height={size} viewBox="0 0 24 24" fill="white"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
  };
  return icons[type] || null;
};

// Documentation Pages Data
const docPages = [
  {
    id: 'welcome',
    title: 'Welcome to HyperPacks',
    content: `
      <h2>What is HyperPacks?</h2>
      
      <p>Think of <strong>Yu-Gi-Oh!</strong> and <strong>Pokemon cards</strong> - but digital and powered by blockchain technology! HyperPacks brings the excitement of collecting, trading, and battling with cards to the digital world.</p>
      
      <p>Just like buying Pokemon booster packs or Yu-Gi-Oh! card packs, you can open HyperPacks to discover rare and powerful digital cards. Each card is a unique digital collectible that you truly own and can trade with other players.</p>
      
      <h2>How It Works (Like Pokemon & Yu-Gi-Oh!)</h2>
      <ul>
        <li><svg class="feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="#00ccdd"><path d="M6 2h12c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 2v16h12V4H6z"/><path d="M8 6h8v2H8V6zm0 4h8v2H8v-2zm0 4h4v2H8v-2z"/></svg> <strong>Open Card Packs</strong> - Like opening Pokemon booster packs, but digital!</li>
        <li><svg class="feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="#00ccdd"><path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v12z"/></svg> <strong>Trade with Friends</strong> - Just like swapping Pokemon cards at school!</li>
        <li><svg class="feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="#00ccdd"><path d="M6 2l2 6h8l2-6h-12zm-1.5 7L12 22l7.5-13h-15zM12 9L9 8h6l-3 1z"/></svg> <strong>Collect Rare Cards</strong> - Hunt for holographic and legendary cards</li>
        <li><svg class="feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="#00ccdd"><path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h1v-1c0-3.859-3.141-7-7-7h-4c-3.859 0-7 3.141-7 7v1h1 1v-1c0-2.757 2.243-5 5-5h4c2.757 0 5 2.243 5 5v1z"/></svg> <strong>Battle & Play</strong> - Use your deck like Yu-Gi-Oh! duels</li>
        <li><svg class="feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="#00ccdd"><circle cx="12" cy="12" r="10" stroke="#00ccdd" stroke-width="2" fill="none"/><path d="M9 12l2 2 4-4" stroke="#00ccdd" fill="none"/></svg> <strong>Own Your Cards</strong> - Your digital collectibles are truly yours to keep and trade</li>
      </ul>
      
      <h2>Ready to Start Collecting?</h2>
      <p>Just like getting your first Pokemon starter deck or Yu-Gi-Oh! structure deck, start your HyperPacks journey with the <strong>HYPACK Token Presale</strong> - your gateway to the digital card world!</p>
    `
  },
  {
    id: 'presale',
    title: 'HYPACK Token Presale',
    content: `
      
      <h2>Presale Details</h2>
      <div class="detail-grid">
        <div class="detail-item">
          <h3><svg class="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="#00ccdd"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Exchange Rate</h3>
          <p><strong>1 HYPACK = $0.0005</strong></p>
        </div>
        <div class="detail-item">
          <h3><svg class="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="#00ccdd"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg> Payment Method</h3>
          <p>HYPE tokens (HyperEVM native currency)</p>
        </div>
        <div class="detail-item">
          <h3><svg class="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="#00ccdd"><circle cx="12" cy="12" r="10" stroke="#00ccdd" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="6" stroke="#00ccdd" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="#00ccdd"/></svg> Target</h3>
          <p>3,000 HYPE tokens</p>
        </div>
        <div class="detail-item">
          <h3><svg class="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="#00ccdd"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#00ccdd" stroke-width="2" fill="none"/></svg> Accessibility</h3>
          <p>No whitelist required</p>
        </div>
      </div>
      
      <h2>Presale Benefits</h2>
      <ul>
        <li><svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="#00ccdd"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#00ccdd" stroke-width="2" fill="none"/></svg> Immediate token distribution after presale completion</li>
        <li><svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="#00ccdd"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#00ccdd" stroke-width="2" fill="none"/></svg> Early access to platform features</li>
        <li><svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="#00ccdd"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#00ccdd" stroke-width="2" fill="none"/></svg> Governance voting rights</li>
        <li><svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="#00ccdd"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#00ccdd" stroke-width="2" fill="none"/></svg> Marketplace fee discounts (50% reduction)</li>
        <li><svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="#00ccdd"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#00ccdd" stroke-width="2" fill="none"/></svg> Exclusive platform benefits</li>
      </ul>
    `
  },
  {
    id: 'packs',
    title: 'Card Packs',
    content: `
      <h1>Card Packs & Rarities</h1>
      
      <h2>Pack Types</h2>
      <div class="rarity-grid">
        <div class="rarity-item common">
          <h3><svg class=\"rarity-icon\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"#8B5A2B\"><path d=\"M12,2L13.09,8.26L19,9L14,12L15.18,18L12,15.82L8.82,18L10,12L5,9L10.91,8.26L12,2Z\"/></svg> Common Packs</h3>
          <p>Entry-level packs with basic cards</p>
          <span class="rarity-chance">70% drop rate</span>
        </div>
        <div class="rarity-item rare">
          <h3><svg class=\"rarity-icon\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"#4A90E2\"><path d=\"M6,2L8,8L14,8L16,2L22,6L18,12L22,18L16,22L14,16L8,16L6,22L0,18L4,12L0,6L6,2Z\"/></svg> Rare Packs</h3>
          <p>Enhanced packs with rare cards</p>
          <span class="rarity-chance">20% drop rate</span>
        </div>
        <div class="rarity-item epic">
          <h3><svg class=\"rarity-icon\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"#9B59B6\"><path d=\"M5,16C5,16 10.5,21.5 12,21.5C13.5,21.5 19,16 19,16L19,10L13,4L12,6L11,4L5,10V16Z\"/></svg> Epic Packs</h3>
          <p>Premium packs with epic cards</p>
          <span class="rarity-chance">8% drop rate</span>
        </div>
        <div class="rarity-item legendary">
          <h3><svg class=\"rarity-icon\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"#F39C12\"><path d=\"M7,10L12,4L17,10H20V14H17.74L17,15.27V21H15V16H9V21H7V15.27L6.26,14H4V10H7M12,5.5L8.5,10H15.5L12,5.5Z\"/></svg> Legendary Packs</h3>
          <p>Ultra-rare packs with legendary cards</p>
          <span class="rarity-chance">2% drop rate</span>
        </div>
      </div>
      
      <h2>Pack Mechanics</h2>
      <ul>
        <li>Each pack contains 5-8 randomly generated cards</li>
        <li>Higher rarity packs guarantee at least one rare+ card</li>
        <li>Legendary packs have special artwork and animations</li>
        <li>Cards have unique stats and abilities for gameplay</li>
        <li>All cards are tradeable on the marketplace</li>
      </ul>
    `
  },
  {
    id: 'community-pass',
    title: 'NFT Community Pass',
    content: `
      
      <h2>Pass Details</h2>
      <div class="detail-grid">
        <div class="detail-item">
          <h3><svg class="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Total Supply</h3>
          <p><strong>1,111 passes</strong></p>
        </div>
        <div class="detail-item">
          <h3><svg class="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.1L12 17.7l-5.9 3.4 2.3-7.1-6-4.6h7.6z"/></svg> Pricing</h3>
          <p><strong>Price TBD</strong> - Stay tuned for announcements</p>
        </div>
        <div class="detail-item">
          <h3><svg class="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg> Minting Platform</h3>
          <p><strong>drip.trade</strong> - Official minting partner</p>
        </div>
        <div class="detail-item">
          <h3><svg class="detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="6" stroke="white" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="white"/></svg> Rarity</h3>
          <p><strong>Limited membership</strong></p>
        </div>
      </div>
      
      <h2>Community Pass Benefits</h2>
      <div class="benefits-grid">
        <div class="benefit-item">
          <h3><svg class="benefit-icon" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> VIP Community Access</h3>
          <p>Exclusive Discord channels and community events</p>
        </div>
        <div class="benefit-item">
          <h3><svg class="benefit-icon" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" stroke-width="2" fill="none"/></svg> Early Access</h3>
          <p>First access to new pack releases and features</p>
        </div>
        <div class="benefit-item">
          <h3><svg class="benefit-icon" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg> Enhanced Rewards</h3>
          <p>Higher drop rates and exclusive community rewards</p>
        </div>
        <div class="benefit-item">
          <h3><svg class="benefit-icon" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M7.5 6.5C7.5 8.981 9.519 11 12 11s4.5-2.019 4.5-4.5S14.481 2 12 2 7.5 4.019 7.5 6.5zM20 21h1v-1c0-3.859-3.141-7-7-7h-4c-3.859 0-7 3.141-7 7v1h1 1v-1c0-2.757 2.243-5 5-5h4c2.757 0 5 2.243 5 5v1z"/></svg> Community Governance</h3>
          <p>Voting power on community decisions and platform features</p>
        </div>
        <div class="benefit-item">
          <h3><svg class="benefit-icon" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg> Exclusive Trading</h3>
          <p>Access to exclusive marketplace deals and private trades</p>
        </div>
        <div class="benefit-item">
          <h3><svg class="benefit-icon" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M6 2l2 6h8l2-6h-12zm-1.5 7L12 22l7.5-13h-15zM12 9L9 8h6l-3 1z"/></svg> Special Events</h3>
          <p>Exclusive tournaments and community challenges</p>
        </div>
      </div>
      
      <div class="minting-info">
        <h2>How to Mint</h2>
        <ol>
          <li>Visit <strong>drip.trade</strong> when minting goes live</li>
          <li>Connect your HyperEVM wallet (Chain ID 999)</li>
          <li>Mint your Community Pass NFT</li>
          <li>Join the exclusive HyperPacks VIP community!</li>
        </ol>
      </div>
    `
  },
  {
    id: 'marketplace',
    title: 'Marketplace & Trading',
    content: `
      
      <h2>Trading Features</h2>
      <div class="feature-grid">
        <div class="feature-item">
          <h3><svg class="feature-icon" width="20" height="20" viewBox="0 0 24 24" fill="#00ccdd"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Instant Trading</h3>
          <p>Buy and sell cards instantly with other players</p>
        </div>
        <div class="feature-item">
          <h3><svg class="feature-icon" width="20" height="20" viewBox="0 0 24 24" fill="#00ccdd"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg> Price Discovery</h3>
          <p>Real-time market data and price history</p>
        </div>
        <div class="feature-item">
          <h3><svg class="feature-icon" width="20" height="20" viewBox="0 0 24 24" fill="#00ccdd"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4.5C14.8 4.4 14.6 4.4 14.4 4.4L14 4.5C13.6 4.3 13.1 4.2 12.5 4.2S11.4 4.3 11 4.5L10.6 4.4C10.4 4.4 10.2 4.4 10 4.5L4 7V9C4 10.1 4.9 11 6 11V20C6 21.1 6.9 22 8 22H16C17.1 22 18 21.1 18 20V11C19.1 11 20 10.1 20 9H21ZM16 20H8V18H16V20ZM16 16H8V14H16V16ZM16 12H8V10H16V12Z"/></svg> Secure Escrow</h3>
          <p>Smart contract-based trading for maximum security</p>
        </div>
        <div class="feature-item">
          <h3><svg class="feature-icon" width="20" height="20" viewBox="0 0 24 24" fill="#00ccdd"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg> Advanced Filters</h3>
          <p>Filter by rarity, stats, price, and more</p>
        </div>
      </div>
      
      <h2>Benefits for HYPACK Holders</h2>
      <ul>
        <li>50% discount on marketplace trading fees</li>
        <li>Priority listing for high-value cards</li>
        <li>Access to exclusive marketplace events</li>
        <li>Early access to new card releases</li>
      </ul>
      
      <h2>Benefits for NFT Community Pass Holders</h2>
      <ul>
        <li>VIP marketplace access with exclusive deals</li>
        <li>Higher priority than regular HYPACK holders</li>
        <li>Access to private trading channels</li>
        <li>Exclusive community tournaments and rewards</li>
        <li>First access to limited edition card releases</li>
        <li>Enhanced drop rates for rare pack openings</li>
      </ul>
    `
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    content: `
      
      <h2>5-Step Quick Start Guide</h2>
      
      <div class="steps-grid">
        <div class="step-item">
          <div class="step-number">1</div>
          <h3>Connect Wallet</h3>
          <p>Connect your MetaMask or OKX wallet to HyperEVM network (Chain ID 999)</p>
        </div>
        <div class="step-item">
          <div class="step-number">2</div>
          <h3>Get HYPE Tokens</h3>
          <p>Acquire HYPE tokens (native HyperEVM currency) for transactions</p>
        </div>
        <div class="step-item">
          <div class="step-number">3</div>
          <h3>Join Presale</h3>
          <p>Purchase HYPACK tokens at $0.0005 per token using HYPE tokens</p>
        </div>
        <div class="step-item">
          <div class="step-number">4</div>
          <h3>Buy Card Packs</h3>
          <p>Use HYPACK tokens to purchase and open card packs</p>
        </div>
        <div class="step-item">
          <div class="step-number">5</div>
          <h3>Start Trading</h3>
          <p>Trade cards on the marketplace and compete with other players</p>
        </div>
      </div>
      
      <h2>HyperEVM Network Setup</h2>
      <div class="network-details">
        <div class="network-item"><strong>Chain ID:</strong> 999</div>
        <div class="network-item"><strong>Network Name:</strong> HyperEvm</div>
        <div class="network-item"><strong>RPC URL:</strong> https://rpc.hyperliquid.xyz/evm</div>
        <div class="network-item"><strong>Currency Symbol:</strong> HYPE</div>
        <div class="network-item"><strong>Block Explorer:</strong> https://hyperevmscan.io</div>
      </div>
    `
  },
  {
    id: 'tokenomics',
    title: 'Tokenomics',
    content: `
      
      <h2>Token Utility</h2>
      <div class="utility-grid">
        <div class="utility-item">
          <h3><svg class="utility-icon" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17,10H20A2,2 0 0,1 22,12A2,2 0 0,1 20,14H17V10M16,16A2,2 0 0,1 18,18V20A2,2 0 0,1 16,22H4A2,2 0 0,1 2,20V18A2,2 0 0,1 4,16H16M16,8A2,2 0 0,1 18,6V4A2,2 0 0,1 16,2H4A2,2 0 0,1 2,4V6A2,2 0 0,1 4,8H16Z"/></svg> Governance</h3>
          <p>Vote on platform decisions, feature updates, and community proposals</p>
        </div>
        <div class="utility-item">
          <h3><svg class="utility-icon" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M6,2L10,6L14,2L18,6L22,2V8L18,12L22,16V22L18,18L14,22L10,18L6,22V16L10,12L6,8V2Z"/></svg> Rewards Program</h3>
          <p>Earn rewards through platform participation and activities</p>
        </div>
        <div class="utility-item">
          <h3><svg class="utility-icon" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12,18H6V14H12M21,14V12L20,7H4L3,12V14H4V20H14V14H18V20H20V14M20,4H4V6H20V4Z"/></svg> Marketplace Discounts</h3>
          <p>50% reduction on marketplace trading fees</p>
        </div>
        <div class="utility-item">
          <h3><svg class="utility-icon" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/></svg> Premium Features</h3>
          <p>Access to exclusive features and priority customer support</p>
        </div>
      </div>
      
      <h2>Token Allocation</h2>
      <div class="allocation-simple">
        <div class="allocation-total">
          <strong>Total Supply: 1,000,000,000 HYPACK</strong>
        </div>
        
        <div class="allocation-container">
          <div class="pie-chart">
            <div class="pie-segment segment-1" data-percentage="32.4%"></div>
            <div class="pie-segment segment-2" data-percentage="27.6%"></div>
            <div class="pie-segment segment-3" data-percentage="15%"></div>
            <div class="pie-segment segment-4" data-percentage="10%"></div>
            <div class="pie-segment segment-5" data-percentage="6%"></div>
            <div class="pie-segment segment-6" data-percentage="5%"></div>
            <div class="pie-segment segment-7" data-percentage="4%"></div>
            <div class="pie-center">
              <span class="pie-title">1B</span>
              <span class="pie-subtitle">HYPACK</span>
            </div>
          </div>
          
          <div class="allocation-legend">
            <div class="legend-item">
              <span class="legend-color color-1"></span>
              <span class="legend-text">Public Presale (32.4%)</span>
              <span class="legend-amount">324M</span>
            </div>
            <div class="legend-item">
              <span class="legend-color color-2"></span>
              <span class="legend-text">Platform Development (27.6%)</span>
              <span class="legend-amount">276M</span>
            </div>
            <div class="legend-item">
              <span class="legend-color color-3"></span>
              <span class="legend-text">Team & Advisors (5%)</span>
              <span class="legend-amount">50M</span>
            </div>
            <div class="legend-item">
              <span class="legend-color color-4"></span>
              <span class="legend-text">Community Rewards (10%)</span>
              <span class="legend-amount">100M</span>
            </div>
            <div class="legend-item">
              <span class="legend-color color-5"></span>
              <span class="legend-text">Marketing & Partnerships (6%)</span>
              <span class="legend-amount">60M</span>
            </div>
            <div class="legend-item">
              <span class="legend-color color-6"></span>
              <span class="legend-text">Airdrop Program (15%)</span>
              <span class="legend-amount">150M</span>
            </div>
            <div class="legend-item">
              <span class="legend-color color-7"></span>
              <span class="legend-text">Reserve Fund (4%)</span>
              <span class="legend-amount">40M</span>
            </div>
          </div>
        </div>
      </div>


      <h2>Economic Model</h2>
      <p>
        HYPACK follows a sustainable economic model designed to create long-term value for holders. 
        The token supply is carefully managed with built-in deflationary mechanisms through marketplace fees 
        and pack opening costs, ensuring scarcity and value appreciation over time.
      </p>
    `
  },
  {
    id: 'faq',
    title: 'FAQ',
    content: `
      <div class="faq-simple">
        
        <div class="faq-question">
          <strong>Q: What is HyperPack?</strong>
        </div>
        <div class="faq-answer">
          A: HyperPack is a digital trading card platform where players can collect, trade, and battle with digital cards on the HyperEVM blockchain.
        </div>
        
        <div class="faq-question">
          <strong>Q: How do I participate in the presale?</strong>
        </div>
        <div class="faq-answer">
          A: Connect your wallet to our presale page, ensure you have HYPE tokens, enter the amount you want to spend, and click "Buy Now!" to participate.
        </div>
        
        <div class="faq-question">
          <strong>Q: When will I receive my HYPACK tokens?</strong>
        </div>
        <div class="faq-answer">
          A: HYPACK tokens will be distributed immediately after the presale period ends.
        </div>
        
        <div class="faq-question">
          <strong>Q: What can I do with HYPACK tokens?</strong>
        </div>
        <div class="faq-answer">
          A: Use HYPACK tokens for governance voting, platform rewards, marketplace discounts, buying card packs, and accessing premium features.
        </div>
        
        <div class="faq-question">
          <strong>Q: Are there any fees?</strong>
        </div>
        <div class="faq-answer">
          A: Standard network transaction fees apply. HYPACK holders receive 50% discount on marketplace trading fees.
        </div>
        
        <div class="faq-question">
          <strong>Q: What wallets are supported?</strong>
        </div>
        <div class="faq-answer">
          A: We support MetaMask, OKX Wallet, Coinbase Wallet, Rainbow, and other Web3 wallets that work with HyperEVM.
        </div>
        
      </div>
    `
  },
  {
    id: 'api',
    title: 'API Documentation',
    content: `
      <div class="api-simple">
        
        <p>Build applications and integrations using the HyperPack API.</p>
        
        <div class="api-section">
          <strong>Authentication:</strong> API access requires HYPACK tokens
        </div>
        
        <div class="api-section">
          <strong>Available Endpoints:</strong>
        </div>
        
        <div class="api-endpoint">
          <code>GET /api/cards</code> - Retrieve card data
        </div>
        <div class="api-endpoint">
          <code>GET /api/marketplace</code> - Marketplace listings  
        </div>
        <div class="api-endpoint">
          <code>POST /api/trade</code> - Execute trades
        </div>
        <div class="api-endpoint">
          <code>GET /api/packs</code> - Available pack types
        </div>
        
        <div class="api-note">
          <em>Full API documentation coming soon!</em>
        </div>
        
      </div>
    `
  },
  {
    id: 'help',
    title: 'Help Center',
    content: `
      <div class="help-simple">
        
        <h2>Support & Troubleshooting</h2>
        <p>Need help? We're here to assist you with any questions or issues.</p>
        
        <h2>Common Issues</h2>
        
        <div class="help-question">
          <strong>Issue: Wallet Connection Problems</strong>
        </div>
        <div class="help-answer">
          Solution: Make sure you're connected to the HyperEVM network (Chain ID 999) and have enabled the correct network in your wallet.
        </div>
        
        <div class="help-question">
          <strong>Issue: Transaction Failures</strong>
        </div>
        <div class="help-answer">
          Solution: Ensure you have sufficient HYPE tokens for gas fees and that your wallet is unlocked.
        </div>
        
        <div class="help-question">
          <strong>Issue: Missing Tokens</strong>
        </div>
        <div class="help-answer">
          Solution: If your tokens don't appear, check that you've added the HYPACK token contract to your wallet.
        </div>
        
        <h2>Contact Support</h2>
        <p>For additional help, reach out to our community on <strong>Discord</strong>.</p>
        
      </div>
    `
  },
  {
    id: 'changelog',
    title: 'Changelog',
    content: `
      <div class="changelog-simple">
        
        <p>Track the latest updates and upcoming features for the HyperPack platform.</p>
        
        <div class="changelog-section">
          <strong>Version 1.0.0 - Launch (Completed)</strong>
        </div>
        <div class="changelog-item">• HYPACK token presale launch</div>
        <div class="changelog-item">• HyperEVM network integration</div>
        <div class="changelog-item">• Wallet connection system</div>
        <div class="changelog-item">• Documentation website</div>
        
        <div class="changelog-section">
          <strong>Version 1.1.0 - Card Packs (In Progress)</strong>
        </div>
        <div class="changelog-item">• Pack opening mechanics</div>
        <div class="changelog-item">• Card rarity system</div>
        <div class="changelog-item">• Marketplace trading</div>
        <div class="changelog-item">• Card collection interface</div>
        
        <div class="changelog-section">
          <strong>Version 1.2.0 - Gaming (Planned)</strong>
        </div>
        <div class="changelog-item">• Battle system</div>
        <div class="changelog-item">• Tournament features</div>
        <div class="changelog-item">• Leaderboards</div>
        <div class="changelog-item">• Rewards system</div>
        
      </div>
    `
  }
];

const Docs = () => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const currentPage = docPages[currentPageIndex];
  
  const goToNextPage = () => {
    if (currentPageIndex < docPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  return (
    <div className="gitbook-page">
      {/* Header */}
      <header className="gitbook-header">
        <div className="header-container">
          <h1 className="header-title">HyperPack Documentation</h1>
        </div>
      </header>

      {/* Banner for Welcome page - outside container */}
      {currentPageIndex === 0 && (
        <section className="banner-section">
          <img 
            src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeidregjjs577tozk7nw3mod3kov24wy54k2cqjtkuh6556ccnsft6u" 
            alt="HyperPack Banner" 
            className="banner-image"
          />
        </section>
      )}

      {/* Main Content */}
      <main className="gitbook-main">
        <div className="gitbook-container">
          <div className="page-title">{currentPage.title}</div>
          <div className="gitbook-content" dangerouslySetInnerHTML={{ __html: currentPage.content }} />
          
          {/* Page Navigation */}
          <div className="page-navigation">
            {currentPageIndex > 0 && (
              <button onClick={goToPrevPage} className="nav-btn prev">
                ← Previous
                <div className="nav-title">{docPages[currentPageIndex - 1].title}</div>
              </button>
            )}
            
            {currentPageIndex < docPages.length - 1 && (
              <button onClick={goToNextPage} className="nav-btn next">
                Next →
                <div className="nav-title">{docPages[currentPageIndex + 1].title}</div>
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Docs;