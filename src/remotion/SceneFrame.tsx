'use client';

import React, { useEffect, useState } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneWithDuration, CaptionSegment } from '../components/storyboard/types';
import { CaptionOverlay } from './CaptionOverlay';
import { getKenBurnsTransform } from '../components/effects/ken-burns-effect';

interface SceneFrameProps {
  scene: SceneWithDuration;
  sceneStartTime: number;
  captionSegments?: CaptionSegment[];
}

export const SceneFrame: React.FC<SceneFrameProps> = ({
  scene,
  sceneStartTime,
  captionSegments = []
}) => {
  // Track image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get current frame and video config for Ken Burns effect
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate the duration in frames for this scene
  const durationInFrames = Math.round(scene.duration * fps);

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

      {/* Scene image with Ken Burns effect if enabled */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'hidden',
        }}
      >
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
            transform: scene.kenBurns?.enabled
              ? getKenBurnsTransform(frame, durationInFrames, scene.kenBurns)
              : 'none',
            transformOrigin: 'center center',
          }}
        />
      </div>

      {/* Caption overlay */}
      {captionSegments.length > 0 && imageLoaded && (
        <CaptionOverlay
          captionSegments={captionSegments}
          sceneStartTime={sceneStartTime}
          sceneDuration={scene.duration}
        />
      )}
    </AbsoluteFill>
  );
};
