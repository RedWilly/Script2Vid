import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';
import { uploadCaptionFile } from '@/services/s3-service';

export async function POST(request: NextRequest) {
  try {
    const { audioUrl } = await request.json();
    if (!audioUrl) {
      return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 });
    }

    const client = new AssemblyAI({ apiKey: process.env.ASSEMBLY_AI! });

    // ✅ Auto-waits until transcription is complete
    const transcript = await client.transcripts.transcribe({ audio: audioUrl });

    const vttLines = ['WEBVTT\n'];
    if (transcript.words) {
      transcript.words.forEach((word, i) => {
        const start = msToVtt(word.start);
        const end = msToVtt(word.end);
        vttLines.push(`${i}`);
        vttLines.push(`${start} --> ${end}`);
        vttLines.push(word.text);
        vttLines.push('');
      });
    }

    const vttBuffer = Buffer.from(vttLines.join('\n'), 'utf8');
    const fileName = `caption-${Date.now()}.vtt`;
    const captionUrl = await uploadCaptionFile(vttBuffer, fileName, 'text/vtt');

    return NextResponse.json({
      success: true,
      captionUrl,
      captionName: fileName,
      transcriptId: transcript.id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// Convert ms → VTT format (hh:mm:ss.mmm)
function msToVtt(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = ((ms % 60000) / 1000).toFixed(3);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.padStart(6, '0')}`;
}
