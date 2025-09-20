import React from 'react';

const ProgressBar = ({ 
  percentage = 0, 
  raised = 0, 
  goal = 0, 
  loading = false,
  className = "" 
}) => {
  const clampedPercent = Math.min(percentage, 100);
  
  if (loading) {
    return (
      <div className={`progress-container ${className}`}>
        <div className="progress-skeleton">
          <div className="skeleton-bar"></div>
          <div className="skeleton-text"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`progress-container ${className}`}>
      <div className="progress-header">
        <span className="progress-title">Presale Progress</span>
        <span className="progress-percentage">{percentage}%</span>
      </div>
      
      <div className="progress-bar-bg">
        <div 
          className="progress-bar-fill"
          style={{ width: `${clampedPercent}%` }}
        >
          <div className="progress-shine"></div>
        </div>
      </div>
      
      <div className="progress-stats">
        <span className="raised">{raised.toLocaleString()} HYPE raised</span>
        <span className="goal">of {goal.toLocaleString()} HYPE goal</span>
      </div>
    </div>
  );
};

export default ProgressBar;