/**
 * Shared types for the application
 */

export interface Scene {
  id: string;
  content: string;  // The text content of the scene
  prompt?: string;  // The prompt used for image generation
  imageUrl?: string; // URL to the generated image
  seed?: number;    // Seed used for image generation
  duration?: number; // Duration of the scene in seconds for storyboard
}
