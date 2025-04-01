import { Scene } from '../types/scene';

/**
 * Generates an image for a single scene using the prepared prompt
 * @param sceneId The ID of the scene
 * @param prompt The prepared prompt to generate an image from
 * @param content The text content to be included in the scene
 * @returns The updated scene with image information
 */
export async function generateImage(sceneId: string, prompt: string, content: string): Promise<Scene> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        sceneId
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: sceneId,
      content,
      prompt,
      imageUrl: data.imageUrl,
      seed: data.seed
    };
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image. Please try again.");
  }
}

/**
 * Generates images for all scenes with prepared prompts
 * @param scenes Array of scenes with prompts
 * @returns Updated array of scenes with image information
 */
export async function generateAllImages(scenes: Scene[]): Promise<Scene[]> {
  try {
    // Filter scenes to only include those with prompts
    const scenesWithPrompts = scenes.filter(scene => scene.prompt);
    
    if (scenesWithPrompts.length === 0) {
      throw new Error("No scenes with prompts found. Please prepare prompts first.");
    }
    
    const response = await fetch('/api/generate-all-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenes: scenesWithPrompts
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Merge the updated scenes with the original scenes array
    // This preserves any scenes that didn't have prompts
    return scenes.map(originalScene => {
      const updatedScene = data.scenes.find((s: Scene) => s.id === originalScene.id);
      return updatedScene || originalScene;
    });
  } catch (error) {
    console.error("Error generating all images:", error);
    throw new Error("Failed to generate all images. Please try again.");
  }
}
