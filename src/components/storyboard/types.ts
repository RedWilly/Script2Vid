import { Scene } from "@/types";

// Extend the base Scene type with required duration
export interface SceneWithDuration extends Scene {
  id: string;
  duration: number;
}

// Constants
export const MIN_SCENE_DURATION = 0.5; // Minimum duration in seconds
export const DEFAULT_SCENE_DURATION = 5.0; // Default duration in seconds

// Helper function to format duration
export const formatDuration = (timeInSeconds: number): string => {
  return `${timeInSeconds.toFixed(1)}s`;
};

// Helper function to format display time (MM:SS)
export const formatDisplayTime = (timeInSeconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(timeInSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
