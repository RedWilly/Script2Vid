/**
 * Represents a scene in the script visualization
 */
export interface Scene {
  id: string;
  content: string;  // The text content of the scene
  prompt?: string;  // The prompt used for image generation
  imageUrl?: string; // URL to the generated image
  seed?: number;    // Seed used for image generation
  error?: string;   // Optional error message if generation fails
}
