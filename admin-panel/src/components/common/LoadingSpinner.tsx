import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  text,
  variant = 'primary',
  className = '',
}) => {
  const sizeClass = {
    small: 'spinner-border-sm',
    medium: '',
    large: 'spinner-border-lg',
  };

  const spinnerClass = `spinner-border text-${variant} ${sizeClass[size]} ${className}`;

  return (
    <div className="d-flex flex-column align-items-center">
      <div className={spinnerClass} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <div className="mt-2 text-muted">
          {text}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
