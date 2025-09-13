/**
 * Clean UK Debt Management App
 * Zero conversion, bulletproof and boring
 * Server-first state management with React Query
 */

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DebtList from './components/DebtList';
import DebtForm from './components/DebtForm';
import ForecastPage from './components/ForecastPage';
import Goals from './pages/Goals';
import { Library } from './pages/Library';
import DebugShowcase from './components/DebugShowcase';
import { UKDebt, CreateUKDebt, UpdateUKDebt } from './types/UKDebt';
import { useDebts, useCreateDebt, useUpdateDebt, useDeleteDebt } from './hooks/useDebts';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function Dashboard() {
  const [activeTab, setActiveTab] = useState<'debts' | 'forecast' | 'goals' | 'library' | 'debug'>('debts');
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<UKDebt | null>(null);

  // Server-first state management - no manual useState for debts
  const { data: debts = [], isLoading, isError, error, refetch } = useDebts();
  const createMutation = useCreateDebt();
  const updateMutation = useUpdateDebt();
  const deleteMutation = useDeleteDebt();

  const handleAddDebt = () => {
    setEditingDebt(null);
    setShowForm(true);
  };

  const handleEditDebt = (debt: UKDebt) => {
    setEditingDebt(debt);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: CreateUKDebt | UpdateUKDebt) => {
    try {
      if (editingDebt) {
        // Update existing debt using React Query mutation
        await updateMutation.mutateAsync({ id: editingDebt.id, updates: data });
      } else {
        // Create new debt using React Query mutation
        await createMutation.mutateAsync(data as CreateUKDebt);
      }
      
      setShowForm(false);
      setEditingDebt(null);
    } catch (err) {
      throw err; // Let the form handle the error display
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this debt?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert('Failed to delete debt. Please try again.');
      console.error('Error deleting debt:', err);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingDebt(null);
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const totalMinPayment = debts.reduce((sum, debt) => sum + debt.min_payment, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Clean UK Debt Manager
              </h1>
              <p className="text-sm text-gray-500">
                Zero conversions, bulletproof and boring
              </p>
            </div>
            
            {activeTab === 'debts' && (
              <button
                onClick={handleAddDebt}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Debt
              </button>
            )}
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('debts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'debts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Debts
                {debts.length > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {debts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('forecast')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'forecast'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Freedom Plan
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'goals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Goals & Challenges
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'library'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📚 Library
              </button>
              <button
                onClick={() => setActiveTab('debug')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'debug'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🛠️ Debug Showcase
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'debts' ? (
          <>
            {/* Summary Cards */}
            {debts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Debt</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                    }).format(totalDebt)}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Min Payments</h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                    }).format(totalMinPayment)}
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {isError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">
                  Failed to load debts: {error?.message || 'Please try again.'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading debts...</p>
              </div>
            )}

            {/* Debt List */}
            {!isLoading && (
              <DebtList
                debts={debts}
                onEdit={handleEditDebt}
                onDelete={handleDeleteDebt}
              />
            )}
          </>
        ) : activeTab === 'forecast' ? (
          /* Forecast Tab Content */
          <div className="pb-8">
            <ForecastPage />
          </div>
        ) : activeTab === 'goals' ? (
          /* Goals Tab Content - CP-5 Glassmorphism Dashboard */
          <div className="pb-8">
            <Goals />
          </div>
        ) : activeTab === 'library' ? (
          /* Library Tab Content */
          <div className="pb-8">
            <Library />
          </div>
        ) : (
          /* Debug Tab Content */
          <div className="pb-8">
            <DebugShowcase debts={debts} />
          </div>
        )}
      </main>

      {/* Debt Form Modal */}
      {showForm && (
        <DebtForm
          debt={editingDebt || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

// Main App component with QueryClient provider
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}

export default App;