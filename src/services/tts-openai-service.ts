import serverConfig from '@/config/server-config';
import { uploadBufferToS3 } from './s3-service';
import { VOICE_OPTIONS } from '@/types';

/**
 * Generate speech from text using TTS OpenAI API
 * @param text The text to convert to speech
 * @param voiceId The voice ID to use
 * @returns Object containing success status, file URL, and duration
 */
export async function generateSpeech(text: string, voiceId: string): Promise<{
  success: boolean;
  fileName?: string | null;
  url?: string | null;
  duration?: number | null;
  error?: string | null;
  uuid?: string | null;
  status?: string | null;
  statusPercentage?: number | null;
}> {
  try {
    // Find the voice in our options
    const voice = VOICE_OPTIONS.find(v => v.id === voiceId);
    
    // Use the Id from the voice, or default to 'echo' if not found
    const ttsVoiceId = voice?.id;
    
    console.log('Making request to TTS OpenAI API with:', {
      model: 'tts-1',
      voice_id: ttsVoiceId,
      speed: 1.0,
      input: text.substring(0, 50) + '...' // Log just the beginning for debugging
    });
    
    // Make request to TTS OpenAI API
    const response = await fetch('https://api.ttsopenai.com/uapi/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': serverConfig.tts.openaiApiKey,
      },
      body: JSON.stringify({
        model: 'tts-1', // Using the standard model, could be tts-1-hd for higher quality
        voice_id: ttsVoiceId,
        speed: 1.0, // Default speed
        input: text,
      }),
    });

    // Log the raw response for debugging
    const responseText = await response.text();
    console.log('TTS OpenAI API response:', responseText);
    
    // Parse the response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse TTS OpenAI API response:', e);
      throw new Error('Invalid response from TTS OpenAI API');
    }

    if (!response.ok || !responseData.success) {
      const errorMessage = responseData.error || responseData.message || 'Unknown error';
      console.error('TTS OpenAI API error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const result = responseData.result;
    console.log('TTS OpenAI API result:', result);
    
    // The API doesn't return a media_url immediately
    // Instead, it returns a status and UUID, and we need to wait for the webhook
    
    // Map status codes to readable status
    const statusMap: Record<number, string> = {
      1: 'converting',
      2: 'completed',
      3: 'error',
      11: 'reworking',
      12: 'joining_audio',
      13: 'merging_audio',
      14: 'downloading_audio'
    };
    
    // Calculate estimated duration
    const duration = calculateDuration(text);
    
    // Return the UUID and status for the client to track
    return {
      success: true,
      uuid: result.uuid,
      status: statusMap[result.status] || 'unknown',
      statusPercentage: result.status_percentage,
      duration,
      // We'll get the media_url from the webhook when it's ready
    };
  } catch (error) {
    console.error('Error generating speech:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate an estimated duration based on text length
 * @param text The input text
 * @returns Estimated duration in seconds
 */
function calculateDuration(text: string): number {
  // A very rough estimate: ~3 characters per word, ~150 words per minute
  // This is just a fallback if the API doesn't provide duration
  if (!text) return 0;
  const words = text.split(/\s+/).length;
  const minutes = words / 150;
  return Math.max(1, Math.round(minutes * 60));
}
