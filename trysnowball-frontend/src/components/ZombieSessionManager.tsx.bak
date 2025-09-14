/**
 * ZombieSessionManager - Orchestrates all zombie session detection and recovery
 * Single component that handles the entire zombie session system
 */

import React from 'react';
import { useZombieSessionDetector } from '../hooks/useZombieSessionDetector';
import { useZombieRecovery } from '../hooks/useZombieRecovery';
import ZombieSessionModal from './ZombieSessionModal';

const ZombieSessionManager: React.FC = () => {
 // Initialize zombie session detection
 const [zombieState, zombieActions] = useZombieSessionDetector();
 
 // Initialize recovery system
 const { isRecovering } = useZombieRecovery();

 return (
  <ZombieSessionModal
   isVisible={zombieState.showModal}
   localDataCount={zombieState.localDataCount}
   recoveryInProgress={zombieState.recoveryInProgress || isRecovering}
   onReauth={zombieActions.initiateReauth}
   onContinueOffline={zombieActions.continueOffline}
   onDismiss={zombieActions.dismissModal}
  />
 );
};

export default ZombieSessionManager;