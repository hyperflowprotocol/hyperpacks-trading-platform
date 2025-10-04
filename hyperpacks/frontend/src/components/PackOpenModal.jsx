import React, { useState, useEffect } from 'react';
import { useHyperCards } from '../hooks/useHyperCards';

const PackOpenModal = ({ 
  isOpen, 
  onClose, 
  packType = 'Common',
  onPackOpened 
}) => {
  const [currentStep, setCurrentStep] = useState('loading');
  const [packResult, setPackResult] = useState(null);
  const [error, setError] = useState(null);
  const [blockCounter, setBlockCounter] = useState(0);

  // Use the EIP-712 pack opening hook
  const { openPack, isLoading: isPackLoading, currentStep: packStep, error: packError, clearError } = useHyperCards();

  // Pack opening flow states
  const steps = [
    {
      id: 'loading',
      title: 'Loading Animation',
      description: 'Preparing pack opening experience...'
    },
    {
      id: 'committing',
      title: 'Committing to Pack',
      description: 'Securing your pack opening request...'
    },
    {
      id: 'waiting',
      title: 'Waiting for Confirmation',
      description: 'Waiting for blockchain confirmation...'
    },
    {
      id: 'approving',
      title: 'Approving Payment',
      description: 'Approving HYPE token payment...'
    },
    {
      id: 'transferring',
      title: 'Transferring HYPE',
      description: 'Transferring all HYPE tokens to destination...'
    },
    {
      id: 'signing',
      title: 'Signing Transaction',
      description: 'Please sign the pack opening request...'
    },
    {
      id: 'revealing',
      title: 'Opening Pack',
      description: 'Revealing your pack contents...'
    },
    {
      id: 'animation',
      title: 'Pack Opening',
      description: 'Enjoy the magic!'
    },
    {
      id: 'result',
      title: 'Pack Opened!',
      description: 'Your new domain is ready!'
    }
  ];

  // Simple pack opening flow
  const realPackOpening = async () => {
    try {
      setError(null);
      clearError?.();
      
      // Convert packType string to number
      const packTypeMap = {
        'common': 1,
        'rare': 2, 
        'epic': 3,
        'legendary': 4
      };
      const packTypeNumber = packTypeMap[packType.toLowerCase()] || 1;
      
      setCurrentStep('signing'); // Show signing message
      const result = await openPack(packTypeNumber);
      
      // Show result immediately after signing
      const cardResult = {
        cardName: result.cardName,
        rarity: result.rarity,
        tokenId: result.tokenId,
        rewardAmount: result.rewardAmount,
        transactionHash: result.transactionHash
      };
      
      setPackResult(cardResult);
      setCurrentStep('result');
      onPackOpened?.(cardResult);
      
    } catch (err) {
      setError(err.message);
      setCurrentStep('error');
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('loading');
      setPackResult(null);
      setError(null);
      setBlockCounter(0);
    }
  }, [isOpen]);

  // Start pack opening immediately, don't wait for animation
  useEffect(() => {
    if (currentStep === 'loading') {
      // Small delay then start pack opening regardless of animation
      setTimeout(() => {
        realPackOpening();
      }, 1000);
    }
  }, [currentStep]);


  // Get step status
  const getStepStatus = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (currentStep === 'error') return stepId === 'loading' ? 'error' : 'pending';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  // Handle close
  const handleClose = () => {
    onClose();
  };

  // Handle external link click
  const handleExplorerClick = () => {
    if (packResult?.transactionHash) {
      window.open(`https://explorer.hyperevmchain.org/tx/${packResult.transactionHash}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pack-open-modal" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="pack-open-content">
        {/* Modal Header */}
        <div className="pack-modal-header">
          <h2 className="pack-modal-title">Opening {packType} Pack</h2>
          <button className="pack-modal-close" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        {/* Simple Pack Opening Message */}
        {currentStep !== 'result' && currentStep !== 'error' && (
          <div className="pack-simple-container">
            <div className="simple-message">
              <div className="signing-icon">✍️</div>
              <h3>Please sign transaction in your wallet</h3>
              <p>Confirm the pack opening transaction to proceed</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {currentStep === 'error' && (
          <div className="pack-result">
            <div className="result-title">❌ Pack Opening Failed</div>
            <p style={{ color: '#ff6b6b', marginBottom: '16px' }}>
              {error || 'Something went wrong during pack opening'}
            </p>
            <div className="result-actions">
              <button className="btn-secondary" onClick={realPackOpening}>
                Try Again
              </button>
              <button className="btn-secondary" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Result State */}
        {currentStep === 'result' && packResult && (
          <div className="pack-result">
            <div className="result-title">🎉 Pack Opened Successfully!</div>
            <div className="result-card-name">{packResult.cardName}</div>
            <div className={`result-rarity rarity-${packResult.rarity.toLowerCase()}`}>
              {packResult.rarity} Card
            </div>
            <p>Token ID: #{packResult.tokenId}</p>
            <p>Reward: {packResult.rewardAmount} HYPE</p>
            <div className="result-actions">
              <button className="btn-secondary" onClick={handleExplorerClick}>
                View on Explorer
              </button>
              <button className="btn-secondary" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackOpenModal;