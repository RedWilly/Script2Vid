import { NextRequest, NextResponse } from 'next/server';
import { renderScenesVideo } from '@/lib/services/remotion-service';
import { Scene } from '@/types';

export const maxDuration = 300; // 5 minutes timeout for video rendering

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { scenes, outputFileName, durationPerSceneInSeconds } = body as {
      scenes: Scene[];
      outputFileName: string;
      durationPerSceneInSeconds?: number;
    };
    
    // Validate the request
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: 'No scenes provided or invalid scenes array' },
        { status: 400 }
      );
    }
    
    // Log the scenes data for debugging
    console.log('API received scenes:', JSON.stringify(scenes));
    
    if (!outputFileName) {
      return NextResponse.json(
        { error: 'Output file name is required' },
        { status: 400 }
      );
    }
    
    // Check if all scenes have image URLs
    const missingImages = scenes.filter(scene => !scene.imageUrl);
    if (missingImages.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some scenes are missing images',
          missingScenes: missingImages.map((_, index) => index)
        },
        { status: 400 }
      );
    }
    
    // Generate a safe file name based on the provided name
    const safeFileName = outputFileName
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    
    // Render the video
    const videoUrl = await renderScenesVideo(
      scenes,
      safeFileName,
      durationPerSceneInSeconds || 5
    );
    
    // Return the URL to the rendered video
    return NextResponse.json({ videoUrl });
  } catch (error: any) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: `Failed to generate video: ${error.message}` },
      { status: 500 }
    );
  }
}
