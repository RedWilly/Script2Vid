'use client';

import React, { useEffect, useState } from 'react';
import { AbsoluteFill } from 'remotion';
import { SceneWithDuration } from '../components/storyboard/types';

interface SceneFrameProps {
  scene: SceneWithDuration;
  width: number;
  height: number;
}

export const SceneFrame: React.FC<SceneFrameProps> = ({ scene, width, height }) => {
  // Track image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Use the existing preloaded image if available
  useEffect(() => {
    // Check if image is already in browser cache
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src = scene.imageUrl;
    
    // If image is already complete, it was cached
    if (img.complete) {
      setImageLoaded(true);
    }
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [scene.imageUrl]);
  
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Loading state */}
      {!imageLoaded && !imageError && (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#111',
          color: 'white',
        }}>
          <div className="animate-pulse">Loading scene...</div>
        </div>
      )}
      
      {/* Error state */}
      {imageError && (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#300',
          color: 'white',
        }}>
          Failed to load image
        </div>
      )}
      
      {/* Scene image */}
      <img 
        src={scene.imageUrl}
        alt={`Scene ${scene.id || ''}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: imageLoaded ? 1 : 0, // Only show when loaded
          transition: 'opacity 0.3s ease',
        }}
      />
      
      {/* Scene content overlay */}
      {scene.content && imageLoaded && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 4,
            fontSize: 16,
            fontWeight: 'bold',
            maxWidth: '80%',
          }}
        >
          {scene.content.substring(0, 50)}{scene.content.length > 50 ? '...' : ''}
        </div>
      )}
    </AbsoluteFill>
  );
};
