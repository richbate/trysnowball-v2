/**
 * HomeSwitch - Smart router for home page
 * Shows Landing for logged-out, Home for logged-in
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import Landing from './Landing';
import Home from './Home';

export default function HomeSwitch() {
 const { user, authReady } = useAuth();
 
 // Never block with skeleton - show Landing while checking
 if (!authReady) return <Landing />;
 
 // Smart switch: authenticated users see dashboard, others see marketing
 return user ? <Home /> : <Landing />;
}