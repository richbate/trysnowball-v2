/**
 * CP-5 Entitlement Gate Component
 * Reusable component that checks entitlements before allowing actions
 */

import React, { useState } from 'react';
import { UserTier, EntitlementFeature } from '../types/Entitlements';
import { getEntitlementValue } from '../config/entitlements';
import { trackEntitlementBlocked } from '../lib/analytics';
import UpgradePrompt from './UpgradePrompt';

interface EntitlementGateProps {
  userTier: UserTier;
  feature: EntitlementFeature;
  currentUsage?: number;
  attemptedValue?: string | number;
  onBlocked?: () => void;
  children: React.ReactNode;
}

const EntitlementGate: React.FC<EntitlementGateProps> = ({ 
  userTier, 
  feature, 
  currentUsage = 0,
  attemptedValue,
  onBlocked,
  children 
}) => {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Check if the current action is allowed
  const checkEntitlement = (): boolean => {
    const entitlementValue = getEntitlementValue(feature, userTier);

    if (feature === 'goals.max_active') {
      const maxActive = typeof entitlementValue === 'number' ? entitlementValue : 1;
      return currentUsage < maxActive;
    }

    if (feature === 'goals.allowed_types') {
      const allowedTypes = Array.isArray(entitlementValue) ? entitlementValue : [];
      if (attemptedValue && typeof attemptedValue === 'string') {
        return allowedTypes.includes(attemptedValue);
      }
      return true; // If no specific type being checked, assume allowed
    }

    return true;
  };

  const isAllowed = checkEntitlement();

  const handleBlockedAction = () => {
    // Get limit value with proper type handling
    const entitlementValue = getEntitlementValue(feature, userTier);
    let limitValue: number | string[];
    
    if (typeof entitlementValue === 'number') {
      limitValue = entitlementValue;
    } else if (Array.isArray(entitlementValue)) {
      limitValue = entitlementValue;
    } else {
      // Default fallback for boolean or undefined
      limitValue = feature === 'goals.max_active' ? 1 : ['DEBT_CLEAR'];
    }

    // Fire entitlement blocked analytics event
    trackEntitlementBlocked({
      user_id: 'anonymous', // Will be filled by actual auth system
      feature,
      user_tier: userTier,
      limit_value: limitValue,
      attempted_action: attemptedValue ? `ATTEMPT_${attemptedValue}` : 'BLOCKED_ACTION',
      current_usage: currentUsage,
      forecast_version: 'v2.0'
    });

    // Show upgrade prompt
    setShowUpgradePrompt(true);

    // Call optional callback
    if (onBlocked) {
      onBlocked();
    }
  };

  const handleChildClick = (originalEvent: React.MouseEvent) => {
    if (!isAllowed) {
      originalEvent.preventDefault();
      originalEvent.stopPropagation();
      handleBlockedAction();
      return;
    }
    
    // If allowed, let the original event continue
  };

  // If not allowed, wrap children with click handler
  if (!isAllowed) {
    return (
      <>
        <div onClick={handleChildClick} style={{ cursor: 'pointer' }}>
          {children}
        </div>
        
        {showUpgradePrompt && (
          <UpgradePrompt
            feature={feature}
            userTier={userTier}
            currentUsage={currentUsage}
            onClose={() => setShowUpgradePrompt(false)}
          />
        )}
      </>
    );
  }

  // If allowed, render children normally
  return (
    <>
      {children}
    </>
  );
};

export default EntitlementGate;