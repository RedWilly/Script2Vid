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

    // Generate SRT subtitles
    console.log('Generating SRT subtitles for transcript:', transcript.id);
    const srt = await client.transcripts.subtitles(transcript.id, 'srt', 40);
    
    // Upload SRT file to S3
    const fileName = `caption-${Date.now()}.srt`;
    const srtBuffer = Buffer.from(srt);
    const srtUrl = await uploadCaptionFile(srtBuffer, fileName, 'text/plain');

    return NextResponse.json({
      success: true,
      captionUrl: srtUrl,
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
