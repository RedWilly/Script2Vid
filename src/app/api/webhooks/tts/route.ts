import { NextRequest, NextResponse } from 'next/server';
import { createHash, createVerify } from 'crypto';
import fs from 'fs';
import path from 'path';
import { uploadBufferToS3 } from '@/services/s3-service';
import serverConfig from '@/config/server-config';

// Type definition for voice-over result
interface VoiceOverResult {
  success: boolean;
  fileName: string;
  url: string;
  uuid: string;
  voiceId: string;
  duration: number;
}

// Simple in-memory storage for completed voice-overs
// In a production app, this would be stored in a database
export const completedVoiceOvers = new Map<string, VoiceOverResult & { timestamp: number }>();

// This is the webhook endpoint for TTS OpenAI API
export async function POST(request: NextRequest) {
  try {
    // Get the signature from the request header
    const signature = request.headers.get('x-signature');
    
    // Get the request body as text
    const bodyText = await request.text();
    
    console.log('Received webhook payload:', bodyText);
    
    const eventData = JSON.parse(bodyText);
    
    // Log the webhook event for debugging
    console.log('Received TTS webhook event:', eventData.event_name);
    console.log('Event UUID:', eventData.event_uuid);
    
    // Verify the signature if provided
    if (signature) {
      // In a production environment, you would verify the signature here
      // using the public key provided by TTS OpenAI
      // For now, we'll skip this step for simplicity
      
      // Example of how to verify the signature:
      /*
      const isValid = verifySignatureByPublicKey(bodyText, signature, 'path/to/public_key.pem');
      if (!isValid) {
        console.error('Invalid signature');
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
      }
      */
    }
    
    // Handle different event types
    switch (eventData.event_name) {
      case 'TTS_TEXT_SUCCESS':
        const result = await handleTtsTextSucceeded(eventData.data);
        if (result && result.success && 'fileName' in result) {
          // Store the completed voice-over in our temporary storage
          completedVoiceOvers.set(eventData.data.uuid, {
            ...result as VoiceOverResult,
            timestamp: Date.now()
          });
          
          // Clean up old entries (keep only the last 100)
          if (completedVoiceOvers.size > 100) {
            const entries = Array.from(completedVoiceOvers.entries());
            const oldestEntry = entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
            if (oldestEntry) {
              completedVoiceOvers.delete(oldestEntry[0]);
            }
          }
        }
        break;
      case 'TTS_TEXT_FAILED':
        console.error('TTS generation failed:', eventData.data.error_message);
        break;
      case 'TTS_DOCUMENT_SUCCESS':
        // Handle document TTS success if needed
        console.log('TTS document generation succeeded:', eventData.data.uuid);
        break;
      case 'TTS_DOCUMENT_FAILED':
        // Handle document TTS failure if needed
        console.error('TTS document generation failed:', eventData.data.error_message);
        break;
      default:
        console.log('Unhandled event type:', eventData.event_name);
    }
    
    // Return a 200 OK response to acknowledge receipt of the webhook
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing TTS webhook:', error);
    // Still return 200 to prevent retries, but log the error
    return NextResponse.json({ success: false, error: 'Error processing webhook' });
  }
}

/**
 * Handle the TTS_TEXT_SUCCESS event
 * @param data The webhook event data
 */
async function handleTtsTextSucceeded(data: any): Promise<VoiceOverResult | { success: false; error: string }> {
  try {
    console.log('Processing TTS_TEXT_SUCCESS with data:', data);
    
    if (!data.media_url) {
      console.error('No media URL provided in the webhook data');
      return { success: false, error: 'No media URL provided' };
    }
    
    // Download the audio file from the TTS OpenAI API
    console.log('Downloading audio from:', data.media_url);
    const audioResponse = await fetch(data.media_url);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio file from TTS OpenAI: ${audioResponse.status} ${audioResponse.statusText}`);
    }
    
    const audioBuffer = await audioResponse.arrayBuffer();
    console.log(`Downloaded audio file: ${audioBuffer.byteLength} bytes`);
    
    // Generate a filename
    const timestamp = Date.now();
    // Map the TTS OpenAI voice ID back to our internal voice ID if needed
    // For now, we'll just use the provided voice_id
    const voiceId = data.voice_id;
    const fileName = `${timestamp}-${voiceId}-${data.uuid.substring(0, 8)}.mp3`;
    
    console.log('Uploading to S3 with filename:', fileName);
    // Upload the audio file to S3
    const uploadResult = await uploadBufferToS3(
      Buffer.from(audioBuffer),
      fileName,
      'audio/mpeg'
    );
    
    if (!uploadResult) {
      throw new Error('Failed to upload audio file to S3');
    }
    
    const result: VoiceOverResult = {
      success: true,
      fileName,
      url: uploadResult,
      uuid: data.uuid,
      voiceId: data.voice_id,
      duration: data.duration || calculateDuration(data.tts_input)
    };
    
    console.log('Successfully processed TTS webhook and uploaded audio to S3:', result);
    
    // Return the result for storage
    return result;
  } catch (error) {
    console.error('Error handling TTS text succeeded event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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

/**
 * Verify the signature of the webhook payload
 * @param data The webhook payload
 * @param signature The signature from the x-signature header
 * @param publicKeyPath The path to the public key file
 * @returns Whether the signature is valid
 */
function verifySignatureByPublicKey(data: string, signature: string, publicKeyPath: string): boolean {
  try {
    // Load the public key
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

    // Create MD5 hash of the data
    const eventDataHash = createHash('md5').update(data).digest('hex');

    // Verify the signature
    const verifier = createVerify('RSA-SHA256');
    verifier.update(eventDataHash);
    return verifier.verify(publicKey, Buffer.from(signature, 'hex'));
  } catch (e) {
    console.error('Error verifying signature:', e);
    return false;
  }
}
