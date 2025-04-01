import { Scene } from "@/types";

/**
 * This function is a stub as Remotion has been removed from the project
 * The video generation functionality is no longer available
 */
export async function generateVideo(
  scenes: Scene[],
  outputFileName: string,
  durationPerSceneInSeconds = 5
): Promise<string> {
  throw new Error('Video generation functionality has been removed from the project');
}
