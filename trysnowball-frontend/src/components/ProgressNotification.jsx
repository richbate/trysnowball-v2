import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ProgressNotification = ({ totalProgress, onDismiss }) => {
  const { colors } = useTheme();
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      setShow(false);
      onDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!show) return null;

  const isPositive = totalProgress > 0;
  const absProgress = Math.abs(totalProgress);
  
  // Don't show notification for zero or very small changes - these are likely milestone scenarios
  if (absProgress < 1) {
    onDismiss();
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm ${colors.surface} rounded-lg shadow-lg border-l-4 ${
      isPositive ? 'border-green-500' : 'border-red-500'
    } p-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-2xl">
            {isPositive ? '🎉' : '⚠️'}
          </span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${colors.text.primary}`}>
            Balances Updated!
          </h3>
          <div className={`mt-1 text-sm ${colors.text.secondary}`}>
            {isPositive ? (
              <>
                <span className="text-green-600 font-semibold">Amazing progress! </span>
                You've reduced your debt by £{absProgress.toLocaleString()} since July!
              </>
            ) : (
              <>
                <span className="text-red-600 font-semibold">Don't worry! </span>
                Your total increased by £{absProgress.toLocaleString()}, but we'll help you get back on track.
              </>
            )}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => {
              setShow(false);
              onDismiss();
            }}
            className={`${colors.text.muted} hover:${colors.text.secondary}`}
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressNotification;