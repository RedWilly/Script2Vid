import { generateAIPrompt, generateAllAIPrompts, GeneratePromptParams } from "../utils/aiPromptGenerator";
import { Scene } from "@/types/scene";

export async function generateImagePrompt(params: GeneratePromptParams): Promise<string> {
  try {
    return await generateAIPrompt(params);
  } catch (error) {
    console.error("AI Service error:", error);
    throw error;
  }
}

export async function generateAllImagePrompts(scenes: Scene[]): Promise<Scene[]> {
  try {
    return await generateAllAIPrompts(scenes);
  } catch (error) {
    console.error("AI Service batch generation error:", error);
    throw error;
  }
}
