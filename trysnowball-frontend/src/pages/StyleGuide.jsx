import React, { useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import Button from '../components/ui/Button';
import SimpleToast from '../components/SimpleToast';

const StyleGuide = () => {
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-6">
        <h1 className="text-4xl font-bold text-text mb-2">Style Guide</h1>
        <p className="text-secondary text-lg">
          Purple gradient system showcase with elevated white cards
        </p>
      </div>

      {/* AuthenticatedLayout Showcase */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-text mb-4">AuthenticatedLayout</h2>
        <p className="text-secondary mb-4">
          Main layout pattern: Purple gradient background with elevated white cards
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-text mb-2">Content Card</h3>
            <p className="text-secondary">
              Elevated white cards with glassmorphism effects for all authenticated content
            </p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-text mb-2">Secondary Card</h3>
            <p className="text-secondary">
              Consistent spacing and styling across all components
            </p>
          </div>
        </div>
      </div>

      {/* OnboardingCard Showcase */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-text mb-4">OnboardingCard</h2>
        <div className="max-w-md mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/30">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-text mb-2">Welcome to TrySnowball</h3>
              <p className="text-secondary">
                Start your debt-free journey with our proven snowball method
              </p>
            </div>
            <Button variant="primary" size="lg" className="w-full">
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* CTA Buttons Showcase */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-text mb-4">CTA Buttons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="primary" size="lg">
            Primary Large
          </Button>
          <Button variant="secondary" size="lg">
            Secondary Large
          </Button>
          <Button variant="primary" size="md">
            Primary Medium
          </Button>
          <Button variant="secondary" size="md">
            Secondary Medium
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
            Custom Primary
          </button>
          <button className="px-6 py-3 border border-border rounded-lg hover:bg-surface-secondary transition-colors font-medium text-text">
            Custom Secondary
          </button>
        </div>
      </div>

      {/* ProgressTracker Showcase */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-text mb-4">ProgressTracker</h2>
        <div className="space-y-6">
          {/* Step Progress */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Step Progress</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '65%' }}></div>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-primary text-primary text-sm font-bold">
                3
              </div>
            </div>
          </div>
          
          {/* Debt Progress */}
          <div>
            <h3 className="text-lg font-semibold text-text mb-4">Debt Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-text">Credit Card</span>
                <span className="text-sm text-secondary">£2,500 / £5,000</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Showcase */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-text mb-4">Modal</h2>
        <Button 
          variant="primary" 
          onClick={() => setShowModal(true)}
        >
          Show Modal
        </Button>
        
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/30">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-text">Modal Title</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-muted hover:text-text transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-secondary mb-6">
                This is a modal with glassmorphism styling that matches our purple gradient theme.
              </p>
              <div className="flex space-x-3">
                <Button variant="primary" onClick={() => setShowModal(false)}>
                  Confirm
                </Button>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Showcase */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-text mb-4">Toast Notifications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="primary" 
            onClick={() => setShowToast('success')}
          >
            Success Toast
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowToast('error')}
          >
            Error Toast
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowToast('warning')}
          >
            Warning Toast
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowToast('info')}
          >
            Info Toast
          </Button>
        </div>

        {/* Toast Examples */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Success: Your debt has been updated!</span>
          </div>
          <div className="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <X className="w-5 h-5 text-red-600" />
            <span className="text-red-800">Error: Failed to save changes</span>
          </div>
          <div className="flex items-center space-x-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">Warning: Please review your data</span>
          </div>
          <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">Info: Sync completed successfully</span>
          </div>
        </div>
      </div>

      {/* Design System Summary */}
      <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-text mb-4">Design System Notes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-text mb-3">Colors</h3>
            <ul className="space-y-2 text-secondary">
              <li>• <code>primary</code> - Purple gradient start</li>
              <li>• <code>accent</code> - Purple gradient via</li>
              <li>• <code>text</code> - Main text color</li>
              <li>• <code>secondary</code> - Secondary text</li>
              <li>• <code>muted</code> - Muted text</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text mb-3">Patterns</h3>
            <ul className="space-y-2 text-secondary">
              <li>• Purple gradient backgrounds</li>
              <li>• Elevated white cards with glassmorphism</li>
              <li>• Consistent rounded corners (rounded-3xl, rounded-2xl)</li>
              <li>• Backdrop blur effects</li>
              <li>• White/transparency layering</li>
            </ul>
          </div>
        </div>
      </div>

      {showToast && (
        <SimpleToast
          message={`${showToast.charAt(0).toUpperCase() + showToast.slice(1)} toast notification!`}
          type={showToast}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default StyleGuide;