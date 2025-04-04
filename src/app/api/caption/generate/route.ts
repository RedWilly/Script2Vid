import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';
import { uploadCaptionFile } from '@/services/s3-service';

export async function POST(request: NextRequest) {
  try {
    const { audioUrl } = await request.json();

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Audio URL is required' },
        { status: 400 }
      );
    }

    // Initialize AssemblyAI client
    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLY_AI || ''
    });

    // Configure transcription
    const config = {
      audio_url: audioUrl
    };

    // Generate transcript
    console.log('Generating transcript for:', audioUrl);
    const transcript = await client.transcripts.transcribe(config);
    
    if (!transcript.id) {
      return NextResponse.json(
        { error: 'Failed to generate transcript' },
        { status: 500 }
      );
    }

    // Generate VTT subtitles
    console.log('Generating VTT subtitles for transcript:', transcript.id);
    const vtt = await client.transcripts.subtitles(transcript.id, 'vtt', 35);
    
    // Upload VTT file to S3
    const fileName = `caption-${Date.now()}.vtt`;
    const vttBuffer = Buffer.from(vtt);
    const vttUrl = await uploadCaptionFile(vttBuffer, fileName, 'text/vtt');

    return NextResponse.json({
      success: true,
      captionUrl: vttUrl,
      captionName: fileName,
      transcriptId: transcript.id
    });
  } catch (error) {
    console.error('Error generating captions:', error);
    return NextResponse.json(
      { error: 'Failed to generate captions' },
      { status: 500 }
    );
  }
}
