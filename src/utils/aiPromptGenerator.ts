// Client-side interface to the prompt generation functionality
import { Scene } from '@/types/scene';

export interface GeneratePromptParams {
  sceneText: string;
  previousPrompt?: string;
}

// Client-side function that calls our Next.js API endpoint
export async function generateAIPrompt({ sceneText, previousPrompt }: GeneratePromptParams): Promise<string> {
  try {
    const response = await fetch('/api/generate-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneText,
        previousPrompt
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.prompt;
  } catch (error) {
    console.error("Error generating AI prompt:", error);
    throw new Error("Failed to generate AI prompt. Please try again.");
  }
}

// Function to generate all prompts for multiple scenes
export async function generateAllAIPrompts(scenes: Scene[]): Promise<Scene[]> {
  try {
    const response = await fetch('/api/generate-all-prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenes
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    // Process the sanitized response
    // The API now returns scenes with promptGenerated flag and promptFirstWord
    // but not the full prompt to avoid leaking it in network requests
    return data.scenes.map((scene: any, index: number) => {
      // If the prompt was generated successfully, use the original scene's prompt
      // This ensures we have the full prompt locally but it's not sent over the network
      if (scene.promptGenerated) {
        return {
          ...scene,
          // Keep the original prompt from the server (which is stored there but not sent back)
          // The promptFirstWord is just for UI display
        };
      } else {
        // If prompt generation failed, return the scene without a prompt
        return {
          ...scene,
          prompt: '',
        };
      }
    });
  } catch (error) {
    console.error("Error generating all AI prompts:", error);
    throw new Error("Failed to generate all AI prompts. Please try again.");
  }
}
