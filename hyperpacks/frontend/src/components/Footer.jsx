import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [showToast, setShowToast] = useState(false);

  const handleDiscordClick = (e) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <>
      {/* Footer */}
      <footer className="social-footer">
        <div className="social-icons">
          <a href="https://x.com/hypack_xyz" target="_blank" rel="noopener noreferrer" className="social-link twitter-icon">
            X
          </a>
          <a href="https://t.me/HyperPack_xyz" target="_blank" rel="noopener noreferrer" className="social-link telegram-icon">
            Telegram
          </a>
          <a href="#" onClick={handleDiscordClick} className="social-link discord-icon">
            Discord
          </a>
          <Link to="/docs" className="social-link docs-icon">
            Docs
          </Link>
        </div>
        <div className="copyright">
          © 2025 HyperPack
        </div>
      </footer>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast">
          Coming Soon
        </div>
      )}
    </>
  );
};

export default Footer;