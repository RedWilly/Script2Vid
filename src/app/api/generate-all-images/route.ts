import { NextRequest, NextResponse } from 'next/server';
import { generateImageWithFalAi, enhancePrompt } from '@/lib/services/fal-ai-service';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { scenes } = body;

    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json(
        { error: 'Scenes array is required' },
        { status: 400 }
      );
    }

    // Process each scene with a prompt
    const results = await Promise.all(
      scenes.map(async (scene) => {
        // Skip scenes without prompts
        if (!scene.prompt) {
          return {
            ...scene,
            imageGenerated: false,
            error: 'No prompt available'
          };
        }

        try {
          // Enhance the prompt with style information if needed
          const enhancedPrompt = enhancePrompt(scene.prompt);
          
          // Generate the image
          const { imageUrl, seed } = await generateImageWithFalAi(enhancedPrompt);
          
          // Return the updated scene with image information
          return {
            ...scene,
            imageUrl,
            seed,
            imageGenerated: true
          };
        } catch (error) {
          console.error(`Error generating image for scene ${scene.id}:`, error);
          
          return {
            ...scene,
            imageGenerated: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      })
    );

    // Return the results
    return NextResponse.json({
      success: true,
      scenes: results
    });
  } catch (error) {
    console.error('Error in generate-all-images API route:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate images',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
