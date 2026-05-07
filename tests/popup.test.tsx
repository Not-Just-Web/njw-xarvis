import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PopupApp } from '@ai/extension/popup/App';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock chrome APIs
const mockOpen = vi.fn().mockResolvedValue(undefined);
const mockSendMessage = vi.fn();
let isConnected = false;
vi.stubGlobal('chrome', {
  tabs: {
    query: vi.fn().mockResolvedValue([{ windowId: 1 }])
  },
  runtime: {
    sendMessage: mockSendMessage
  },
  sidePanel: {
    open: mockOpen
  }
});

describe('PopupApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isConnected = false;

    mockSendMessage.mockImplementation(async (message: { type: string }) => {
      if (message.type === 'provider.setActive') {
        return { type: 'response', payload: { ok: true } };
      }

      if (message.type === 'provider.getAuthStatus') {
        return { type: 'response', payload: { ok: true, connected: isConnected } };
      }

      if (message.type === 'provider.connect') {
        isConnected = true;
        return { type: 'response', payload: { ok: true, connected: true } };
      }

      if (message.type === 'provider.disconnect') {
        isConnected = false;
        return { type: 'response', payload: { ok: true, connected: false } };
      }

      return { type: 'response', payload: { ok: true } };
    });
  });

  it('renders without crashing', () => {
    render(<PopupApp />);
    expect(screen.getByText('Quick Launch')).toBeDefined();
  });

  it('renders provider select with three options', () => {
    render(<PopupApp />);
    const select = screen.getByLabelText('Provider') as HTMLSelectElement;
    expect(select.options.length).toBe(3);
    expect(select.value).toBe('gemini');
  });

  it('changes provider on select change', () => {
    render(<PopupApp />);
    const select = screen.getByLabelText('Provider') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'claude' } });
    expect((screen.getByLabelText('Provider') as HTMLSelectElement).value).toBe('claude');
  });

  it('shows provider badge in uppercase', () => {
    render(<PopupApp />);
    expect(screen.getByText('GEMINI')).toBeDefined();
  });

  it('updates badge when provider changes', () => {
    render(<PopupApp />);
    const select = screen.getByLabelText('Provider') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'claude' } });
    expect(screen.getByText('CLAUDE')).toBeDefined();
  });

  it('shows connect flow when provider is not connected', async () => {
    render(<PopupApp />);
    expect(screen.getByPlaceholderText('Enter API key')).toBeDefined();
    expect(screen.getByText('Connect')).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText('Not connected')).toBeDefined();
    });
  });

  it('connects provider and then shows Open Sidepanel button', async () => {
    render(<PopupApp />);

    fireEvent.change(screen.getByPlaceholderText('Enter API key'), {
      target: { value: 'test-key' }
    });

    fireEvent.click(screen.getByText('Connect'));

    await waitFor(() => {
      expect(screen.getByText('Open Sidepanel')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Open Sidepanel'));

    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith({ windowId: 1 });
    });
  });

  it('shows status message after opening sidepanel', async () => {
    render(<PopupApp />);

    fireEvent.change(screen.getByPlaceholderText('Enter API key'), {
      target: { value: 'test-key' }
    });
    fireEvent.click(screen.getByText('Connect'));

    await waitFor(() => {
      expect(screen.getByText('Open Sidepanel')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Open Sidepanel'));

    await waitFor(() => {
      expect(screen.getByText('Sidepanel opened')).toBeDefined();
    });
  });

  it('shows error status when sidepanel fails to open', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Tab error'));

    render(<PopupApp />);

    fireEvent.change(screen.getByPlaceholderText('Enter API key'), {
      target: { value: 'test-key' }
    });
    fireEvent.click(screen.getByText('Connect'));

    await waitFor(() => {
      expect(screen.getByText('Open Sidepanel')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Open Sidepanel'));

    await waitFor(() => {
      expect(screen.getByText('Could not open sidepanel')).toBeDefined();
    });
  });
});
