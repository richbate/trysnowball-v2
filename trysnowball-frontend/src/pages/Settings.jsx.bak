/**
 * Settings Page
 * User preferences and privacy controls
 */

import React from 'react';
import DemoModeBanner from '../components/DemoModeBanner';
import AnalyticsOptIn from '../components/AnalyticsOptIn';
import { Settings as SettingsIcon, Shield, User, Bell } from 'lucide-react';

const Settings = () => {

 return (
  <div className="min-h-screen bg-bg">
   <DemoModeBanner />
   
   <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {/* Header */}
    <div className="text-center mb-12">
     <div className="flex justify-center mb-6">
      <div className="bg-primary/10 p-3 rounded-full">
       <SettingsIcon className="w-8 h-8 text-primary" />
      </div>
     </div>
     <h1 className="text-4xl font-bold text-text mb-4">
      Settings
     </h1>
     <p className="text-lg text-muted max-w-2xl mx-auto">
      Manage your preferences, privacy settings, and account options.
     </p>
    </div>

    <div className="space-y-8">
     {/* Privacy & Security Section */}
     <section>
      <div className="flex items-center gap-3 mb-6">
       <Shield className="w-6 h-6 text-success" />
       <h2 className="text-2xl font-semibold text-text" id="privacy">
        Privacy & Security
       </h2>
      </div>
      
      <div className="space-y-6">
       {/* Encryption Status */}
       <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-3">
         🔐 Data Encryption
        </h3>
        <div className="space-y-3">
         <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-success rounded-full"></div>
          <span className="text-sm text-muted">
           <strong>AES-256-GCM encryption</strong> - All debt data encrypted before storage
          </span>
         </div>
         <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-success rounded-full"></div>
          <span className="text-sm text-muted">
           <strong>EU data hosting</strong> - Analytics processed in European Union
          </span>
         </div>
         <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-success rounded-full"></div>
          <span className="text-sm text-muted">
           <strong>Zero plaintext storage</strong> - No creditor names or exact balances stored
          </span>
         </div>
        </div>
        <p className="text-xs text-muted mt-4 p-3 bg-success/10 rounded">
         <strong>Your privacy is protected:</strong> We use bank-level encryption and never store 
         your actual debt amounts, creditor names, or personal financial data in readable form.
        </p>
       </div>

       {/* Analytics Opt-in */}
       <AnalyticsOptIn />

       {/* Data Control */}
       <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-3">
         📋 Data Control
        </h3>
        <div className="space-y-4">
         <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-primary mt-0.5" />
          <div>
           <h4 className="font-medium text-text">Account Data</h4>
           <p className="text-sm text-muted">
            All your debt tracking data is encrypted and stored securely. 
            You can export or delete your data at any time.
           </p>
          </div>
         </div>
         <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">
           Export Data
          </button>
          <button className="px-4 py-2 text-sm bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors">
           Delete Account
          </button>
         </div>
        </div>
       </div>
      </div>
     </section>

     {/* Notifications Section (Future) */}
     <section>
      <div className="flex items-center gap-3 mb-6">
       <Bell className="w-6 h-6 text-purple-600" />
       <h2 className="text-2xl font-semibold text-text">
        Notifications
       </h2>
      </div>
      
      <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
       <p className="text-sm text-muted text-center py-8">
        Notification preferences will be available in a future update.
       </p>
      </div>
     </section>
    </div>
   </div>
  </div>
 );
};

export default Settings;