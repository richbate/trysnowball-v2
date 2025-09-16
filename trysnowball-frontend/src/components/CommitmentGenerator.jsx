/**
 * AI-Powered Commitment Generator Component
 * Allows users to generate personalized monthly debt commitments
 */

import React, { useState } from 'react';
import { Sparkles, Target, Calendar, Plus, X, RefreshCw, Share2 } from 'lucide-react';
import { useCommitments } from '../hooks/useCommitments';
import { useTheme } from '../contexts/ThemeContext';
import FormField from './ui/FormField';
import Input from './ui/Input';

const CommitmentGenerator = ({ className = '' }) => {
  const { colors } = useTheme();
  const {
    commitments,
    currentMonthCommitments,
    loading,
    error,
    generateCommitments,
    canGenerateCommitments
  } = useCommitments();

  const [isExpanded, setIsExpanded] = useState(false);
  const [customExtras, setCustomExtras] = useState(['']);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showCustomExtras, setShowCustomExtras] = useState(false);

  // Get current month name
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  const handleGenerate = async () => {
    const extras = customExtras.filter(extra => extra.trim() !== '');
    
    const options = {
      customExtras: extras,
      month: selectedMonth || null
    };

    const result = await generateCommitments(options);
    if (result) {
      setIsExpanded(true);
      setCustomExtras(['']); // Reset custom extras
      setShowCustomExtras(false);
    }
  };

  const addCustomExtra = () => {
    setCustomExtras([...customExtras, '']);
  };

  const updateCustomExtra = (index, value) => {
    const updated = [...customExtras];
    updated[index] = value;
    setCustomExtras(updated);
  };

  const removeCustomExtra = (index) => {
    setCustomExtras(customExtras.filter((_, i) => i !== index));
  };

  const handleShare = async () => {
    if (!currentMonthCommitments?.content) return;

    const shareText = `My ${currentMonthName} debt freedom goals:\n\n${currentMonthCommitments.content}\n\nGenerated with TrySnowball 💪\nhttps://trysnowball.co.uk`;

    try {
      if (navigator.share && navigator.canShare({ text: shareText })) {
        await navigator.share({
          title: `${currentMonthName} Debt Goals`,
          text: shareText
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        // Could add a toast notification here
        alert('Goals copied to clipboard!');
      } else {
        // Fallback - show text in an alert
        alert(shareText);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // If user doesn't have debt data, show empty state
  if (!canGenerateCommitments()) {
    return (
      <div className={`${colors.surface} rounded-xl p-6 ${colors.border} border ${className}`}>
        <div className="text-center">
          <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className={`text-lg font-semibold ${colors.text.primary} mb-2`}>
            Set Monthly Goals
          </h3>
          <p className={`text-sm ${colors.text.secondary} mb-4`}>
            Add your debts first to generate personalized monthly commitment goals.
          </p>
          <button
            onClick={() => window.location.href = '/debts'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Add Your Debts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${colors.surface} rounded-xl ${colors.border} border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${colors.text.primary}`}>
                Monthly Commitment Goals
              </h3>
              <p className={`text-sm ${colors.text.secondary}`}>
                AI-generated goals to keep you motivated
              </p>
            </div>
          </div>
          
          {currentMonthCommitments && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShare}
                className="text-slate-600 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Share goals"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="text-slate-600 hover:text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate goals"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Current Month Commitments */}
      {currentMonthCommitments ? (
        <div className="p-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
            <pre className={`text-sm whitespace-pre-wrap ${colors.text.primary} font-medium leading-relaxed`}>
              {currentMonthCommitments.content}
            </pre>
            <div className="mt-3 text-xs text-slate-500">
              Generated on {new Date(currentMonthCommitments.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h4 className={`text-lg font-medium ${colors.text.primary} mb-2`}>
              No goals for {currentMonthName} yet
            </h4>
            <p className={`text-sm ${colors.text.secondary} mb-6`}>
              Generate AI-powered monthly goals based on your debt situation
            </p>
          </div>
        </div>
      )}

      {/* Generation Controls */}
      <div className="border-t border-slate-200 p-6">
        {/* Custom Extras Toggle */}
        {!showCustomExtras ? (
          <button
            onClick={() => setShowCustomExtras(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
          >
            <Plus className="h-4 w-4" />
            <span>Add custom goals</span>
          </button>
        ) : (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-medium ${colors.text.primary}`}>
                Custom Goals (optional)
              </label>
              <button
                onClick={() => setShowCustomExtras(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {customExtras.map((extra, index) => (
              <div key={index} className="flex items-start space-x-2 mb-2">
                <div className="flex-1">
                  <FormField>
                    <Input
                      type="text"
                      value={extra}
                      onChange={(e) => updateCustomExtra(index, e.target.value)}
                      placeholder="e.g., Make £100 from side hustles"
                    />
                  </FormField>
                </div>
                {customExtras.length > 1 && (
                  <button
                    onClick={() => removeCustomExtra(index)}
                    className="text-slate-400 hover:text-red-600 mt-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            
            <button
              onClick={addCustomExtra}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add another goal</span>
            </button>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {currentMonthCommitments ? 'Generate new goals for this month' : 'Generate your first monthly goals'}
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium transition-all duration-200 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
              loading ? 'animate-pulse' : ''
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {loading ? 'Generating...' : currentMonthCommitments ? 'Regenerate Goals' : 'Generate Goals'}
            </span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Past Commitments */}
      {commitments.length > 1 && (
        <div className="border-t border-slate-200 p-6">
          <h4 className={`text-sm font-semibold ${colors.text.primary} mb-3`}>
            Previous Goals
          </h4>
          <div className="space-y-2">
            {commitments.slice(1, 4).map((commitment) => (
              <div key={commitment.month} className="text-sm text-slate-600">
                <span className="font-medium">
                  {new Date(`${commitment.month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <span className="text-slate-500 ml-2">
                  • {commitment.content.split('\n')[1]?.replace('✔️ ', '') || 'Goals generated'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitmentGenerator;