import { NextRequest, NextResponse } from 'next/server';

/**
 * This API route is a stub 
 * The video generation functionality is no longer available
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Video generation functionality has been removed from the project' },
    { status: 501 }
  );
}
