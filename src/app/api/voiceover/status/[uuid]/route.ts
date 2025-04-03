import { NextRequest, NextResponse } from 'next/server';
import { completedVoiceOvers } from '@/app/api/webhooks/tts/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const uuid = params.uuid;
    
    if (!uuid) {
      return NextResponse.json(
        { success: false, error: 'No UUID provided' },
        { status: 400 }
      );
    }
    
    // Check if we have a completed voice-over with this UUID
    const voiceOver = completedVoiceOvers.get(uuid);
    
    if (voiceOver) {
      // We have a completed voice-over, return it
      return NextResponse.json({
        success: true,
        status: 'completed',
        fileName: voiceOver.fileName,
        url: voiceOver.url,
        duration: voiceOver.duration,
        voiceId: voiceOver.voiceId,
        message: 'Voice-over generation completed successfully.'
      });
    } else {
      // We don't have a completed voice-over yet
      return NextResponse.json({
        success: true,
        status: 'pending',
        message: 'Voice-over generation is still in progress.'
      });
    }
  } catch (error) {
    console.error('Error checking voice-over status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check voice-over status' },
      { status: 500 }
    );
  }
}
