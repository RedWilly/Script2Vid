import { AbsoluteFill, Img, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Scene } from '@/types';
import React from 'react';

interface SceneSequenceProps {
  scene: Scene;
  startFrame: number;
  durationInFrames: number;
}

// Component for a single scene in the video
export const SceneSequence: React.FC<SceneSequenceProps> = ({ scene, startFrame, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Calculate opacity for fade in/out effect
  const fadeInDuration = Math.min(fps, durationInFrames / 4);
  const fadeOutDuration = Math.min(fps, durationInFrames / 4);
  const fadeOutStart = durationInFrames - fadeOutDuration;
  
  const opacity = interpolate(
    frame - startFrame,
    [0, fadeInDuration, fadeOutStart, durationInFrames],
    [0, 1, 1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  // Calculate scale for subtle zoom effect
  const scale = interpolate(
    frame - startFrame,
    [0, durationInFrames],
    [1, 1.05],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );
  
  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ opacity, backgroundColor: 'black' }}>
        {scene.imageUrl && (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            <Img 
              src={scene.imageUrl} 
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `scale(${scale})`,
              }} 
            />
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          padding: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          textAlign: 'center',
          fontSize: '24px',
          fontFamily: 'Arial, sans-serif',
        }}>
          {scene.content}
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

interface SceneVideoProps {
  scenes: Scene[];
  durationPerSceneInSeconds: number;
}

// Main video component that composes all scenes
export const SceneVideo: React.FC<SceneVideoProps> = ({ scenes, durationPerSceneInSeconds = 5 }) => {
  const { fps } = useVideoConfig();
  const framesTotalPerScene = Math.round(durationPerSceneInSeconds * fps);
  
  console.log('SceneVideo received scenes:', JSON.stringify(scenes));
  
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {scenes && scenes.length > 0 ? (
        scenes.map((scene, index) => {
          // Skip scenes without image URLs
          if (!scene.imageUrl) {
            console.log(`Scene ${index} has no image URL, skipping`);
            return null;
          }
          
          return (
            <Sequence
              key={scene.id || `scene-${index}`}
              from={index * framesTotalPerScene}
              durationInFrames={framesTotalPerScene}
            >
              <SceneItem 
                scene={scene} 
                framesTotalPerScene={framesTotalPerScene}
              />
            </Sequence>
          );
        }).filter(Boolean)
      ) : (
        // Fallback content when no scenes are available
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          color: 'white',
          fontSize: 32,
          fontFamily: 'sans-serif'
        }}>
          No scenes available
        </div>
      )}
    </AbsoluteFill>
  );
};

interface SceneItemProps {
  scene: Scene;
  framesTotalPerScene: number;
}

const SceneItem: React.FC<SceneItemProps> = ({ scene, framesTotalPerScene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Calculate fade in/out frames (20% of total duration for each)
  const fadeInFrames = Math.round(framesTotalPerScene * 0.2);
  const fadeOutFrames = Math.round(framesTotalPerScene * 0.2);
  const fadeOutStartFrame = framesTotalPerScene - fadeOutFrames;
  
  // Calculate opacity based on fade in/out
  let opacity = 1;
  if (frame < fadeInFrames) {
    opacity = frame / fadeInFrames;
  } else if (frame >= fadeOutStartFrame) {
    opacity = 1 - (frame - fadeOutStartFrame) / fadeOutFrames;
  }
  
  // Calculate zoom effect (subtle zoom from 1.05 to 1.0)
  const zoomProgress = spring({
    frame,
    fps,
    config: {
      damping: 200,
      stiffness: 5,
      mass: 0.5,
    },
  });
  const zoom = 1.05 - 0.05 * zoomProgress;
  
  console.log('Rendering scene with image URL:', scene.imageUrl);
  
  // Ensure the image URL is absolute for Remotion to access it
  const getAbsoluteImageUrl = (url: string | undefined) => {
    if (!url) return '';  
    if (url.startsWith('http')) return url;
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
    return url.startsWith('/') ? `${baseUrl}${url}` : url;
  };
  
  const absoluteImageUrl = getAbsoluteImageUrl(scene.imageUrl);
  console.log('Absolute image URL:', absoluteImageUrl);
  
  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        opacity,
      }}
    >
      {scene.imageUrl ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <Img
            src={absoluteImageUrl}
            alt={scene.content}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${zoom})`,
            }}
          />
          
          {/* Caption overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '20px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              color: 'white',
              fontSize: '24px',
              fontFamily: 'Arial, sans-serif',
              textAlign: 'center',
            }}
          >
            {scene.content}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          color: 'white',
          fontSize: 24,
          fontFamily: 'sans-serif',
          textAlign: 'center',
          padding: '20px'
        }}>
          {scene.content}
        </div>
      )}
    </AbsoluteFill>
  );
};
