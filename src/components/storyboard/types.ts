import { Scene } from "@/types";
import { KenBurnsConfig } from "../effects/ken-burns-effect";

// Extend the base Scene type with required duration
export interface SceneWithDuration extends Scene {
  id: string;
  content: string;
  prompt: string;
  imageUrl: string;
  seed: number;
  imageGenerated: boolean;
  duration: number;
  kenBurns?: KenBurnsConfig; // Ken Burns effect configuration
}

// Voice-over file interface
export interface VoiceOverFile {
  id: string;
  name: string;
  url: string;
  duration: number;
  voiceId?: string; // Optional voice identifier
}

// Word segment interface for word-level timestamps
export interface WordSegment {
  startTime: number;
  endTime: number;
  word: string;
}

// Caption segment interface
export interface CaptionSegment {
  startTime: number;
  endTime: number;
  text: string;
  words?: WordSegment[]; // Optional array of word-level timestamps
}

// Caption file interface
export interface CaptionFile {
  name: string;
  url: string;
  segments?: CaptionSegment[];
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
