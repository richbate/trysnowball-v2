/**
 * CP-5 Goals Demo Page
 * Showcases all Goals & Challenges UI components for testing
 */

import React, { useState } from 'react';
import { Goal, GOAL_TYPES, GOAL_STATUSES, ChallengeAssignment } from '../types/Goals';
import { USER_TIERS, UserTier } from '../types/Entitlements';
import GoalsPage from './GoalsPage';
import ChallengeBanner from './ChallengeBanner';

const GoalsDemoPage: React.FC = () => {
  const [selectedUserTier, setSelectedUserTier] = useState<UserTier>(USER_TIERS.FREE);
  const [showChallenge, setShowChallenge] = useState(true);

  // Sample challenge for demo
  const sampleChallenge: ChallengeAssignment = {
    suggestion_id: 'challenge_demo_123',
    goal_type: GOAL_TYPES.DEBT_CLEAR,
    target_value: 0,
    target_date: '2025-12-01',
    reason: 'AHEAD_OF_SCHEDULE',
    context: 'Great progress! You\'re 2 months ahead of your original forecast. Challenge yourself to clear your debt even faster - you can do it!',
    user_accepted: false
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            CP-5 Goals & Challenges Demo
          </h1>
          
          <div className="flex items-center gap-6">
            {/* User Tier Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">User Tier:</label>
              <select
                value={selectedUserTier}
                onChange={(e) => setSelectedUserTier(e.target.value as UserTier)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value={USER_TIERS.FREE}>Free</option>
                <option value={USER_TIERS.PRO}>Pro</option>
              </select>
            </div>

            {/* Challenge Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Show Challenge:</label>
              <button
                onClick={() => setShowChallenge(!showChallenge)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  showChallenge 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {showChallenge ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Tier Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Current Tier:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedUserTier === USER_TIERS.PRO 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {selectedUserTier === USER_TIERS.PRO ? '⭐ PRO' : '🆓 FREE'}
              </span>
            </div>
          </div>

          {/* Feature Overview */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Demo Features:</strong> This page showcases all CP-5 Goals & Challenges components. 
              Switch between Free/Pro tiers to see entitlement differences. 
              Try creating goals to test validation and analytics events.
            </p>
          </div>
        </div>
      </div>

      {/* Challenge Banner */}
      {showChallenge && (
        <div className="max-w-4xl mx-auto p-6 pt-4">
          <ChallengeBanner
            challenge={sampleChallenge}
            userTier={selectedUserTier}
            onAccept={() => {
              setShowChallenge(false);
              alert('Challenge accepted! A new goal has been created.');
            }}
            onReject={() => {
              setShowChallenge(false);
              alert('Challenge dismissed. We\'ll suggest other opportunities later.');
            }}
          />
        </div>
      )}

      {/* Goals Page */}
      <GoalsPage
        userId="demo_user_123"
        userTier={selectedUserTier}
      />

      {/* Demo Info Footer */}
      <div className="bg-white border-t border-gray-200 p-6 mt-8">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            CP-5 Implementation Status
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">✅ Completed Components</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• GoalsPage (entry point)</li>
                <li>• GoalCard (progress tracking)</li>
                <li>• GoalFormModal (create/edit)</li>
                <li>• EntitlementGate (Free vs Pro)</li>
                <li>• ChallengeBanner (system suggestions)</li>
                <li>• UpgradePrompt (Pro upsell)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">🔧 Engine Integration</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Goals Engine (CRUD operations)</li>
                <li>• Validation Rules (locked schema)</li>
                <li>• Entitlement System (business rules)</li>
                <li>• Analytics Events (7 events tracked)</li>
                <li>• Progress Tracking (achievement detection)</li>
                <li>• Challenge Assignment (CP-5.1 integration ready)</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Next Steps:</strong> End-to-end testing with Cypress, PostHog analytics verification, 
              and integration with forecast engine for automatic progress updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsDemoPage;