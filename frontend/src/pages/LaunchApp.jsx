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

// Pack Tearing Animation Component
const PackOpenModal = ({ isOpen, onClose, packType, onPackOpened }) => {
  const [animationStep, setAnimationStep] = useState('ready'); // ready, tearing, cards, result
  const [openedCards, setOpenedCards] = useState([]);

  // Mock card data for demonstration
  const generateMockCards = () => {
    const cardNames = ['Fire Dragon', 'Ice Wizard', 'Lightning Bolt', 'Healing Potion', 'Shadow Assassin', 'Golden Shield', 'Crystal Orb', 'Thunder Strike'];
    const rarities = ['common', 'rare', 'epic', 'legendary'];
    const cards = [];
    
    for (let i = 0; i < Math.floor(Math.random() * 4) + 5; i++) { // 5-8 cards
      cards.push({
        id: Math.random().toString(36).substr(2, 9),
        name: cardNames[Math.floor(Math.random() * cardNames.length)],
        rarity: rarities[Math.floor(Math.random() * rarities.length)],
        image: 'https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4'
      });
    }
    return cards;
  };

  const startPackOpening = () => {
    setAnimationStep('tearing');
    
    // After tearing animation (2 seconds), show cards
    setTimeout(() => {
      const cards = generateMockCards();
      setOpenedCards(cards);
      setAnimationStep('cards');
      
      // After cards animation (3 seconds), show result
      setTimeout(() => {
        setAnimationStep('result');
        onPackOpened?.(cards);
      }, 3000);
    }, 2000);
  };

  const handleClose = () => {
    setAnimationStep('ready');
    setOpenedCards([]);
    onClose();
  };

  React.useEffect(() => {
    if (isOpen) {
      setAnimationStep('ready');
      setOpenedCards([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div className="pack-tear-modal" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="pack-tear-content">
        {/* Modal Header */}
        <div className="pack-modal-header">
          <h2 className="pack-modal-title">Opening {packType} Pack</h2>
          <button className="pack-modal-close" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        {/* Pack Animation Area */}
        <div className="pack-tear-animation">
          {animationStep === 'ready' && (
            <div className="pack-ready">
              <div className="pack-image-container">
                <img 
                  src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" 
                  alt={`${packType} Pack`}
                  className="pack-image-whole"
                />
                <div className="pack-glow"></div>
              </div>
              <button className="tear-pack-btn" onClick={startPackOpening}>
                Click to Tear Open! 🎁
              </button>
            </div>
          )}

          {animationStep === 'tearing' && (
            <div className="pack-tearing">
              <div className="pack-left-half">
                <img 
                  src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" 
                  alt="Pack Left"
                  className="pack-half-image"
                />
              </div>
              <div className="pack-right-half">
                <img 
                  src="https://amethyst-defensive-marsupial-68.mypinata.cloud/ipfs/bafybeiegruw7b6bwsx54hisfg6rgb2pf52pxy6gnnhx2otqmhwcdrc2ga4" 
                  alt="Pack Right"
                  className="pack-half-image"
                />
              </div>
              <div className="tearing-effect">
                <div className="tear-line"></div>
                <div className="sparks"></div>
              </div>
            </div>
          )}

          {animationStep === 'cards' && (
            <div className="cards-falling">
              {openedCards.map((card, index) => (
                <div 
                  key={card.id} 
                  className={`falling-card rarity-${card.rarity}`}
                  style={{ 
                    '--delay': `${index * 0.2}s`,
                    '--x-offset': `${(index - openedCards.length/2) * 60}px`
                  }}
                >
                  <img src={card.image} alt={card.name} />
                  <div className="card-info">
                    <div className="card-name">{card.name}</div>
                    <div className={`card-rarity rarity-${card.rarity}`}>{card.rarity}</div>
                  </div>
                </div>
              ))}
              <div className="card-sparkles"></div>
            </div>
          )}

          {animationStep === 'result' && (
            <div className="pack-result">
              <div className="result-title">🎉 Pack Opened Successfully!</div>
              <div className="opened-cards-grid">
                {openedCards.map((card) => (
                  <div key={card.id} className={`result-card rarity-${card.rarity}`}>
                    <img src={card.image} alt={card.name} />
                    <div className="card-details">
                      <div className="card-name">{card.name}</div>
                      <div className={`card-rarity rarity-${card.rarity}`}>{card.rarity}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="result-stats">
                <p>You opened {openedCards.length} cards!</p>
                <p>Rarest: {openedCards.find(c => c.rarity === 'legendary')?.name || openedCards.find(c => c.rarity === 'epic')?.name || 'Rare card'}</p>
              </div>
              <button className="btn-secondary" onClick={handleClose}>
                Close
              </button>
            </div>
          )}
        </div>
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