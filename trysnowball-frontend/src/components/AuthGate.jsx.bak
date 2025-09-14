import React from 'react';
import { useAuthStatus } from '../hooks/useAuthStatus';

export default function AuthGate({ children, fallback = null }) {
 const { status } = useAuthStatus();

 if (status === 'checking') {
  return fallback ?? <div data-testid="auth-gate-splash">Loading…</div>;
 }
 // 'authenticated' | 'anonymous' | 'error' proceed — hooks below will branch appropriately
 return children;
}