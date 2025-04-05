'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { useStoryboard } from './StoryboardContext';
import { AbsoluteFill, Sequence } from 'remotion';
import { StoryboardComposition } from '../../remotion/StoryboardComposition';

// Simple composition component
const StoryboardPreview: React.FC<{
  scene: any;
}> = ({ scene }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <img 
        src={scene.imageUrl}
        alt={`Scene ${scene.id || ''}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
      {scene.content && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 4,
          fontSize: 16,
        }}>
          {scene.content.substring(0, 50)}{scene.content.length > 50 ? '...' : ''}
        </div>
      )}
    </AbsoluteFill>
  );
};

export const RemotionTimeline: React.FC = () => {
  const {
    scenes,
    currentTime,
    setCurrentTime,
    totalDuration,
    isPlaying,
    setIsPlaying,
    voiceOver,
    handlePlayPause
  } = useStoryboard();
  
  const playerRef = useRef<PlayerRef>(null);
  const fps = 30;
  
  // Calculate total frames based on all scenes
  const totalFrames = Math.round(totalDuration * fps);
  
  // Sync player with storyboard context
  useEffect(() => {
    if (playerRef.current) {
      // Convert current time to frame
      const frame = Math.round(currentTime * fps);
      
      // Only seek if difference is significant
      if (Math.abs(playerRef.current.getCurrentFrame() - frame) > 1) {
        playerRef.current.seekTo(frame);
      }
      
      // Sync play state
      if (isPlaying && !playerRef.current.isPlaying()) {
        playerRef.current.play();
      } else if (!isPlaying && playerRef.current.isPlaying()) {
        playerRef.current.pause();
      }
    }
  }, [currentTime, isPlaying, fps]);
  
  // Set up event listeners for frame updates
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    
    // Handle frame updates from the player
    const handleFrameUpdate = (e: any) => {
      const frame = e.detail.frame;
      const newTime = frame / fps;
      
      if (Math.abs(newTime - currentTime) > 0.1) {
        setCurrentTime(newTime);
      }
    };
    
    // Add event listener
    player.addEventListener('timeupdate', handleFrameUpdate);
    
    // Clean up
    return () => {
      player.removeEventListener('timeupdate', handleFrameUpdate);
    };
  }, [playerRef, fps, currentTime, setCurrentTime]);
  
  if (scenes.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-md">
        <p className="text-gray-500">Add scenes to preview your storyboard</p>
      </div>
    );
  }
  
  return (
    <div className="w-full flex flex-col items-center bg-black rounded-md overflow-hidden relative">
      {/* Container with max width and centered */}
      <div className="w-full max-w-3xl mx-auto">
        <Player
          ref={playerRef}
          component={StoryboardComposition as React.ComponentType<any>}
          inputProps={{
            scenes,
            voiceOverUrl: voiceOver?.url,
            fps
          }}
          durationInFrames={totalFrames || 30}
          fps={fps}
          compositionWidth={1024}
          compositionHeight={576}
          style={{
            width: '100%',
            aspectRatio: '16/9',
          }}
          controls={false} // Hide Remotion controls
          loop
          clickToPlay={false} // Disable click to play
          renderLoading={() => (
            <div className="flex items-center justify-center h-full bg-black text-white">
              <div className="animate-pulse">Loading preview...</div>
            </div>
          )}
        />
      </div>
      
      {/* Custom play button overlay that uses the storyboard's play/pause function */}
      <div 
        className="absolute top-2 left-2 bg-black/50 rounded-full p-2 cursor-pointer hover:bg-black/70 transition-colors"
        onClick={handlePlayPause}
        style={{ display: 'none' }} // Hide this button since we're using the timeline controls
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        )}
      </div>
    </div>
  );
};
