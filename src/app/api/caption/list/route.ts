import { NextResponse } from 'next/server';
import { listCaptionFiles } from '@/services/s3-service';

export async function GET() {
  try {
    const captions = await listCaptionFiles();
    return NextResponse.json({ captions });
  } catch (error) {
    console.error('Error listing captions:', error);
    return NextResponse.json(
      { error: 'Failed to list captions' },
      { status: 500 }
    );
  }
}