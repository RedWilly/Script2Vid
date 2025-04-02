"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface VoiceOverFile {
  name: string;
  url: string;
  duration?: number;
}

export const VoiceOver = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<VoiceOverFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<VoiceOverFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Load script from localStorage
  useEffect(() => {
    const storedScript = localStorage.getItem('scriptVizContent');
    if (storedScript) {
      setScript(storedScript);
    }
  }, []);

  // Generate voice-over from script
  const handleGenerateVoiceOver = async () => {
    if (!script) {
      toast.error('No script found. Please create a script first.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/voiceover/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Voice-over generated successfully');
        
        // Add the new file to the list
        const newFile = {
          name: data.fileName,
          url: data.url,
          duration: data.duration,
        };
        
        setGeneratedFiles(prev => [newFile, ...prev]);
        setSelectedFile(newFile);
      } else {
        toast.error(`Generation failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating voice-over:', error);
      toast.error('Failed to generate voice-over');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle playing audio
  const handlePlayPause = (file: VoiceOverFile) => {
    if (!audioRef.current) return;
    
    if (selectedFile?.url === file.url && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setSelectedFile(file);
      // We need to wait for the audio element to update its src
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.error('Error playing audio:', err);
              toast.error('Failed to play audio');
            });
        }
      }, 50);
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Script Preview</h3>
        <div className="bg-gray-800/50 rounded-lg p-3 max-h-32 overflow-y-auto">
          <p className="text-sm text-gray-300">
            {script ? script.substring(0, 200) + (script.length > 200 ? '...' : '') : 'No script found'}
          </p>
        </div>
      </div>
      
      {/* Generate Button */}
      <Button
        onClick={handleGenerateVoiceOver}
        disabled={isGenerating || !script}
        className="mb-4 bg-purple-600 hover:bg-purple-700 text-white"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin mr-2"></div>
            Generating...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Generate from Script
          </>
        )}
      </Button>
      
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        src={selectedFile?.url} 
        className="hidden" 
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default VoiceOver;
