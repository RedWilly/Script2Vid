import { NextRequest, NextResponse } from 'next/server';
import { ensureBucketExists } from '@/services/s3-service';
import { generateSpeech } from '@/services/tts-openai-service';

export async function POST(request: NextRequest) {
  try {
    // Ensure the bucket exists first
    await ensureBucketExists();
    
    const { script, voiceId } = await request.json();
    
    if (!script) {
      return NextResponse.json(
        { success: false, error: 'No script provided' },
        { status: 400 }
      );
    }
    
    // Generate speech using TTS OpenAI API
    const result = await generateSpeech(script, voiceId || 'OA001');
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate voice-over' },
        { status: 500 }
      );
    }
    
    // The TTS OpenAI API doesn't return a media URL immediately
    // Instead, it returns a UUID and status, and we need to wait for the webhook
    return NextResponse.json({
      success: true,
      status: result.status || 'queued',
      statusPercentage: result.statusPercentage || 0,
      uuid: result.uuid,
      message: 'Voice-over generation in progress. You will be notified when it is ready via webhook.',
      estimatedDuration: result.duration,
      voiceId
    });
  } catch (error) {
    console.error('Error generating voice-over:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate voice-over' },
      { status: 500 }
    );
  }
}
