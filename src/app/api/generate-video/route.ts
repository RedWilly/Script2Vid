import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';

// Define the request body type
interface VideoExportRequest {
  scenes: {
    id: string;
    imageUrl: string;
    content: string;
    duration?: number;
  }[];
  voiceOver?: {
    url: string;
    name: string;
  };
}

// Convert time format from SRT/VTT to ASS
function convertTimeToASS(time: string): string {
  // Handle both VTT and SRT time formats
  // Replace comma with period for SRT format
  time = time.replace(',', '.');
  
  let parts: string[];
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let centiseconds = 0;
  
  if (time.includes(':')) {
    parts = time.split(':');
    if (parts.length === 3) {
      // Format: 00:00:00.000
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
      const secParts = parts[2].split('.');
      seconds = parseInt(secParts[0], 10);
      centiseconds = secParts.length > 1 ? Math.floor(parseInt(secParts[1], 10) / 10) : 0;
    } else if (parts.length === 2) {
      // Format: 00:00.000
      minutes = parseInt(parts[0], 10);
      const secParts = parts[1].split('.');
      seconds = parseInt(secParts[0], 10);
      centiseconds = secParts.length > 1 ? Math.floor(parseInt(secParts[1], 10) / 10) : 0;
    }
  }
  
  // Format to ASS time format (h:mm:ss.cc)
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const requestData: VideoExportRequest = await request.json();
    const { scenes, voiceOver } = requestData;
    
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No scenes provided' },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${scenes.length} scenes for video export`);
    
    // Create a temporary directory for processing
    const tempDir = path.join(os.tmpdir(), 'scriptviz-video-export');
    if (!fs.existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }
    
    // Create a unique directory for this export
    const exportId = uuidv4();
    const outputDir = path.join(tempDir, exportId);
    await mkdir(outputDir, { recursive: true });
    
    // Download all scene images
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`Scene ${i + 1} duration: ${scene.duration}s`);
      
      try {
        const imageResponse = await fetch(scene.imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image for scene ${i + 1}`);
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        const imagePath = path.join(outputDir, `scene_${i + 1}.jpg`);
        await writeFile(imagePath, Buffer.from(imageBuffer));
      } catch (error) {
        console.error(`Error downloading image for scene ${i + 1}:`, error);
        return NextResponse.json(
          { success: false, error: `Failed to download image for scene ${i + 1}` },
          { status: 500 }
        );
      }
    }
    
    // Create a temporary file list for FFmpeg concat demuxer
    let filelistContent = '';
    scenes.forEach((scene, index) => {
      const scenePath = path.join(outputDir, `scene_${index + 1}.jpg`).replace(/\\/g, '/');
      filelistContent += `file '${scenePath}'\n`;
      // Only add duration for images that are not the last one
      if (index < scenes.length - 1) {
        // Use voice-over duration if available, otherwise default scene duration
        const duration = scene.duration || 5; // Default to 5 seconds if no duration
        filelistContent += `duration ${duration}\n`;
      }
    });

    const filelistPath = path.join(outputDir, 'filelist.txt');
    await writeFile(filelistPath, filelistContent);
    console.log('Generated filelist content:\n' + filelistContent);

    // Download voice-over audio if provided
    let voiceOverPath: string | null = null;
    if (voiceOver && voiceOver.url) {
      try {
        console.log(`Downloading voice-over audio: ${voiceOver.name}`);
        const voiceOverResponse = await fetch(voiceOver.url);
        if (!voiceOverResponse.ok) {
          console.error('Failed to download voice-over audio');
        } else {
          const voiceOverBuffer = await voiceOverResponse.arrayBuffer();
          voiceOverPath = path.join(outputDir, 'voiceover.mp3');
          await writeFile(voiceOverPath, Buffer.from(voiceOverBuffer));
          console.log('Voice-over audio downloaded successfully');
        }
      } catch (error) {
        console.error('Error processing voice-over audio:', error);
        voiceOverPath = null;
      }
    }
    
    // Construct FFmpeg command
    const ffmpegCommand = ffmpeg()
      .input(filelistPath)
      .inputOptions(['-f', 'concat', '-safe', '0']);

    if (voiceOverPath) {
      ffmpegCommand.input(voiceOverPath);
    }

    return new Promise<NextResponse>((resolve, reject) => {
      // Basic output options
      const outputOptions = [
        '-acodec', 'aac',
        '-ac', '2',
        '-ar', '44100',
        '-aq', '5',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'medium',
        '-crf', '23',
        '-movflags', '+faststart'
      ];
      
      // Generate the video directly without captions
      const outputVideoPath = path.join(outputDir, 'storyboard_video.mp4');
      
      ffmpegCommand
        .outputOptions(outputOptions)
        .output(outputVideoPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', async () => {
          try {
            // Read the generated video file
            const videoBuffer = fs.readFileSync(outputVideoPath);
            
            // Return the video file
            resolve(
              new NextResponse(videoBuffer, {
                status: 200,
                headers: {
                  'Content-Type': 'video/mp4',
                  'Content-Disposition': 'attachment; filename="storyboard_video.mp4"',
                }
              })
            );
            
            // Clean up temp files (async)
            setTimeout(() => {
              try {
                fs.rmSync(outputDir, { recursive: true, force: true });
              } catch (e) {
                console.error('Error cleaning up temp files:', e);
              }
            }, 60000); // Clean up after 1 minute
          } catch (error) {
            console.error('Error reading video file:', error);
            reject(error);
          }
        })
        .on('error', (err, stdout, stderr) => {
          console.error('Error generating video:', err);
          console.error('FFmpeg stdout:', stdout);
          console.error('FFmpeg stderr:', stderr);
          reject(err);
        })
        .run();
    }).catch(error => {
      console.error('Video generation failed:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate video' },
        { status: 500 }
      );
    });
  } catch (error) {
    console.error('Error processing video export request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process video export request' },
      { status: 500 }
    );
  }
}
