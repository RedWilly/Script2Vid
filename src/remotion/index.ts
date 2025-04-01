// This file is the entry point for the Remotion bundler
import React from 'react';
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
import { Scene } from '@/types';

// Create a simple wrapper component that doesn't require props
const RemotionRootWrapper = () => {
  // Default empty scenes array - actual scenes will be provided via inputProps when rendering
  const defaultScenes: Scene[] = [];
  
  // Return the RemotionRoot component with default props
  return React.createElement(RemotionRoot, { scenes: defaultScenes });
};

// Register the root component with Remotion
registerRoot(RemotionRootWrapper);
