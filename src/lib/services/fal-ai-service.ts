/**
 * Service for interacting with the fal.ai API to generate images from text prompts
 */

import { IMAGE_STYLE_PREFIX } from '../constants';

// Define image size enum for fal.ai
export enum FalAiImageSize {
  SQUARE_HD = 'square_hd',
  SQUARE = 'square',
  PORTRAIT_4_3 = 'portrait_4_3',
  PORTRAIT_16_9 = 'portrait_16_9',
  LANDSCAPE_4_3 = 'landscape_4_3',
  LANDSCAPE_16_9 = 'landscape_16_9'
}

// Define types for the fal.ai API requests and responses
interface FalAiImageGenerationRequest {
  prompt: string;
  image_size?: FalAiImageSize; // Use the enum for image size
  num_inference_steps?: number; // Default: 4
  num_images?: number; // Number of images to generate
  enable_safety_checker?: boolean; // Enable safety checker
  seed?: number; // Random seed for reproducibility
}

// Updated response type based on actual API response
interface FalAiImageGenerationResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
  timings?: {
    inference: number;
  };
  has_nsfw_concepts?: boolean[];
  prompt?: string;
}

interface FalAiQueueResponse {
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * Generates an image using the fal.ai Flux Schnell model
 * @param prompt The text prompt to generate an image from
 * @returns The generated image URL and metadata
 */
export async function generateImageWithFalAi(prompt: string): Promise<{ imageUrl: string; seed: number }> {
  // Get API key from environment variables
  const falApiKey = process.env.FAL_KEYS;
  
  if (!falApiKey) {
    throw new Error('FAL_KEYS environment variable is not set');
  }

  // Prepare the request payload
  const payload: FalAiImageGenerationRequest = {
    prompt,
    image_size: FalAiImageSize.LANDSCAPE_16_9, // 16:9 aspect ratio
    num_inference_steps: 4,
    num_images: 1, // Generate only one image
    enable_safety_checker: true, // Enable safety checker
    seed: -1 // Use -1 for random seed
  };

  try {
    // Make the API request to fal.ai queue endpoint
    const response = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit image generation request: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Get the request ID from the queue response
    const queueResponse = await response.json() as FalAiQueueResponse;
    const requestId = queueResponse.request_id;

    console.log(`Image generation request submitted with ID: ${requestId}`);

    // Poll for the result
    const result = await pollForResult(requestId, falApiKey);
    
    // Return the first generated image URL and the seed
    return {
      imageUrl: result.images[0].url,
      seed: result.seed
    };
  } catch (error) {
    console.error('Error generating image with fal.ai:', error);
    throw error;
  }
}

/**
 * Polls the fal.ai API for the result of an image generation request
 * @param requestId The ID of the request to poll for
 * @param apiKey The API key to use for authentication
 * @returns The generated image data
 */
async function pollForResult(requestId: string, apiKey: string): Promise<FalAiImageGenerationResponse> {
  // Maximum number of attempts before giving up
  const maxAttempts = 30;
  // Delay between polling attempts in milliseconds
  const pollingDelay = 1000;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`Polling for result (attempt ${attempt + 1}/${maxAttempts})...`);
      
      // Get the result directly instead of checking status first
      const resultResponse = await fetch(`https://queue.fal.run/fal-ai/flux/requests/${requestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Key ${apiKey}`
        }
      });
      
      if (resultResponse.ok) {
        const result = await resultResponse.json();
        console.log(`Result received successfully`);
        return result as FalAiImageGenerationResponse;
      }
      
      // If we get a 404, the request is still processing
      if (resultResponse.status === 404) {
        console.log(`Request still processing, waiting ${pollingDelay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, pollingDelay));
        continue;
      }
      
      // For other errors, throw an exception
      const errorText = await resultResponse.text();
      throw new Error(`Failed to get request result: ${resultResponse.status} ${resultResponse.statusText} - ${errorText}`);
    } catch (error) {
      console.error(`Error polling for result (attempt ${attempt + 1}/${maxAttempts}):`, error);
      
      // If we've reached the maximum number of attempts, throw the error
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      
      // Otherwise, wait before trying again
      await new Promise(resolve => setTimeout(resolve, pollingDelay));
    }
  }
  
  throw new Error(`Timed out waiting for image generation result after ${maxAttempts} attempts`);
}

/**
 * Enhances a prompt with style information if not already present
 * @param prompt The base prompt to enhance
 * @returns The enhanced prompt
 */
export function enhancePrompt(prompt: string): string {
  // If the prompt already contains the style prefix, return it as is
  if (prompt.includes(IMAGE_STYLE_PREFIX)) {
    return prompt;
  }
  
  // Otherwise, add the style prefix
  return `${IMAGE_STYLE_PREFIX} ${prompt}`;
}
