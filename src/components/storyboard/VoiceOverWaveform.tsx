"use client";

import React, { useEffect, useRef, useState } from 'react';
import { VoiceOverFile } from './types';

interface VoiceOverWaveformProps {
  voiceOver: VoiceOverFile;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
}

const VoiceOverWaveform: React.FC<VoiceOverWaveformProps> = ({
  voiceOver,
  currentTime,
  totalDuration,
  isPlaying
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch and analyze audio data
  useEffect(() => {
    if (!voiceOver?.url) return;

    const fetchAudioData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Fetch the audio file
        const response = await fetch(voiceOver.url);
        const arrayBuffer = await response.arrayBuffer();

        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get audio data from the first channel
        const channelData = audioBuffer.getChannelData(0);

        // Downsample the data to a reasonable number of points
        const points = 250; // Reduced number of points for better performance
        const blockSize = Math.floor(channelData.length / points);
        const sampledData = [];

        for (let i = 0; i < points; i++) {
          const blockStart = blockSize * i;
          let blockSum = 0;

          // Find the peak value in this block
          for (let j = 0; j < blockSize; j++) {
            if (blockStart + j < channelData.length) {
              const amplitude = Math.abs(channelData[blockStart + j]);
              blockSum = Math.max(blockSum, amplitude);
            }
          }

          sampledData.push(blockSum);
        }

        setAudioData(sampledData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error analyzing audio:', err);
        setError('Failed to analyze audio');
        setIsLoading(false);
      }
    };

    fetchAudioData();
  }, [voiceOver?.url]);

  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || audioData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Add shadow for glow effect
    ctx.shadowBlur = 3;
    ctx.shadowColor = 'rgba(0, 191, 255, 0.5)';

    // Calculate progress position
    const progress = totalDuration > 0 ? Math.min(currentTime / totalDuration, 1) : 0;
    const progressX = Math.floor(width * progress);

    // Draw waveform
    const barWidth = Math.max(2, width / audioData.length); // Increased minimum bar width
    const barSpacing = 1; // Added small spacing between bars
    const amplitudeScale = height * 0.7; // Increased scale factor for amplitude

    for (let i = 0; i < audioData.length; i++) {
      const x = i * (barWidth + barSpacing);
      const amplitude = audioData[i] * amplitudeScale;
      const barHeight = Math.max(1, amplitude);

      // Center the bar vertically
      const y = (height - barHeight) / 2;

      // Determine if this bar is before or after the progress point
      const isBeforeProgress = x <= progressX;

      // Set color based on progress
      const playedColor = '#FF1493'; // Brighter pink for played
      const unplayedColor = '#00BFFF'; // Blue for unplayed
      ctx.fillStyle = isBeforeProgress ? playedColor : unplayedColor;

      // Update shadow color based on progress
      ctx.shadowColor = isBeforeProgress ? 'rgba(255, 20, 147, 0.6)' : 'rgba(0, 191, 255, 0.5)';

      // Draw the bar
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw the mirrored bar below the center line
      ctx.fillRect(x, height - y - barHeight, barWidth, barHeight);
    }

    // Reset shadow for center line
    ctx.shadowBlur = 0;

    // Draw center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

  }, [audioData, currentTime, totalDuration, isPlaying]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#121620]/50">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
          <div className="text-xs text-blue-300 animate-pulse">Analyzing audio...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#121620]/50">
        <div className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="text-xs text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      width={1000} // Set a high resolution for the canvas
      height={60}  // Match the height of the voice-over track
    />
  );
};

export default VoiceOverWaveform;
