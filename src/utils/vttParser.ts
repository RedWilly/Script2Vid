import { SceneWithDuration, CaptionSegment } from '@/components/storyboard/types';

/**
 * Parse a VTT or SRT file content into an array of caption segments
 */
export function parseVTT(vttContent: string): CaptionSegment[] {
  // Detect if this is an SRT file (starts with a number) or VTT file (starts with WEBVTT)
  const isSRT = !vttContent.trim().startsWith('WEBVTT');
  
  if (isSRT) {
    return parseSRT(vttContent);
  } else {
    return parseVTTFormat(vttContent);
  }
}

/**
 * Parse an SRT file content into an array of caption segments
 */
function parseSRT(srtContent: string): CaptionSegment[] {
  const lines = srtContent.trim().split('\n');
  const segments: CaptionSegment[] = [];
  
  let i = 0;
  while (i < lines.length) {
    // Skip empty lines
    if (lines[i].trim() === '') {
      i++;
      continue;
    }
    
    // Skip the index number
    if (/^\d+$/.test(lines[i].trim())) {
      i++;
      
      // Next line should be the timing
      if (i < lines.length && lines[i].includes('-->')) {
        const timingLine = lines[i];
        const textLines: string[] = [];
        
        // Move to the text lines
        i++;
        
        // Collect all text lines until we hit an empty line or the end
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i]);
          i++;
        }
        
        // Parse the timing information
        const [startTimeStr, endTimeStr] = timingLine.split('-->').map(t => t.trim());
        
        // Convert timestamp to seconds
        const startTime = timestampToSeconds(startTimeStr);
        const endTime = timestampToSeconds(endTimeStr);
        
        // Add the segment
        segments.push({
          startTime,
          endTime,
          text: textLines.join(' ').trim()
        });
      }
    } else {
      // If not a number, move to the next line
      i++;
    }
  }
  
  return segments;
}

/**
 * Parse a VTT file content into an array of caption segments
 */
function parseVTTFormat(vttContent: string): CaptionSegment[] {
  const lines = vttContent.trim().split('\n');
  const segments: CaptionSegment[] = [];
  
  // Skip the WEBVTT header
  let i = 0;
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }
  
  // Parse each caption segment
  while (i < lines.length) {
    // Find the timing line (contains -->)
    if (lines[i].includes('-->')) {
      const timingLine = lines[i];
      const textLines: string[] = [];
      
      // Collect all text lines until the next timing line or end of file
      i++;
      while (i < lines.length && !lines[i].includes('-->') && lines[i].trim() !== '') {
        textLines.push(lines[i]);
        i++;
      }
      
      // Skip empty lines
      while (i < lines.length && lines[i].trim() === '') {
        i++;
      }
      
      // Parse the timing information
      const [startTimeStr, endTimeStr] = timingLine.split('-->').map(t => t.trim());
      
      // Convert timestamp to seconds
      const startTime = timestampToSeconds(startTimeStr);
      const endTime = timestampToSeconds(endTimeStr);
      
      // Add the segment
      segments.push({
        startTime,
        endTime,
        text: textLines.join(' ').trim()
      });
    } else {
      // Skip non-timing lines
      i++;
    }
  }
  
  return segments;
}

/**
 * Convert a timestamp (00:00.000, 00:00:00.000, or 00:00:00,000) to seconds
 * Handles both VTT and SRT formats
 */
export function timestampToSeconds(timestamp: string): number {
  // Replace comma with period for SRT format
  const normalizedTimestamp = timestamp.replace(',', '.');
  
  let parts: string[];
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  
  if (normalizedTimestamp.includes(':')) {
    parts = normalizedTimestamp.split(':');
    if (parts.length === 3) {
      // Format: 00:00:00.000
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
      seconds = parseFloat(parts[2]);
    } else if (parts.length === 2) {
      // Format: 00:00.000
      minutes = parseInt(parts[0], 10);
      seconds = parseFloat(parts[1]);
    }
  } else {
    seconds = parseFloat(normalizedTimestamp);
  }
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Calculate simple similarity between two strings (word overlap)
 * Returns a score between 0 and 1, where 1 is a perfect match.
 * This version counts all words.
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  let matchCount = 0;
  for (const word of words1) {
    if (words2.includes(word)) {
      matchCount++;
    }
  }
  
  return matchCount / Math.max(words1.length, 1);
}

/**
 * Calculate the overlap fraction between a scene's text and a caption's text.
 * It returns the fraction of the caption's words that are found in the scene's text.
 */
function calculateOverlapFraction(sceneText: string, captionText: string): number {
  const sceneWords = sceneText.toLowerCase().split(/\s+/);
  const captionWords = captionText.toLowerCase().split(/\s+/);
  
  let matchCount = 0;
  captionWords.forEach(word => {
    if (sceneWords.includes(word)) {
      matchCount++;
    }
  });
  
  return matchCount / Math.max(captionWords.length, 1);
}

/**
 * Find the best matching scene index for a caption segment based on text similarity
 */
export function findMatchingSceneIndex(
  captionText: string, 
  scenes: { content: string }[]
): number {
  let bestMatchIndex = 0;
  let bestMatchScore = 0;
  
  scenes.forEach((scene, index) => {
    const score = calculateSimilarity(captionText.toLowerCase(), scene.content.toLowerCase());
    if (score > bestMatchScore) {
      bestMatchScore = score;
      bestMatchIndex = index;
    }
  });
  
  return bestMatchIndex;
}


/**
 * Synchronize scene durations with caption timing using sequential matching.
 * 
 * This function assumes that both the scenes and the caption segments are in order.
 * For each scene, it accumulates the durations of as many consecutive caption segments as needed
 * until it has roughly covered the number of words in the scene's content.
 * It also ensures that the total duration of all scenes matches the total duration of all caption segments.
 */
export function syncSceneDurations(
  scenes: SceneWithDuration[],
  captionSegments: CaptionSegment[],
  voiceOverDuration?: number // Add optional parameter for total voice-over duration
): SceneWithDuration[] {
  // Create a deep copy of scenes to avoid mutating the original
  const updatedScenes = JSON.parse(JSON.stringify(scenes)) as SceneWithDuration[];

  // If no caption segments, return the original scenes
  if (captionSegments.length === 0) {
    return updatedScenes;
  }

  // Calculate the total voice-over duration from captions
  const captionEndTime = captionSegments.length > 0 
    ? captionSegments[captionSegments.length - 1].endTime 
    : 0;
  
  // Use the provided voiceOverDuration if available, otherwise use caption end time
  const totalVoiceOverDuration = voiceOverDuration || captionEndTime;
  
  console.log(`Total voice-over duration from parameter: ${voiceOverDuration || 'not provided'}`);
  console.log(`Caption end time: ${captionEndTime}`);
  console.log(`Using voice-over duration: ${totalVoiceOverDuration}`);

  // A pointer for the caption segments
  let captionIndex = 0;

  // For each scene, find the corresponding caption segments
  updatedScenes.forEach((scene, sceneIndex) => {
    const sceneWords = scene.content.split(/\s+/).filter((w) => w.length > 0);
    const sceneWordCount = sceneWords.length;
    let accumulatedWordCount = 0;
    let accumulatedDuration = 0;
    
    const startCaptionIndex = captionIndex;
    
    // Find caption segments that correspond to this scene
    while (
      captionIndex < captionSegments.length && 
      accumulatedWordCount < sceneWordCount
    ) {
      const segment = captionSegments[captionIndex];
      const segmentWords = segment.text.split(/\s+/).filter((w) => w.length > 0);
      accumulatedWordCount += segmentWords.length;
      accumulatedDuration += segment.endTime - segment.startTime;
      captionIndex++;
    }
    
    // Ensure minimum duration
    scene.duration = Math.max(accumulatedDuration, 1);
  });

  // Calculate the total duration of all scenes after initial assignment
  const totalSceneDuration = updatedScenes.reduce((total, scene) => total + scene.duration, 0);

  // Check if there's remaining voice-over time not covered by scenes
  if (totalVoiceOverDuration > totalSceneDuration) {
    const remainingDuration = totalVoiceOverDuration - totalSceneDuration;
    console.log(`Remaining voice-over duration not covered by scenes: ${remainingDuration.toFixed(2)}s`);

    // Distribute the remaining duration to the last scene
    if (updatedScenes.length > 0) {
      const lastScene = updatedScenes[updatedScenes.length - 1];
      lastScene.duration += remainingDuration;
      console.log(`Extended last scene duration to cover full voice-over: ${lastScene.duration.toFixed(2)}s`);
    }
  }

  // Log the total durations for debugging
  console.log(`Total voice-over duration: ${totalVoiceOverDuration.toFixed(2)}s`);
  console.log(`Total scene duration after adjustment: ${updatedScenes.reduce((total, scene) => total + scene.duration, 0).toFixed(2)}s`);

  return updatedScenes;
}


// Re-export CaptionSegment for convenience
export type { CaptionSegment };
