import React, { useState, useEffect, useRef } from 'react';

const IpfsMedia = ({ 
  ipfsHash, 
  alt = "IPFS Content", 
  className = "",
  autoPlay = true,
  muted = true,
  playsInline = true,
  loop = false,
  onLoadStart,
  onLoaded,
  onError,
  onEnded,
  style = {}
}) => {
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mediaType, setMediaType] = useState(null);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const mediaRef = useRef(null);
  const hasTriedAutoplay = useRef(false);

  // IPFS gateway fallback order - optimized for video content
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.lighthouse.storage/ipfs/',
    'https://dweb.link/ipfs/',
    'https://4everland.io/ipfs/'
  ];

  const currentUrl = `${gateways[currentGatewayIndex]}${ipfsHash}`;

  // Detect media type - assume video for pack opening animation
  const detectMediaType = async (url) => {
    try {
      // For pack opening animation, default to video since we know it's an MP4
      if (ipfsHash === 'bafybeidregjjs577tozk7nw3mod3kov24wy54k2cqjtkuh6556ccnsft6u') {
        return 'video';
      }
      
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.startsWith('video/')) {
        return 'video';
      } else if (contentType.startsWith('image/gif') || url.toLowerCase().includes('.gif')) {
        return 'gif';
      } else if (contentType.startsWith('image/')) {
        return 'image';
      }
      
      return 'video'; // Default for pack animations
    } catch {
      return 'video'; // Default assumption for pack opening animations
    }
  };

  // Try next gateway on error
  const tryNextGateway = () => {
    if (currentGatewayIndex < gateways.length - 1) {
      setCurrentGatewayIndex(prev => prev + 1);
      setHasError(false);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
      onError?.(new Error('All IPFS gateways failed'));
    }
  };

  // Handle media load success
  const handleLoadSuccess = () => {
    setIsLoading(false);
    setHasError(false);
    onLoaded?.();
  };

  // Handle media load error
  const handleLoadError = () => {
    console.warn(`IPFS gateway failed: ${gateways[currentGatewayIndex]}`);
    tryNextGateway();
  };

  // Handle play attempt for video/gif
  const handlePlayAttempt = async () => {
    if (!mediaRef.current || mediaType === 'image') return;

    try {
      await mediaRef.current.play();
      setShowPlayButton(false);
    } catch (error) {
      console.log('Autoplay blocked, showing play button');
      setShowPlayButton(true);
    }
  };

  // Manual play button click
  const handlePlayClick = async () => {
    try {
      await mediaRef.current?.play();
      setShowPlayButton(false);
    } catch (error) {
      console.error('Failed to play media:', error);
    }
  };

  // Initialize media type detection
  useEffect(() => {
    const initializeMedia = async () => {
      setIsLoading(true);
      onLoadStart?.();
      
      const type = await detectMediaType(currentUrl);
      setMediaType(type);
    };

    if (ipfsHash) {
      initializeMedia();
    }
  }, [ipfsHash, currentUrl]);

  // Handle autoplay attempt for video/gif
  useEffect(() => {
    if (mediaType && (mediaType === 'video' || mediaType === 'gif') && 
        autoPlay && !hasTriedAutoplay.current && !isLoading && !hasError) {
      hasTriedAutoplay.current = true;
      // Small delay to ensure media is ready
      setTimeout(handlePlayAttempt, 100);
    }
  }, [mediaType, autoPlay, isLoading, hasError]);

  if (!ipfsHash) {
    return <div className="ipfs-media-error">No IPFS hash provided</div>;
  }

  if (hasError) {
    return (
      <div className="ipfs-media-error">
        <p>Failed to load content from IPFS</p>
        <small>Hash: {ipfsHash}</small>
      </div>
    );
  }

  return (
    <div className={`ipfs-media-container ${className}`} style={style}>
      {isLoading && (
        <div className="ipfs-media-loading">
          <div className="loading-spinner"></div>
          <p>Loading animation...</p>
        </div>
      )}
      
      {mediaType === 'video' && (
        <video
          ref={mediaRef}
          src={currentUrl}
          alt={alt}
          muted={muted}
          playsInline={playsInline}
          loop={loop}
          controls={false}
          onLoadedData={handleLoadSuccess}
          onError={handleLoadError}
          onEnded={onEnded}
          style={{ opacity: isLoading ? 0 : 1 }}
        />
      )}
      
      {(mediaType === 'gif' || mediaType === 'image') && (
        <img
          ref={mediaRef}
          src={currentUrl}
          alt={alt}
          onLoad={handleLoadSuccess}
          onError={handleLoadError}
          style={{ opacity: isLoading ? 0 : 1 }}
        />
      )}
      
      {showPlayButton && (mediaType === 'video' || mediaType === 'gif') && (
        <button 
          className="ipfs-media-play-button"
          onClick={handlePlayClick}
          aria-label="Play animation"
        >
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.6)"/>
            <polygon points="10,8 16,12 10,16" fill="white"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default IpfsMedia;