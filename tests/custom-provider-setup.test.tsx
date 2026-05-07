import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomProviderSetup } from '../../extension/sidepanel/components/CustomProviderSetup';
import type { CustomProviderDefinition } from '../../shared/provider-contract/custom-provider';

describe('CustomProviderSetup', () => {
  const mockOnAddProvider = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('form rendering', () => {
    it('should render the form initially', () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Add Custom Provider')).toBeInTheDocument();
      expect(screen.getByLabelText('Provider ID')).toBeInTheDocument();
      expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
      expect(screen.getByLabelText('API Endpoint')).toBeInTheDocument();
      expect(screen.getByLabelText('Authentication Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Model Names')).toBeInTheDocument();
    });

    it('should have all form fields', () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThanOrEqual(3); // id, display name, endpoint, models
    });

    it('should have capability checkboxes', () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText('Supports vision / image input')).toBeInTheDocument();
      expect(screen.getByLabelText('Supports tool/function calling')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should validate provider ID format', async () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      const idInput = screen.getByLabelText('Provider ID') as HTMLInputElement;
      fireEvent.change(idInput, { target: { value: 'Invalid_ID' } });

      expect(idInput.pattern).toBe('^[a-z0-9-]+$');
    });

    it('should show next button to proceed to confirm screen', () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Next: Review')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should proceed to confirm screen on valid form submission', async () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      // Fill out form
      fireEvent.change(screen.getByLabelText('Provider ID'), {
        target: { value: 'test-provider' },
      });
      fireEvent.change(screen.getByLabelText('Display Name'), {
        target: { value: 'Test Provider' },
      });
      fireEvent.change(screen.getByLabelText('API Endpoint'), {
        target: { value: 'https://api.example.com' },
      });
      fireEvent.change(screen.getByLabelText('Model Names'), {
        target: { value: 'model-a, model-b' },
      });

      // Submit form
      fireEvent.click(screen.getByText('Next: Review'));

      // Should show confirm screen
      await waitFor(() => {
        expect(screen.getByText('Review Custom Provider')).toBeInTheDocument();
      });
    });

    it('should show error on invalid submission', async () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      // Try to submit without filling form
      fireEvent.click(screen.getByText('Next: Review'));

      // Should show validation error
      await waitFor(() => {
        expect(screen.queryByText(/required|must be/i)).toBeInTheDocument();
      });
    });
  });

  describe('confirm screen', () => {
    it('should display provider summary', async () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByLabelText('Provider ID'), {
        target: { value: 'test-provider' },
      });
      fireEvent.change(screen.getByLabelText('Display Name'), {
        target: { value: 'Test Provider' },
      });
      fireEvent.change(screen.getByLabelText('API Endpoint'), {
        target: { value: 'https://api.example.com' },
      });
      fireEvent.change(screen.getByLabelText('Model Names'), {
        target: { value: 'model-a' },
      });

      fireEvent.click(screen.getByText('Next: Review'));

      await waitFor(() => {
        expect(screen.getByText('Review Custom Provider')).toBeInTheDocument();
        expect(screen.getByText('Test Provider')).toBeInTheDocument();
        expect(screen.getByText(/https:\/\/api\.example\.com/)).toBeInTheDocument();
      });
    });

    it('should allow going back to form', async () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByLabelText('Provider ID'), {
        target: { value: 'test-provider' },
      });
      fireEvent.change(screen.getByLabelText('Display Name'), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText('API Endpoint'), {
        target: { value: 'https://api.example.com' },
      });
      fireEvent.change(screen.getByLabelText('Model Names'), {
        target: { value: 'model-a' },
      });

      fireEvent.click(screen.getByText('Next: Review'));

      await waitFor(() => {
        expect(screen.getByText('Review Custom Provider')).toBeInTheDocument();
      });

      // Click back button
      const backButtons = screen.getAllByText('Back');
      fireEvent.click(backButtons[0]);

      // Should return to form
      await waitFor(() => {
        expect(screen.getByText('Add Custom Provider')).toBeInTheDocument();
      });
    });

    it('should call onAddProvider when confirmed', async () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByLabelText('Provider ID'), {
        target: { value: 'test-provider' },
      });
      fireEvent.change(screen.getByLabelText('Display Name'), {
        target: { value: 'Test Provider' },
      });
      fireEvent.change(screen.getByLabelText('API Endpoint'), {
        target: { value: 'https://api.example.com' },
      });
      fireEvent.change(screen.getByLabelText('Model Names'), {
        target: { value: 'model-a' },
      });

      fireEvent.click(screen.getByText('Next: Review'));

      await waitFor(() => {
        expect(screen.getByText(/Add Provider/)).toBeInTheDocument();
      });

      mockOnAddProvider.mockResolvedValue(undefined);

      const addButton = screen.getByText(/^Add Provider$/);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnAddProvider).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'test-provider',
            displayName: 'Test Provider',
            endpoint: 'https://api.example.com',
          })
        );
      });
    });
  });

  describe('success screen', () => {
    it('should show success message after adding provider', async () => {
      mockOnAddProvider.mockResolvedValue(undefined);

      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByLabelText('Provider ID'), {
        target: { value: 'test-provider' },
      });
      fireEvent.change(screen.getByLabelText('Display Name'), {
        target: { value: 'Test Provider' },
      });
      fireEvent.change(screen.getByLabelText('API Endpoint'), {
        target: { value: 'https://api.example.com' },
      });
      fireEvent.change(screen.getByLabelText('Model Names'), {
        target: { value: 'model-a' },
      });

      fireEvent.click(screen.getByText('Next: Review'));

      await waitFor(() => {
        expect(screen.getByText(/Add Provider/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/^Add Provider$/));

      await waitFor(() => {
        expect(screen.getByText(/Provider Added Successfully/)).toBeInTheDocument();
      });
    });

    it('should close after success timeout', async () => {
      vi.useFakeTimers();
      mockOnAddProvider.mockResolvedValue(undefined);

      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByLabelText('Provider ID'), {
        target: { value: 'test-provider' },
      });
      fireEvent.change(screen.getByLabelText('Display Name'), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText('API Endpoint'), {
        target: { value: 'https://api.example.com' },
      });
      fireEvent.change(screen.getByLabelText('Model Names'), {
        target: { value: 'model-a' },
      });

      fireEvent.click(screen.getByText('Next: Review'));

      await waitFor(() => {
        expect(screen.getByText(/Add Provider/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/^Add Provider$/));

      await waitFor(() => {
        expect(screen.getByText(/Provider Added Successfully/)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should show error if onAddProvider fails', async () => {
      mockOnAddProvider.mockRejectedValue(new Error('Failed to add provider'));

      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByLabelText('Provider ID'), {
        target: { value: 'test-provider' },
      });
      fireEvent.change(screen.getByLabelText('Display Name'), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText('API Endpoint'), {
        target: { value: 'https://api.example.com' },
      });
      fireEvent.change(screen.getByLabelText('Model Names'), {
        target: { value: 'model-a' },
      });

      fireEvent.click(screen.getByText('Next: Review'));

      await waitFor(() => {
        expect(screen.getByText(/Add Provider/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/^Add Provider$/));

      await waitFor(() => {
        expect(screen.getByText(/Failed to add provider/)).toBeInTheDocument();
      });

      // Should return to form
      expect(screen.getByText('Add Custom Provider')).toBeInTheDocument();
    });
  });

  describe('cancel button', () => {
    it('should call onClose when cancel is clicked', () => {
      render(
        <CustomProviderSetup
          onAddProvider={mockOnAddProvider}
          onClose={mockOnClose}
        />
      );

      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[0]);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
