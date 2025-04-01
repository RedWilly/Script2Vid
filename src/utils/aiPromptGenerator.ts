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
    return data.scenes;
  } catch (error) {
    console.error("Error generating all AI prompts:", error);
    throw new Error("Failed to generate all AI prompts. Please try again.");
  }
}
