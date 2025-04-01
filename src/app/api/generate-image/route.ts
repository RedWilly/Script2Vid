import { NextRequest, NextResponse } from 'next/server';
import { generateImageWithFalAi, enhancePrompt } from '@/lib/services/fal-ai-service';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { prompt, sceneId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Enhance the prompt with style information if needed
    const enhancedPrompt = enhancePrompt(prompt);

    // Generate the image
    const { imageUrl, seed } = await generateImageWithFalAi(enhancedPrompt);

    // Return the generated image URL and metadata
    return NextResponse.json({
      success: true,
      imageUrl,
      seed,
      sceneId
    });
  } catch (error) {
    console.error('Error in generate-image API route:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
