/**
 * Service for server-side rendering of videos using Remotion
 */

import path from 'path';
import fs from 'fs/promises';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { Scene } from '@/types';

// Ensure the output directory exists
const ensureOutputDir = async (dir: string) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    // Directory already exists or cannot be created
    console.error('Error creating output directory:', err);
  }
};

/**
 * Renders a video from a series of scenes using Remotion SSR
 * @param scenes Array of scenes with content and image URLs
 * @param outputFileName Name of the output video file (without extension)
 * @param durationPerSceneInSeconds Duration of each scene in seconds
 * @returns Path to the rendered video file
 */
export async function renderScenesVideo(
  scenes: Scene[],
  outputFileName: string,
  durationPerSceneInSeconds = 5
): Promise<string> {
  // Define paths
  const compositionId = 'SceneVideo';
  const entry = path.resolve(process.cwd(), 'src/remotion/index.ts');
  const outputDir = path.resolve(process.cwd(), 'public/videos');
  const outputPath = path.join(outputDir, `${outputFileName}.mp4`);
  
  // Ensure the output directory exists
  await ensureOutputDir(outputDir);
  
  try {
    console.log('Bundling Remotion project...');
    
    // Bundle the Remotion project
    const bundleLocation = await bundle(entry);
    
    // Select the composition to render
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
    });
    
    // Calculate video dimensions based on composition
    const { width, height, fps } = composition;
    
    // Calculate total duration in frames with a minimum to prevent 0 duration
    const minDurationInSeconds = 1; // Minimum 1 second even if no scenes
    const totalDurationInFrames = Math.max(
      Math.round(scenes.length * durationPerSceneInSeconds * fps),
      Math.round(minDurationInSeconds * fps)
    );
    
    console.log('Rendering video...');
    console.log(`Resolution: ${width}x${height}, FPS: ${fps}, Duration: ${totalDurationInFrames} frames`);
    
    // Render the video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        scenes: scenes.map(scene => ({
          ...scene,
          // Ensure imageUrl is an absolute URL that can be accessed by the renderer
          imageUrl: scene.imageUrl?.startsWith('http') 
            ? scene.imageUrl 
            : scene.imageUrl?.startsWith('/') 
              ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${scene.imageUrl}`
              : scene.imageUrl
        })),
        durationPerSceneInSeconds,
      },
      // Set quality and other rendering options
      imageFormat: 'jpeg',
      jpegQuality: 90,
      chromiumOptions: {
        disableWebSecurity: true, // Allow loading images from external URLs
      },
    });
    
    console.log(`Video rendered successfully: ${outputPath}`);
    
    // Return the public URL path to the video
    return `/videos/${outputFileName}.mp4`;
  } catch (error: any) {
    console.error('Error rendering video:', error);
    throw new Error(`Failed to render video: ${error.message}`);
  }
}
