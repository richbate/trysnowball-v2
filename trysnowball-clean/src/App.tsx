/**
 * Clean UK Debt Management App
 * Zero conversion, bulletproof and boring
 * Server-first state management with React Query
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Landing from './pages/Landing';
import Upgrade from './pages/Upgrade';
import Success from './pages/Success';
import EnvironmentBanner from './components/EnvironmentBanner';
import { StagingWrapper } from './components/StagingBanner';
import DemoMode from './components/DemoMode';
import DemoWatermark from './components/DemoWatermark';
import DebtList from './components/DebtList';
import DebtForm from './components/DebtForm';
import ForecastPage from './components/ForecastPage';
import Goals from './pages/Goals';
import { Library } from './pages/Library';
import DebugShowcase from './components/DebugShowcase';
import { UKDebt, CreateUKDebt, UpdateUKDebt } from './types/UKDebt';
import { useDebts, useCreateDebt, useUpdateDebt, useDeleteDebt } from './hooks/useDebts';
import { useDemoMode } from './hooks/useDemoMode';
import { DemoScenario } from './data/demoScenarios';

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

  // Demo mode management
  const demoMode = useDemoMode();

  // Server-first state management - no manual useState for debts
  const { data: serverDebts = [], isLoading, isError, error, refetch } = useDebts();
  const createMutation = useCreateDebt();
  const updateMutation = useUpdateDebt();
  const deleteMutation = useDeleteDebt();

  // Use demo debts if demo mode is enabled, otherwise use server debts
  const debts = demoMode.isEnabled ? demoMode.getDemoDebts() : serverDebts;

  const handleAddDebt = () => {
    // In demo mode, suggest switching to real mode for adding debts
    if (demoMode.isEnabled) {
      if (window.confirm('To add your own debts, you need to exit demo mode. Would you like to exit demo mode now?')) {
        demoMode.disableDemo();
        setEditingDebt(null);
        setShowForm(true);
      }
      return;
    }

    setEditingDebt(null);
    setShowForm(true);
  };

  const handleEditDebt = (debt: UKDebt) => {
    // Prevent editing demo debts
    if (demoMode.isDemoDebt(debt.id)) {
      alert('Demo debts cannot be edited. Exit demo mode to manage your own debts.');
      return;
    }

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
    // Prevent deleting demo debts
    if (demoMode.isDemoDebt(id)) {
      alert('Demo debts cannot be deleted. Exit demo mode to manage your own debts.');
      return;
    }

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
    <div className="min-h-screen purple-gradient-bg text-white">
      {/* Header */}
      <header className="glass-subtle shadow-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-white">
                Clean UK Debt Manager
              </h1>
              <p className="text-sm text-white/70">
                Zero conversions, bulletproof and boring
              </p>
            </div>
            
            {activeTab === 'debts' && (
              <button
                onClick={handleAddDebt}
                className="px-4 py-2 text-sm font-medium text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-colors duration-200"
              >
                Add Debt
              </button>
            )}
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-t border-white/10">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('debts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'debts'
                    ? 'border-fuchsia-500 text-fuchsia-300'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                }`}
              >
                My Debts
                {debts.length > 0 && (
                  <span className="ml-2 bg-white/20 text-white py-0.5 px-2.5 rounded-full text-xs backdrop-blur-sm">
                    {debts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('forecast')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'forecast'
                    ? 'border-fuchsia-500 text-fuchsia-300'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                }`}
              >
                Freedom Plan
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'goals'
                    ? 'border-fuchsia-500 text-fuchsia-300'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                }`}
              >
                Goals & Challenges
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'library'
                    ? 'border-fuchsia-500 text-fuchsia-300'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                }`}
              >
                📚 Library
              </button>
              <button
                onClick={() => setActiveTab('debug')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'debug'
                    ? 'border-red-400 text-red-300'
                    : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                }`}
              >
                🛠️ Debug Showcase
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Demo Watermark */}
      <DemoWatermark
        isVisible={demoMode.isEnabled}
        scenarioName={demoMode.currentScenario?.title}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Mode Selector */}
        {activeTab === 'debts' && (
          <DemoMode
            onScenarioSelect={(scenario: DemoScenario | null) => {
              if (scenario) {
                demoMode.enableDemo(scenario);
              } else {
                demoMode.disableDemo();
              }
            }}
            currentScenarioId={demoMode.scenarioId || undefined}
            isVisible={true}
          />
        )}

        {activeTab === 'debts' ? (
          <>
            {/* Summary Cards */}
            {debts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card">
                  <h3 className="text-lg font-semibold text-white mb-2">Total Debt</h3>
                  <p className="text-3xl font-bold text-red-300">
                    {new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                    }).format(totalDebt)}
                  </p>
                </div>

                <div className="glass-card">
                  <h3 className="text-lg font-semibold text-white mb-2">Total Min Payments</h3>
                  <p className="text-3xl font-bold text-orange-300">
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
              <div className="mb-6 glass-card bg-red-500/20 border-red-400/30">
                <p className="text-red-200">
                  Failed to load debts: {error?.message || 'Please try again.'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-sm text-red-300 hover:text-red-100 underline transition-colors duration-200"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-400"></div>
                <p className="mt-2 text-white/70">Loading debts...</p>
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

// Main App component with QueryClient provider and routing
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <StagingWrapper>
          <EnvironmentBanner />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<Dashboard />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/success" element={<Success />} />
            <Route path="/demo" element={<Dashboard />} />
          </Routes>
        </StagingWrapper>
      </Router>
    </QueryClientProvider>
  );
}

export default App;