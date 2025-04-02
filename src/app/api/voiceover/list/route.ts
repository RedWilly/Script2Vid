import { NextRequest, NextResponse } from 'next/server';
import { listFiles, ensureBucketExists } from '@/services/s3-service';

export async function GET(request: NextRequest) {
  try {
    // Ensure the bucket exists first
    await ensureBucketExists();
    
    const files = await listFiles();
    
    return NextResponse.json({ 
      success: true, 
      files
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
