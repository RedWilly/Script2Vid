"use client";

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { VOICE_OPTIONS, VoiceType } from '@/types';
import { useStoryboard } from './storyboard/StoryboardContext';
import { VoiceOverFile } from './storyboard/types';
import { v4 as uuidv4 } from 'uuid';

interface GenerationStatus {
  uuid: string;
  voiceId: string;
  status: 'queued' | 'converting' | 'completed' | 'failed';
  statusPercentage?: number;
}

export const VoiceOver = () => {
  const { handleAddVoiceOver, voiceOver: selectedTimelineVoiceOver } = useStoryboard();
  const [isGenerating, setIsGenerating] = useState(false);
  const [script, setScript] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<VoiceOverFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<VoiceOverFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>(VOICE_OPTIONS[1]); // Default to Echo
  const [playingSample, setPlayingSample] = useState<string | null>(null);
  const [pendingGeneration, setPendingGeneration] = useState<GenerationStatus | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load script from localStorage
  useEffect(() => {
    const storedScript = localStorage.getItem('scriptVizContent');
    if (storedScript) {
      setScript(storedScript);
    }
  }, []);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll for voice-over status when there's a pending generation
  useEffect(() => {
    if (pendingGeneration && pendingGeneration.uuid) {
      // Start polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      const checkStatus = async () => {
        try {
          const response = await fetch(`/api/voiceover/status/${pendingGeneration.uuid}`);
          if (!response.ok) {
            console.error('Error checking voice-over status:', response.statusText);
            return;
          }
          
          const data = await response.json();
          
          if (data.success && data.status === 'completed') {
            // Voice-over is ready
            clearInterval(pollingIntervalRef.current!);
            pollingIntervalRef.current = null;
            
            // Add the new file to the list
            const newFile = {
              id: uuidv4(),
              name: data.fileName,
              url: data.url,
              duration: data.duration || 0,
              voiceId: selectedVoice.id
            };
            
            setGeneratedFiles(prev => [newFile, ...prev]);
            setSelectedFile(newFile);
            setPendingGeneration(null);
            
            // Show success message
            toast.success('Voice-over generated successfully! Check "My Uploads" section.');
          }
        } catch (error) {
          console.error('Error polling for voice-over status:', error);
        }
      };
      
      // Check immediately and then every 3 seconds
      checkStatus();
      pollingIntervalRef.current = setInterval(checkStatus, 3000);
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pendingGeneration]);

  // Handle playing audio
  const handlePlayPause = (file: VoiceOverFile, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering the parent onClick
    }
    
    if (audioRef.current) {
      if (selectedFile?.url === file.url && isPlaying) {
        // Pause if already playing this file
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Select and play this file
        setSelectedFile(file);
        audioRef.current.src = file.url;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error('Error playing audio:', error);
            toast.error('Failed to play audio');
          });
      }
    }
  };

  // Handle selecting a file without playing
  const handleSelectFile = (file: VoiceOverFile) => {
    setSelectedFile(file);
  };

  // Add voice-over to timeline
  const handleAddToTimeline = (file: VoiceOverFile, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering the parent onClick
    }
    handleAddVoiceOver(file);
  };

  // Toggle favorite (placeholder for future implementation)
  const toggleFavorite = (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // This would be implemented to save favorites to localStorage or backend
    toast.info(`${voiceId} favorite toggled`);
  };

  // Sample voice
  const sampleVoice = (voice: VoiceType, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!voice.samplePath) {
      toast.error(`No sample available for ${voice.name}`);
      return;
    }
    
    if (playingSample === voice.id) {
      // Stop the current sample
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
        sampleAudioRef.current.currentTime = 0;
        setPlayingSample(null);
      }
      return;
    }
    
    // Stop any currently playing sample
    if (sampleAudioRef.current && playingSample) {
      sampleAudioRef.current.pause();
      sampleAudioRef.current.currentTime = 0;
    }
    
    // Play the new sample
    sampleAudioRef.current = new Audio(voice.samplePath);
    sampleAudioRef.current.onended = () => setPlayingSample(null);
    sampleAudioRef.current.play()
      .then(() => {
        setPlayingSample(voice.id);
      })
      .catch(err => {
        console.error('Error playing sample:', err);
        toast.error(`Failed to play sample for ${voice.name}`);
      });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
        body: JSON.stringify({ 
          script,
          voiceId: selectedVoice.id
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // If immediate result is available
        if (data.status === 'completed') {
          const newFile: VoiceOverFile = {
            id: uuidv4(),
            name: data.fileName,
            url: data.url,
            duration: data.duration || 0,
            voiceId: selectedVoice.id
          };
          
          setGeneratedFiles(prev => [newFile, ...prev]);
          setSelectedFile(newFile);
          toast.success('Voice-over generated successfully!');
        } else {
          // Set pending generation to poll for status
          setPendingGeneration({
            uuid: data.uuid,
            voiceId: selectedVoice.id,
            status: data.status,
            statusPercentage: data.statusPercentage
          });
          toast.success('Voice-over generation started. This may take a moment...');
        }
      } else {
        throw new Error(data.message || 'Failed to generate voice-over');
      }
    } catch (error) {
      console.error('Error generating voice-over:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate voice-over');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Script Preview Section */}
      <div className="mb-5">
        <h3 className="text-sm font-medium mb-2 text-white">Script Preview</h3>
        <div className="bg-[#121620] rounded-md p-3 max-h-24 overflow-y-auto border border-gray-800">
          <p className="text-sm text-gray-300">
            {script ? script.substring(0, 200) + (script.length > 200 ? '...' : '') : 'No script found'}
          </p>
        </div>
      </div>
      
      {/* Voice Selection Grid */}
      <div className="mb-5">
        <h3 className="text-sm font-medium mb-3 text-white">Select Voice</h3>
        <div className="grid grid-cols-2 gap-3">
          {VOICE_OPTIONS.map((voice) => (
            <div 
              key={voice.id}
              className={`relative p-3 rounded-md cursor-pointer transition-all ${
                selectedVoice.id === voice.id 
                  ? 'bg-[#2A1F53] border border-purple-500/50' 
                  : 'bg-[#121620] border border-gray-800 hover:border-gray-700'
              }`}
              onClick={() => setSelectedVoice(voice)}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-base text-white">{voice.name}</h4>
                <div className="text-xs text-gray-500">{voice.id}</div>
              </div>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{voice.description}</p>
              
              <div className="flex flex-col space-y-2 mt-3">
                <div className="flex space-x-2">
                  <span className="text-xs bg-[#1A1E2E] px-2 py-1 rounded text-gray-300">
                    {voice.age}
                  </span>
                  <span className="text-xs bg-[#1A1E2E] px-2 py-1 rounded text-gray-300">
                    {voice.gender}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    className={`${
                      playingSample === voice.id 
                        ? 'text-purple-400' 
                        : selectedVoice.id === voice.id 
                          ? 'text-purple-400 hover:text-white' 
                          : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={(e) => sampleVoice(voice, e)}
                    aria-label={`Play sample of ${voice.name}`}
                  >
                    {playingSample === voice.id ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V8a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button 
                    className="text-gray-400 hover:text-yellow-400"
                    onClick={(e) => toggleFavorite(voice.id, e)}
                    aria-label={`Add ${voice.name} to favorites`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Generate Button or Loading State */}
      {pendingGeneration ? (
        <div className="mb-5 bg-[#121620] rounded-md p-4 border border-purple-500/30">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-t-purple-500 border-purple-500/30 rounded-full animate-spin mr-3"></div>
            <div>
              <p className="text-white font-medium">Voice-over generation in progress...</p>
              <p className="text-sm text-gray-400">
                Using {VOICE_OPTIONS.find(v => v.id === pendingGeneration.voiceId)?.name || 'selected voice'} • 
                {pendingGeneration.statusPercentage ? ` ${pendingGeneration.statusPercentage}% complete` : ' Processing'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleGenerateVoiceOver}
          disabled={isGenerating || !script}
          className="mb-5 bg-purple-600 hover:bg-purple-700 text-white h-12 rounded-md"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-t-white border-white/30 rounded-full animate-spin mr-2"></div>
              Generating with {selectedVoice.name}...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Generate with {selectedVoice.name}
            </>
          )}
        </Button>
      )}
      
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        src={selectedFile?.url} 
        className="hidden" 
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* Generated Files List */}
      {generatedFiles.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm font-medium mb-2 text-white">Generated Voice-Overs</h3>
          <ul className="space-y-2">
            {generatedFiles.map((file, index) => {
              const isSelectedForTimeline = selectedTimelineVoiceOver?.id === file.id;
              
              return (
                <li 
                  key={index}
                  className={`p-2 rounded-md cursor-pointer transition-colors ${
                    selectedFile?.url === file.url 
                      ? 'bg-purple-500/20 border border-purple-500/30' 
                      : isSelectedForTimeline
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'hover:bg-gray-700/30 border border-transparent'
                  }`}
                  onClick={() => handleSelectFile(file)}
                >
                  <div className="flex items-center">
                    <div 
                      className="mr-3 text-purple-400 cursor-pointer"
                      onClick={(e) => handlePlayPause(file, e)}
                    >
                      {selectedFile?.url === file.url && isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                      {file.duration && (
                        <p className="text-xs text-gray-400">
                          {formatDuration(file.duration)}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToTimeline(file, e);
                      }}
                      className={`ml-2 px-2 py-1 h-8 text-xs ${
                        isSelectedForTimeline 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isSelectedForTimeline ? 'Added to Timeline' : 'Add to Timeline'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      
      {generatedFiles.length === 0 && !pendingGeneration && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400 italic">
            Select a voice and generate your first voice-over
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceOver;
