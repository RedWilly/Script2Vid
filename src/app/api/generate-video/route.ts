import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import os from 'os';

// Define Scene interface based on the application's existing Scene interface
interface Scene {
  id: string;
  content: string;
  duration: number; 
  imageUrl?: string;
  prompt?: string;
  seed?: number;
}

// Interface for the request payload
interface VideoExportRequest {
  scenes: Scene[];
  voiceOver?: {
    url: string;
    name: string;
  };
  captionFile?: {
    url: string;
    name: string;
  };
}

// Ensure temp directory exists
const ensureTempDir = async () => {
  // Use OS temp directory instead of a local folder for better cross-platform support
  const tempDir = path.join(os.tmpdir(), 'scriptviz-video-export');
  try {
    await mkdir(tempDir, { recursive: true });
    return tempDir;
  } catch (error) {
    console.error('Error creating temp directory:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    // Create a unique ID for this video generation
    const sessionId = uuidv4();
    const tempDir = await ensureTempDir();
    const outputDir = path.join(tempDir, sessionId);
    await mkdir(outputDir, { recursive: true });
    
    // Parse the request body
    const { scenes, voiceOver, captionFile } = await request.json() as VideoExportRequest;
    
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing scenes data' },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${scenes.length} scenes for video export`);
    
    // Create a list of image files to include in the video
    const imageFiles: string[] = [];
    const imageDurations: number[] = [];
    
    // Download and save each image to the temp directory
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (!scene.imageUrl) continue;
      
      try {
        // Download the image
        const imageResponse = await fetch(scene.imageUrl);
        if (!imageResponse.ok) {
          console.error(`Failed to download image for scene ${i + 1}`);
          continue;
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageFileName = path.join(outputDir, `scene_${i + 1}.jpg`);
        await writeFile(imageFileName, Buffer.from(imageBuffer));
        
        // Add to list of images for the video
        imageFiles.push(imageFileName);
        
        // In the storyboard, duration is stored directly in seconds, not milliseconds
        // The Scene interface in page.tsx extends the base Scene with a required duration
        const durationInSeconds = scene.duration || 5; 
        console.log(`Scene ${i + 1} duration: ${durationInSeconds}s`);
        imageDurations.push(durationInSeconds);
      } catch (error) {
        console.error(`Error processing image for scene ${i + 1}:`, error);
      }
    }
    
    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid images found in scenes' },
        { status: 400 }
      );
    }
    
    // Create a text file with the list of images and durations for ffmpeg
    const listFilePath = path.join(outputDir, 'filelist.txt');
    let fileListContent = '';
    
    // Format the file list for ffmpeg concat demuxer
    imageFiles.forEach((file, index) => {
      // Escape special characters in file paths
      const escapedPath = file.replace(/\\/g, '/').replace(/'/g, "'\\''");
      fileListContent += `file '${escapedPath}'\n`;
      // Make sure we're using the correct duration
      const duration = imageDurations[index];
      console.log(`Adding duration for scene ${index + 1}: ${duration}s`);
      fileListContent += `duration ${duration}\n`;
    });
    
    // Add the last file again (required by ffmpeg concat demuxer)
    if (imageFiles.length > 0) {
      const lastFile = imageFiles[imageFiles.length - 1].replace(/\\/g, '/').replace(/'/g, "'\\''");
      fileListContent += `file '${lastFile}'\n`;
    }
    
    console.log('Generated filelist content:');
    console.log(fileListContent);
    
    await writeFile(listFilePath, fileListContent);
    
    // Create output video file path
    const outputVideoPath = path.join(outputDir, 'storyboard_video.mp4');
    
    // Download voice-over file if provided
    let audioPath: string | null = null;
    if (voiceOver && voiceOver.url) {
      try {
        console.log(`Downloading voice-over audio: ${voiceOver.name}`);
        const audioResponse = await fetch(voiceOver.url);
        if (!audioResponse.ok) {
          console.error('Failed to download voice-over audio');
        } else {
          const audioBuffer = await audioResponse.arrayBuffer();
          audioPath = path.join(outputDir, 'voiceover.mp3');
          await writeFile(audioPath, Buffer.from(audioBuffer));
          console.log('Voice-over audio downloaded successfully');
        }
      } catch (error) {
        console.error('Error processing voice-over audio:', error);
        audioPath = null;
      }
    }
    
    // Generate video using fluent-ffmpeg with concat demuxer
    return new Promise<NextResponse>((resolve, reject) => {
      let ffmpegCommand = ffmpeg()
        .input(listFilePath)
        .inputOptions(['-f', 'concat', '-safe', '0']);
      
      // Add audio track if available
      if (audioPath) {
        ffmpegCommand = ffmpegCommand
          .input(audioPath)
          .audioCodec('aac')
          .audioChannels(2)
          .audioFrequency(44100)
          .audioQuality(5);
      }
      
      // Configure output options
      const outputOptions = [
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'medium',
        '-crf', '23',
        '-movflags', '+faststart'
      ];
      
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
        { error: 'Failed to generate video' },
        { status: 500 }
      );
    });
    
  } catch (error) {
    console.error('Error in video generation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
