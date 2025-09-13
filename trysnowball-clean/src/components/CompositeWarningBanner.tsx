/**
 * Composite Mode Limitations Warning Banner
 * Informs users about assumptions and limitations of multi-APR simulation
 */

import React, { useState } from 'react';

interface CompositeWarningBannerProps {
  className?: string;
}

export default function CompositeWarningBanner({ className = '' }: CompositeWarningBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-yellow-800">
              Multi-APR Simulation Active
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              This forecast assumes fixed APRs and proportional minimum payments. 
              Real credit card behavior may vary.
              {!isExpanded && (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="ml-1 text-yellow-600 underline hover:text-yellow-800 focus:outline-none"
                >
                  Learn more
                </button>
              )}
            </p>
            
            {isExpanded && (
              <div className="mt-3 space-y-2 text-sm text-yellow-700">
                <div>
                  <h5 className="font-medium text-yellow-800">Key Assumptions:</h5>
                  <ul className="mt-1 list-disc list-inside space-y-1 pl-2">
                    <li>APR rates remain constant throughout the forecast</li>
                    <li>Minimum payments are split proportionally by balance</li>
                    <li>No promotional rate expirations or changes</li>
                    <li>Monthly compound interest calculation</li>
                    <li>Snowball payments target highest priority buckets first</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-yellow-800">Real-world variations:</h5>
                  <ul className="mt-1 list-disc list-inside space-y-1 pl-2">
                    <li>Credit cards may have different minimum payment rules</li>
                    <li>Promotional rates typically expire and revert to standard rates</li>
                    <li>Interest calculation methods may vary between providers</li>
                    <li>Payment allocation order may differ from this simulation</li>
                  </ul>
                </div>
                
                <div className="pt-2 border-t border-yellow-200">
                  <p className="text-xs text-yellow-600">
                    <span className="font-medium">💡 Recommendation:</span> Use this forecast as a guide. 
                    Always verify payment allocation and rate details with your card provider.
                  </p>
                </div>
                
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-yellow-600 underline hover:text-yellow-800 focus:outline-none text-xs"
                >
                  Show less
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Experimental
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Development Mode Limitations Display
 * Shows technical limitations for developers
 */
export function DevLimitationsPanel() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <details className="mt-4 p-3 bg-gray-100 border rounded">
      <summary className="cursor-pointer text-sm font-mono text-gray-600">
        🔧 Dev: Composite Engine Limitations
      </summary>
      <div className="mt-2 text-xs text-gray-600">
        <h6 className="font-medium mb-1">Technical Limitations (v2.0):</h6>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li><code>Fixed APR</code>: No promotional rate expiry logic</li>
          <li><code>Static Priority</code>: Priority doesn't change based on balance</li>
          <li><code>Proportional Minimums</code>: All buckets use same minimum split logic</li>
          <li><code>No Payment Date Logic</code>: Assumes monthly payments on fixed schedule</li>
          <li><code>No Partial Payments</code>: Cannot handle scenarios where bucket payment &lt; interest</li>
          <li><code>Rounding Precision</code>: Uses penny rounding, may accumulate minor errors</li>
        </ul>
        
        <h6 className="font-medium mt-3 mb-1">Model File:</h6>
        <p className="font-mono text-xs">
          <code>DEBT_SIM_MODEL.md</code> - Locked specification for this engine version
        </p>
        
        <h6 className="font-medium mt-3 mb-1">Upgrade Path:</h6>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>v2.1: Add promotional rate expiry handling</li>
          <li>v2.2: Dynamic payment allocation based on issuer rules</li>
          <li>v3.0: Statement parsing integration</li>
        </ul>
      </div>
    </details>
  );
}