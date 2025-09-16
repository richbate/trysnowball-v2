/**
 * Onboarding Wizard - First-time user debt setup
 * Guides users through adding their first debts
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebts } from '../hooks/useDebts';
import { useDemoMode } from '../providers/DemoModeProvider';
import { Plus, CreditCard, TrendingUp, Sparkles, X } from 'lucide-react';
import DebtFormModal from '../components/debt/DebtFormModal';
import DebtPasteInput from '../components/DebtPasteInput';

const Onboarding = () => {
  const navigate = useNavigate();
  const { addDebt } = useDebts();
  const { enterDemo } = useDemoMode();
  const [step, setStep] = useState('welcome');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [addedDebts, setAddedDebts] = useState([]);
  
  const handleTryDemo = async () => {
    await enterDemo('onboarding', 'default');
    navigate('/');
  };
  
  const handleAddDebt = async (debtData) => {
    const newDebt = await addDebt(debtData);
    setAddedDebts([...addedDebts, newDebt]);
    setShowAddForm(false);
    setStep('adding');
  };
  
  const handlePasteDebts = async (debts) => {
    for (const debt of debts) {
      await addDebt(debt);
    }
    setAddedDebts([...addedDebts, ...debts]);
    setShowPasteInput(false);
    setStep('adding');
  };
  
  const handleContinue = () => {
    if (addedDebts.length > 0) {
      navigate('/');
    }
  };
  
  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {step === 'welcome' ? 'Getting Started' : 'Adding Debts'}
            </span>
            <span className="text-sm text-gray-500">
              {addedDebts.length} debt{addedDebts.length !== 1 ? 's' : ''} added
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: step === 'welcome' ? '33%' : '66%' }}
            />
          </div>
        </div>

        {/* Welcome step */}
        {step === 'welcome' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">
                Welcome to TrySnowball!
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Let's set up your debt payoff plan
              </p>
              <p className="text-gray-500">
                Add your debts to see when you'll be debt-free and how much you'll save.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setStep('adding')}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Start Adding My Debts
              </button>
              
              <button
                onClick={handleTryDemo}
                className="w-full px-6 py-4 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Show Me Demo Data First
              </button>
            </div>
          </div>
        )}

        {/* Adding debts step */}
        {step === 'adding' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Add Your Debts</h2>
              <p className="text-gray-600">
                Add each debt with its balance, interest rate, and minimum payment.
              </p>
            </div>
            
            {/* Added debts list */}
            {addedDebts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Added so far:</h3>
                <div className="space-y-2">
                  {addedDebts.map((debt, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{debt.name}</span>
                        <span className="text-gray-500 ml-2">
                          £{debt.balance?.toLocaleString() || 0}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {debt.rate || debt.interestRate}% APR
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add options */}
            <div className="space-y-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add a Debt Manually
              </button>
              
              <button
                onClick={() => setShowPasteInput(true)}
                className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Paste Multiple Debts
              </button>
              
              {addedDebts.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleContinue}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Continue to Dashboard ({addedDebts.length} debt{addedDebts.length !== 1 ? 's' : ''})
                  </button>
                </div>
              )}
              
              <button
                onClick={handleSkip}
                className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {showAddForm && (
        <DebtFormModal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSave={handleAddDebt}
        />
      )}
      
      {showPasteInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Paste Multiple Debts</h2>
                <button
                  onClick={() => setShowPasteInput(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <DebtPasteInput
                onDebtsExtracted={handlePasteDebts}
                onClose={() => setShowPasteInput(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;