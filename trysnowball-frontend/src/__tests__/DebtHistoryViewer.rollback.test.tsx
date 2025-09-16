/**
 * Tests for DebtHistoryViewer rollback functionality (CP-5)
 * Tests the UI interactions for viewing debt history and performing rollbacks
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DebtHistoryViewer from '../components/debts/DebtHistoryViewer';
import { ThemeContext } from '../contexts/ThemeContext';

// Mock the required hooks and modules
jest.mock('../hooks/useDebtEvents.ts', () => ({
  useDebtEvents: jest.fn()
}));

jest.mock('../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn()
  })
}));

jest.mock('../hooks/useDebts', () => ({
  useDebts: () => ({
    debtsManager: {
      rollbackDebt: jest.fn()
    }
  })
}));

// Mock theme context
const mockTheme = {
  colors: {
    surface: 'bg-white',
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      muted: 'text-gray-500'
    },
    border: 'border-gray-200',
    surfaceSecondary: 'bg-gray-50'
  }
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeContext.Provider value={mockTheme}>
    {children}
  </ThemeContext.Provider>
);

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

describe('DebtHistoryViewer Rollback (CP-5)', () => {
  const mockProps = {
    debtId: 'debt-123',
    debtName: 'Credit Card',
    isOpen: true,
    onClose: jest.fn()
  };

  const mockEvents = [
    {
      id: 'event-1',
      eventDate: '2025-01-01T12:00:00.000Z',
      type: 'edited',
      debtId: 'debt-123',
      metadata: {
        field: 'balance',
        oldValue: 1000,
        newValue: 900,
        source: 'user_edit',
        note: 'Balance updated manually'
      }
    },
    {
      id: 'event-2',
      eventDate: '2025-01-02T12:00:00.000Z',
      type: 'edited',
      debtId: 'debt-123',
      metadata: {
        field: 'apr',
        oldValue: 18.5,
        newValue: 22.0,
        source: 'user_edit',
        note: 'Interest rate increased'
      }
    },
    {
      id: 'event-3',
      eventDate: '2025-01-03T12:00:00.000Z',
      type: 'payment_recorded',
      debtId: 'debt-123',
      metadata: {
        field: 'balance',
        oldValue: 900,
        newValue: 700,
        source: 'payment_tracker',
        note: 'Payment of £200 recorded'
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true); // Default to confirming rollback
    
    // Mock useDebtEvents to return our test data
    const { useDebtEvents } = require('../hooks/useDebtEvents.ts');
    useDebtEvents.mockReturnValue({
      events: mockEvents,
      loading: false,
      error: null,
      loadMore: jest.fn(),
      refresh: jest.fn()
    });
  });

  describe('Event Display with Field Changes', () => {
    test('displays field-level changes in event list', () => {
      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      // Check that balance change is displayed
      expect(screen.getByText('balance:')).toBeInTheDocument();
      expect(screen.getByText('£1,000')).toBeInTheDocument(); // Old value
      expect(screen.getByText('£900')).toBeInTheDocument(); // New value

      // Check that APR change is displayed
      expect(screen.getByText('apr:')).toBeInTheDocument();
      expect(screen.getByText('18.5%')).toBeInTheDocument(); // Old value
      expect(screen.getByText('22%')).toBeInTheDocument(); // New value
    });

    test('displays rollback buttons for rollable events', () => {
      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      // Should have rollback buttons for field-level changes
      const rollbackButtons = screen.getAllByText('Rollback');
      expect(rollbackButtons.length).toBeGreaterThan(0);
      
      // Each rollback button should have a title attribute
      rollbackButtons.forEach(button => {
        expect(button).toHaveAttribute('title');
        expect(button.getAttribute('title')).toMatch(/Rollback .+ to previous value/);
      });
    });

    test('does not show rollback button for creation events', () => {
      const creationEvent = {
        id: 'event-creation',
        eventDate: '2025-01-01T10:00:00.000Z',
        type: 'created',
        debtId: 'debt-123',
        metadata: {
          source: 'user_create'
        }
      };

      const { useDebtEvents } = require('../hooks/useDebtEvents.ts');
      useDebtEvents.mockReturnValue({
        events: [creationEvent],
        loading: false,
        error: null,
        loadMore: jest.fn(),
        refresh: jest.fn()
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      // Should not have any rollback buttons for creation events
      expect(screen.queryByText('Rollback')).not.toBeInTheDocument();
    });
  });

  describe('Rollback Functionality', () => {
    test('performs rollback when user confirms', async () => {
      const mockRollbackDebt = jest.fn().mockResolvedValue({
        success: true,
        message: 'Successfully rolled back balance to previous value'
      });

      const { useDebts } = require('../hooks/useDebts');
      useDebts.mockReturnValue({
        debtsManager: {
          rollbackDebt: mockRollbackDebt
        }
      });

      const mockRefresh = jest.fn();
      const { useDebtEvents } = require('../hooks/useDebtEvents.ts');
      useDebtEvents.mockReturnValue({
        events: mockEvents,
        loading: false,
        error: null,
        loadMore: jest.fn(),
        refresh: mockRefresh
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      // Click the first rollback button
      const rollbackButtons = screen.getAllByText('Rollback');
      fireEvent.click(rollbackButtons[0]);

      // Should confirm with user
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to rollback the balance field')
      );

      // Should call rollbackDebt
      await waitFor(() => {
        expect(mockRollbackDebt).toHaveBeenCalledWith('debt-123', 'event-1');
      });

      // Should refresh the events after successful rollback
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    test('cancels rollback when user declines confirmation', async () => {
      mockConfirm.mockReturnValue(false); // User cancels

      const mockRollbackDebt = jest.fn();
      const { useDebts } = require('../hooks/useDebts');
      useDebts.mockReturnValue({
        debtsManager: {
          rollbackDebt: mockRollbackDebt
        }
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      // Click the rollback button
      const rollbackButtons = screen.getAllByText('Rollback');
      fireEvent.click(rollbackButtons[0]);

      // Should confirm with user
      expect(mockConfirm).toHaveBeenCalled();

      // Should NOT call rollbackDebt
      expect(mockRollbackDebt).not.toHaveBeenCalled();
    });

    test('handles rollback errors gracefully', async () => {
      const mockRollbackDebt = jest.fn().mockRejectedValue(
        new Error('Rollback failed: Database connection error')
      );

      const { useDebts } = require('../hooks/useDebts');
      useDebts.mockReturnValue({
        debtsManager: {
          rollbackDebt: mockRollbackDebt
        }
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      // Click the rollback button
      const rollbackButtons = screen.getAllByText('Rollback');
      fireEvent.click(rollbackButtons[0]);

      // Wait for the error to be handled
      await waitFor(() => {
        expect(mockRollbackDebt).toHaveBeenCalled();
      });

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText(/Rollback failed/)).toBeInTheDocument();
        expect(screen.getByText(/Database connection error/)).toBeInTheDocument();
      });
    });

    test('disables rollback button while rollback is in progress', async () => {
      let resolveRollback: any;
      const rollbackPromise = new Promise(resolve => {
        resolveRollback = resolve;
      });

      const mockRollbackDebt = jest.fn().mockReturnValue(rollbackPromise);
      const { useDebts } = require('../hooks/useDebts');
      useDebts.mockReturnValue({
        debtsManager: {
          rollbackDebt: mockRollbackDebt
        }
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      // Click the rollback button
      const rollbackButtons = screen.getAllByText('Rollback');
      fireEvent.click(rollbackButtons[0]);

      // All rollback buttons should be disabled while operation is in progress
      await waitFor(() => {
        const allButtons = screen.getAllByText('Rollback');
        allButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });

      // Resolve the rollback
      resolveRollback({ success: true });
      
      // Buttons should be enabled again
      await waitFor(() => {
        const allButtons = screen.getAllByText('Rollback');
        allButtons.forEach(button => {
          expect(button).not.toBeDisabled();
        });
      });
    });
  });

  describe('Analytics Tracking', () => {
    test('tracks history viewed event on open', () => {
      const mockTrackEvent = jest.fn();
      const { useAnalytics } = require('../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        trackEvent: mockTrackEvent
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      expect(mockTrackEvent).toHaveBeenCalledWith('debt_history_viewed', {
        debtId: 'debt-123'
      });
    });

    test('tracks rollback performed event', async () => {
      const mockTrackEvent = jest.fn();
      const { useAnalytics } = require('../hooks/useAnalytics');
      useAnalytics.mockReturnValue({
        trackEvent: mockTrackEvent
      });

      const mockRollbackDebt = jest.fn().mockResolvedValue({
        success: true,
        message: 'Successfully rolled back'
      });

      const { useDebts } = require('../hooks/useDebts');
      useDebts.mockReturnValue({
        debtsManager: {
          rollbackDebt: mockRollbackDebt
        }
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      // Clear the history viewed event
      mockTrackEvent.mockClear();

      // Click rollback button
      const rollbackButtons = screen.getAllByText('Rollback');
      fireEvent.click(rollbackButtons[0]);

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith('debt_rollback_performed', {
          debtId: 'debt-123',
          field: 'balance',
          eventId: 'event-1'
        });
      });
    });
  });

  describe('Batch Event Display', () => {
    test('groups events by batchId', () => {
      const batchEvents = [
        {
          id: 'batch-event-1',
          eventDate: '2025-01-04T12:00:00.000Z',
          type: 'edited',
          debtId: 'debt-123',
          metadata: {
            field: 'balance',
            oldValue: 700,
            newValue: 600,
            batchId: 'batch_123',
            source: 'balance_update_modal'
          }
        },
        {
          id: 'batch-event-2',
          eventDate: '2025-01-04T12:00:00.000Z',
          type: 'edited',
          debtId: 'debt-123',
          metadata: {
            field: 'apr',
            oldValue: 22.0,
            newValue: 24.0,
            batchId: 'batch_123',
            source: 'balance_update_modal'
          }
        }
      ];

      const { useDebtEvents } = require('../hooks/useDebtEvents.ts');
      useDebtEvents.mockReturnValue({
        events: batchEvents,
        loading: false,
        error: null,
        loadMore: jest.fn(),
        refresh: jest.fn()
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      // Should display batch header
      expect(screen.getByText('Batch Update (2 changes)')).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    test('renders nothing when isOpen is false', () => {
      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} isOpen={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Debt History')).not.toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Click the X button
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('displays loading state', () => {
      const { useDebtEvents } = require('../hooks/useDebtEvents.ts');
      useDebtEvents.mockReturnValue({
        events: null,
        loading: true,
        error: null,
        loadMore: jest.fn(),
        refresh: jest.fn()
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Loading history...')).toBeInTheDocument();
    });

    test('displays error state', () => {
      const { useDebtEvents } = require('../hooks/useDebtEvents.ts');
      useDebtEvents.mockReturnValue({
        events: null,
        loading: false,
        error: 'Failed to load events',
        loadMore: jest.fn(),
        refresh: jest.fn()
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/Failed to load history/)).toBeInTheDocument();
    });

    test('displays empty state when no events', () => {
      const { useDebtEvents } = require('../hooks/useDebtEvents.ts');
      useDebtEvents.mockReturnValue({
        events: [],
        loading: false,
        error: null,
        loadMore: jest.fn(),
        refresh: jest.fn()
      });

      render(
        <TestWrapper>
          <DebtHistoryViewer {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('No history available for this debt.')).toBeInTheDocument();
    });
  });
});