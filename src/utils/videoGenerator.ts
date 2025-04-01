import { Scene } from "@/types";

/**
 * Generate a video from scenes with images
 * @param scenes Array of scenes with content and image URLs
 * @param outputFileName Name for the output video file
 * @param durationPerSceneInSeconds Duration of each scene in seconds
 * @returns Promise with the URL to the generated video
 */
export async function generateVideo(
  scenes: Scene[],
  outputFileName: string,
  durationPerSceneInSeconds = 5
): Promise<string> {
  try {
    // Check if all scenes have images
    const missingImages = scenes.filter(scene => !scene.imageUrl);
    if (missingImages.length > 0) {
      throw new Error(`${missingImages.length} scenes are missing images. Generate images for all scenes first.`);
    }
    
    // Call the API to generate the video
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenes,
        outputFileName,
        durationPerSceneInSeconds,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate video');
    }
    
    const data = await response.json();
    return data.videoUrl;
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}
