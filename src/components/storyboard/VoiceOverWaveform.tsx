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
        const points = 1000; // Number of points to display
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

    // Calculate progress position
    const progress = Math.min(currentTime / totalDuration, 1);
    const progressX = Math.floor(width * progress);

    // Draw waveform
    const barWidth = Math.max(1, width / audioData.length);
    const barSpacing = 0; // Space between bars
    const amplitudeScale = height * 0.4; // Scale factor for amplitude

    for (let i = 0; i < audioData.length; i++) {
      const x = i * (barWidth + barSpacing);
      const amplitude = audioData[i] * amplitudeScale;
      const barHeight = Math.max(1, amplitude);

      // Center the bar vertically
      const y = (height - barHeight) / 2;

      // Determine if this bar is before or after the progress point
      const isBeforeProgress = x <= progressX;

      // Set color based on progress
      ctx.fillStyle = isBeforeProgress ? '#FF69B4' : '#00BFFF'; // Pink for played, Blue for unplayed

      // Draw the bar
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw the mirrored bar below the center line
      ctx.fillRect(x, height - y - barHeight, barWidth, barHeight);
    }

    // Draw center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();

  }, [audioData, currentTime, totalDuration, isPlaying]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-xs text-blue-300 animate-pulse">Analyzing audio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-xs text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      width={1000} // Set a high resolution for the canvas
      height={40}  // Match the height of the voice-over track
    />
  );
};

export default VoiceOverWaveform;
