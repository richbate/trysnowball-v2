import React, { useMemo, useState, useEffect } from 'react';
import { Crown, Shield, HardDrive, Instagram, User } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import CardTitle from '../components/ui/CardTitle';
import Badge from '../components/ui/Badge';
import Switch from '../components/ui/Switch';
import StatPill from '../components/ui/StatPill';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserDebts } from '../hooks/useUserDebts';
import { useSettings } from '../contexts/SettingsContext.tsx';
import { capture } from '../utils/analytics';

export default function Account() {
 const { user, plan } = useAuth();
 const { debts } = useUserDebts();
 const { analyticsEnabled, setAnalyticsEnabled } = useSettings();
 
 // Instagram handle state - stored in localStorage
 const [instagramHandle, setInstagramHandle] = useState('');
 const [isSavingInstagram, setIsSavingInstagram] = useState(false);

 React.useEffect(() => {
  capture('account_viewed', { plan: plan || 'unknown' });
  // Load Instagram handle from localStorage
  const savedHandle = localStorage.getItem('instagram_handle');
  if (savedHandle) {
   setInstagramHandle(savedHandle);
  }
 }, [plan]);

 const debtCount = debts?.length ?? 0;

 const handleManageSubscription = async () => {
  capture('manage_subscription_clicked', { plan });
  // Optional Stripe portal; safe fallback to upgrade page
  try {
   const res = await fetch('/api/billing/portal', { method: 'POST' });
   if (res.ok) {
    const { url } = await res.json();
    if (url) { 
     window.location.href = url; 
     return; 
    }
   }
  } catch (e) {
   console.warn('Billing portal not available:', e);
  }
  window.location.href = '/upgrade';
 };

 const handleExport = () => {
  capture('data_exported', { debtCount });
  const payload = { 
   exportedAt: new Date().toISOString(), 
   user: user?.email ?? null, 
   plan, 
   debts 
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; 
  a.download = 'trysnowball-export.json';
  a.click(); 
  URL.revokeObjectURL(url);
 };

 const handleResetLocal = () => {
  capture('local_cache_reset_requested', {});
  if (window.confirm('This will clear all local data and reload the page. Continue?')) {
   try {
    localStorage.clear();
    if (window.indexedDB?.databases) {
     window.indexedDB.databases().then(dbs => {
      dbs?.forEach(db => { 
       try { 
        indexedDB.deleteDatabase(db.name); 
       } catch (e) {
        console.warn('Failed to delete database:', db.name, e);
       }
      });
     });
    }
   } catch (e) {
    console.warn('Failed to clear storage:', e);
   }
   window.location.reload();
  }
 };

 const onToggleAnalytics = (e) => {
  const enabled = e.target.checked;
  setAnalyticsEnabled(enabled);
  capture('analytics_opt_in_changed', { enabled });
 };

 const handleSaveInstagram = () => {
  setIsSavingInstagram(true);
  // Clean up the handle (remove @ if present, trim spaces)
  const cleanHandle = instagramHandle.trim().replace(/^@/, '');
  
  // Save to localStorage
  localStorage.setItem('instagram_handle', cleanHandle);
  
  // Track analytics
  capture('instagram_handle_saved', { 
   has_handle: !!cleanHandle,
   handle_length: cleanHandle.length 
  });
  
  // Show saved state briefly
  setTimeout(() => {
   setIsSavingInstagram(false);
  }, 1500);
 };


 return (
  <div className="min-h-screen bg-bg">
   <div className="max-w-3xl mx-auto p-6 space-y-6" data-testid="account-page">
   {/* Membership */}
   <Card className="p-5">
    <CardTitle
     icon={<Crown className="h-5 w-5" />}
     title="Membership"
     subtitle="Your current plan and billing options."
     right={plan === 'beta' ? <Badge tone="green">Open Beta (£10/yr)</Badge> : plan === 'pro' ? <Badge tone="purple">Pro</Badge> : <Badge>Free</Badge>}
    />
    <div className="mt-4 flex gap-3">
     {plan === 'beta' ? (
      <>
       <Button onClick={handleManageSubscription}>Manage Subscription</Button>
       <Button variant="secondary" onClick={() => window.location.href = '/plan'}>Go to My Plan</Button>
      </>
     ) : (
      <Button onClick={() => window.location.href = '/upgrade'} data-testid="upgrade-cta">Upgrade to Open Beta</Button>
     )}
    </div>
    <div className="mt-4 flex gap-2">
     <StatPill label="debts" value={debtCount} />
    </div>
    {/* User Information - Helpful for Support */}
    {user && (
     <div className="mt-4 pt-4 border-t border-border">
      <div className="mb-2">
       <span className="text-xs text-muted uppercase tracking-wider">Account Details (for support)</span>
      </div>
      <div className="space-y-2 text-sm bg-bg rounded-lg p-3">
       {user.name && (
        <div className="flex justify-between">
         <span className="text-muted">Name:</span>
         <span className="font-mono text-xs">{user.name}</span>
        </div>
       )}
       <div className="flex justify-between">
        <span className="text-muted">Email:</span>
        <span className="font-mono text-xs select-all">{user.email}</span>
       </div>
       <div className="flex justify-between">
        <span className="text-muted">Account ID:</span>
        <span className="font-mono text-xs select-all">{user.id}</span>
       </div>
       {user.trialStatus && (
        <div className="flex justify-between">
         <span className="text-muted">Trial Status:</span>
         <span className="font-mono text-xs">{user.trialStatus}</span>
        </div>
       )}
       {user.trialEndsAt && (
        <div className="flex justify-between">
         <span className="text-muted">Trial Ends:</span>
         <span className="font-mono text-xs">{new Date(user.trialEndsAt).toLocaleDateString()}</span>
        </div>
       )}
      </div>
      <div className="mt-2 text-xs text-muted">
       When contacting support, please include your Account ID
      </div>
     </div>
    )}
   </Card>

   {/* Social Profile */}
   <Card className="p-5">
    <CardTitle
     icon={<Instagram className="h-5 w-5" />}
     title="Social Profile"
     subtitle="Add your Instagram handle for milestone sharing."
    />
    <div className="mt-4 space-y-3">
     <div className="flex gap-3">
      <div className="flex-1 relative">
       <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted text-sm">@</span>
       <input
        type="text"
        placeholder="your_instagram"
        value={instagramHandle}
        onChange={(e) => setInstagramHandle(e.target.value)}
        className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        maxLength={30}
       />
      </div>
      <Button 
       onClick={handleSaveInstagram} 
       disabled={isSavingInstagram}
       variant={isSavingInstagram ? "secondary" : "primary"}
      >
       {isSavingInstagram ? 'Saved!' : 'Save'}
      </Button>
     </div>
     <div className="text-xs text-muted">
      When you share milestones, we'll include your Instagram handle so people can follow your journey.
     </div>
    </div>
   </Card>

   {/* Analytics & Privacy */}
   <Card className="p-5">
    <CardTitle icon={<Shield className="h-5 w-5" />} title="Analytics & Privacy"
     subtitle="Help improve Snowball with anonymous usage analytics. No sensitive debt content is sent." />
    <div className="mt-4 flex items-center gap-3">
     <Switch checked={!!analyticsEnabled} onChange={onToggleAnalytics} data-testid="analytics-toggle" />
     <span className="text-sm">{analyticsEnabled ? 'Analytics enabled' : 'Analytics disabled'}</span>
    </div>
    <a href="/settings#privacy" className="text-sm underline mt-3 inline-block">Privacy settings & details</a>
   </Card>

   {/* Your Data */}
   <Card className="p-5">
    <CardTitle icon={<HardDrive className="h-5 w-5" />} title="Your Data" right={<span className="text-xs text-muted">{debtCount} debts</span>} />
    <div className="mt-4 flex flex-wrap gap-3">
     <Button onClick={handleExport} data-testid="export-json">Export My Data (JSON)</Button>
     <Button variant="secondary" onClick={handleResetLocal} data-testid="reset-local">Reset Local Cache</Button>
     <Button
      variant="ghost"
      onClick={() => {
       capture('delete_account_requested', {});
       window.location.href = `mailto:hello@trysnowball.co.uk?subject=Delete%20my%20TrySnowball%20account`;
      }}
     >
      Delete Account (request)
     </Button>
    </div>
    <div className="mt-4 rounded-xl border border-danger/60 bg-danger/10 p-4 text-sm text-danger">
     <strong>Heads up:</strong> Reset only clears your device cache. It won't delete your account or Stripe subscription.
    </div>
   </Card>
   </div>
  </div>
 );
}