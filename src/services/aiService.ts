import { generateAIPrompt, generateAllAIPrompts, GeneratePromptParams } from "../utils/aiPromptGenerator";

export async function generateImagePrompt(params: GeneratePromptParams): Promise<string> {
  try {
    return await generateAIPrompt(params);
  } catch (error) {
    console.error("AI Service error:", error);
    throw error;
  }
}

export async function generateAllImagePrompts(scenes: Array<{ text: string, prompt: string }>): Promise<Array<{ text: string, prompt: string }>> {
  try {
    return await generateAllAIPrompts(scenes);
  } catch (error) {
    console.error("AI Service batch generation error:", error);
    throw error;
  }
}
