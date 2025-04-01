import { Composition } from 'remotion';
import { SceneVideo } from './SceneVideo';
import { Scene } from '@/types';

// Default duration per scene in seconds
const DEFAULT_DURATION_PER_SCENE = 5;
// Minimum duration in frames (at 30fps) to prevent 0 duration errors
const MIN_DURATION_IN_FRAMES = 30; // 1 second at 30fps

export const RemotionRoot: React.FC<{
  scenes: Scene[];
  durationPerSceneInSeconds?: number;
}> = ({ scenes, durationPerSceneInSeconds = DEFAULT_DURATION_PER_SCENE }) => {
  // Calculate total duration in frames (assuming 30fps)
  const fps = 30;
  const calculatedDuration = Math.round(scenes.length * durationPerSceneInSeconds * fps);
  // Ensure we have a minimum duration even if scenes array is empty
  const totalDurationInFrames = Math.max(calculatedDuration, MIN_DURATION_IN_FRAMES);
  
  return (
    <>
      <Composition
        id="SceneVideo"
        component={SceneVideo as unknown as React.ComponentType<Record<string, unknown>>}
        durationInFrames={totalDurationInFrames}
        fps={fps}
        width={1920}
        height={1080}
        defaultProps={{
          scenes,
          durationPerSceneInSeconds
        }}
      />
    </>
  );
};
