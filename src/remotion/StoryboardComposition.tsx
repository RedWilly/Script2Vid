'use client';

import React from 'react';
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneWithDuration, CaptionSegment } from '../components/storyboard/types';
import { SceneFrame } from './SceneFrame';

export interface StoryboardCompositionProps {
  scenes: SceneWithDuration[];
  voiceOverUrl?: string;
  captionSegments?: CaptionSegment[];
  fps: number;
}

export const StoryboardComposition: React.FC<StoryboardCompositionProps> = ({
  scenes,
  voiceOverUrl,
  captionSegments = [],
  fps = 30,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Calculate the total duration in frames
  const getTotalFrames = (scenes: SceneWithDuration[]) => {
    return scenes.reduce((acc, scene) => {
      return acc + Math.round(scene.duration * fps);
    }, 0);
  };

  // Calculate frame offsets for each scene
  const getSceneFrameOffsets = (scenes: SceneWithDuration[]) => {
    let offset = 0;
    return scenes.map((scene) => {
      const currentOffset = offset;
      offset += Math.round(scene.duration * fps);
      return {
        scene,
        startFrame: currentOffset,
        endFrame: offset - 1,
        startTime: currentOffset / fps, // Add start time in seconds
      };
    });
  };

  const sceneOffsets = getSceneFrameOffsets(scenes);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Render each scene as a sequence */}
      {sceneOffsets.map(({ scene, startFrame, endFrame, startTime }) => (
        <Sequence
          key={scene.id}
          from={startFrame}
          durationInFrames={endFrame - startFrame + 1}
        >
          <SceneFrame
            scene={scene}
            sceneStartTime={startTime}
            captionSegments={captionSegments}
          />
        </Sequence>
      ))}

      {/* Add voice-over audio if available */}
      {voiceOverUrl && (
        <Audio src={voiceOverUrl} />
      )}
    </AbsoluteFill>
  );
};
