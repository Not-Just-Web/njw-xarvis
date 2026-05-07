/**
 * Provider Status Component
 * Displays authentication status and health for each provider
 */

import React from 'react';

interface ProviderStatusProps {
  providerId: string;
  displayName: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
  onSetup?: () => void;
  onDisconnect?: () => void;
}

export const ProviderStatus: React.FC<ProviderStatusProps> = ({
  providerId: _providerId,
  displayName,
  status,
  errorMessage,
  onSetup,
  onDisconnect
}) => {
  const getStatusIcon = (): string => {
    switch (status) {
      case 'connected':
        return '✅';
      case 'connecting':
        return '⏳';
      case 'error':
        return '❌';
      case 'disconnected':
      default:
        return '⭕';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      case 'disconnected':
      default:
        return 'Not Connected';
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'connected':
        return '#10b981';
      case 'connecting':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      case 'disconnected':
      default:
        return '#9ca3af';
    }
  };

  return (
    <div className="provider-status" style={{ borderColor: getStatusColor() }}>
      <div className="status-header">
        <div className="status-info">
          <span className="status-icon">{getStatusIcon()}</span>
          <div className="provider-info">
            <h4 className="provider-name">{displayName}</h4>
            <span className="status-text" style={{ color: getStatusColor() }}>
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="status-actions">
          {status === 'disconnected' && onSetup && (
            <button onClick={onSetup} className="action-button setup-button">
              Setup
            </button>
          )}
          {status === 'connected' && onDisconnect && (
            <button onClick={onDisconnect} className="action-button disconnect-button">
              Disconnect
            </button>
          )}
        </div>
      </div>

      {status === 'error' && errorMessage && (
        <div className="error-message">
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default ProviderStatus;
