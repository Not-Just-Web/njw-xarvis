import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PopupApp } from '@ai/extension/popup/App';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock chrome APIs
const mockOpen = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal('chrome', {
  tabs: {
    query: vi.fn().mockResolvedValue([{ windowId: 1 }])
  },
  sidePanel: {
    open: mockOpen
  }
});

describe('PopupApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PopupApp />);
    expect(screen.getByText('Quick Launch')).toBeDefined();
  });

  it('renders provider select with three options', () => {
    render(<PopupApp />);
    const select = screen.getByLabelText('Provider') as HTMLSelectElement;
    expect(select.options.length).toBe(3);
    expect(select.value).toBe('Gemini');
  });

  it('changes provider on select change', () => {
    render(<PopupApp />);
    const select = screen.getByLabelText('Provider') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Claude' } });
    expect((screen.getByLabelText('Provider') as HTMLSelectElement).value).toBe('Claude');
  });

  it('shows provider badge in uppercase', () => {
    render(<PopupApp />);
    expect(screen.getByText('GEMINI')).toBeDefined();
  });

  it('updates badge when provider changes', () => {
    render(<PopupApp />);
    const select = screen.getByLabelText('Provider') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Claude' } });
    expect(screen.getByText('CLAUDE')).toBeDefined();
  });

  it('shows Open Sidepanel button', () => {
    render(<PopupApp />);
    expect(screen.getByText('Open Sidepanel')).toBeDefined();
  });

  it('calls chrome.sidePanel.open when button clicked', async () => {
    render(<PopupApp />);
    fireEvent.click(screen.getByText('Open Sidepanel'));
    await waitFor(() => {
      expect(mockOpen).toHaveBeenCalledWith({ windowId: 1 });
    });
  });

  it('shows status message after opening sidepanel', async () => {
    render(<PopupApp />);
    fireEvent.click(screen.getByText('Open Sidepanel'));
    await waitFor(() => {
      expect(screen.getByText('Sidepanel opened')).toBeDefined();
    });
  });

  it('shows error status when sidepanel fails to open', async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Tab error'));
    render(<PopupApp />);
    fireEvent.click(screen.getByText('Open Sidepanel'));
    await waitFor(() => {
      expect(screen.getByText('Could not open sidepanel')).toBeDefined();
    });
  });
});
