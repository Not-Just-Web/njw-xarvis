import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ProviderStatus } from '@ai/extension/sidepanel/components/ProviderStatus';

describe('ProviderStatus', () => {
  const baseProps = {
    providerId: 'gemini',
    displayName: 'Google Gemini',
    status: 'disconnected' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders provider display name', () => {
    render(<ProviderStatus {...baseProps} />);
    expect(screen.getByText('Google Gemini')).toBeDefined();
  });

  it('shows disconnected status text and icon', () => {
    render(<ProviderStatus {...baseProps} status="disconnected" />);
    expect(screen.getByText('Not Connected')).toBeDefined();
    expect(screen.getByText('⭕')).toBeDefined();
  });

  it('shows connected status text and icon', () => {
    render(<ProviderStatus {...baseProps} status="connected" />);
    expect(screen.getByText('Connected')).toBeDefined();
    expect(screen.getByText('✅')).toBeDefined();
  });

  it('shows connecting status text and icon', () => {
    render(<ProviderStatus {...baseProps} status="connecting" />);
    expect(screen.getByText('Connecting...')).toBeDefined();
    expect(screen.getByText('⏳')).toBeDefined();
  });

  it('shows error status text and icon', () => {
    render(<ProviderStatus {...baseProps} status="error" />);
    expect(screen.getByText('Error')).toBeDefined();
    expect(screen.getByText('❌')).toBeDefined();
  });

  it('shows Setup button when disconnected and onSetup provided', () => {
    const onSetup = vi.fn();
    render(<ProviderStatus {...baseProps} status="disconnected" onSetup={onSetup} />);
    expect(screen.getByText('Setup')).toBeDefined();
  });

  it('calls onSetup when Setup button is clicked', () => {
    const onSetup = vi.fn();
    render(<ProviderStatus {...baseProps} status="disconnected" onSetup={onSetup} />);
    fireEvent.click(screen.getByText('Setup'));
    expect(onSetup).toHaveBeenCalledOnce();
  });

  it('does not show Setup button when no onSetup provided', () => {
    render(<ProviderStatus {...baseProps} status="disconnected" />);
    expect(screen.queryByText('Setup')).toBeNull();
  });

  it('shows Disconnect button when connected and onDisconnect provided', () => {
    const onDisconnect = vi.fn();
    render(<ProviderStatus {...baseProps} status="connected" onDisconnect={onDisconnect} />);
    expect(screen.getByText('Disconnect')).toBeDefined();
  });

  it('calls onDisconnect when Disconnect button is clicked', () => {
    const onDisconnect = vi.fn();
    render(<ProviderStatus {...baseProps} status="connected" onDisconnect={onDisconnect} />);
    fireEvent.click(screen.getByText('Disconnect'));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it('shows error message when status is error', () => {
    render(<ProviderStatus {...baseProps} status="error" errorMessage="API key invalid" />);
    expect(screen.getByText('API key invalid')).toBeDefined();
  });

  it('does not show error message when status is not error', () => {
    render(<ProviderStatus {...baseProps} status="connected" errorMessage="API key invalid" />);
    expect(screen.queryByText('API key invalid')).toBeNull();
  });
});
