import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, ensureBucketExists } from '@/services/s3-service';

export async function POST(request: NextRequest) {
  try {
    // Ensure the bucket exists first
    await ensureBucketExists();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check if file is an audio file
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'File must be an audio file' },
        { status: 400 }
      );
    }
    
    // Upload file to S3
    const fileUrl = await uploadFile(file);
    
    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
