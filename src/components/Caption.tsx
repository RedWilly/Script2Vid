"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useStoryboard } from './storyboard/StoryboardContext';
import { parseVTT, syncSceneDurations } from '@/utils/vttParser';
import { CaptionFile } from './storyboard/types';

const Caption: React.FC = () => {
  const [captions, setCaptions] = useState<CaptionFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { 
    voiceOver, 
    scenes, 
    setScenes, 
    setActiveCaption,
    handleSetCaptionSegments
  } = useStoryboard();

  // Load existing captions
  useEffect(() => {
    fetchCaptions();
  }, []);

  const fetchCaptions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/caption/list');
      const data = await response.json();
      
      if (data.captions) {
        setCaptions(data.captions);
      }
    } catch (error) {
      console.error('Error fetching captions:', error);
      toast.error('Failed to load captions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!voiceOver) {
      toast.error('Please add a voice-over to the timeline first');
      return;
    }

    try {
      setIsGenerating(true);
      toast.loading('Generating captions from voice-over...');

      const response = await fetch('/api/caption/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioUrl: voiceOver.url,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Captions generated successfully');
        // Add the new caption to the list
        setCaptions(prev => [
          {
            name: data.captionName,
            url: data.captionUrl,
          },
          ...prev,
        ]);
      } else {
        toast.error(data.error || 'Failed to generate captions');
      }
    } catch (error) {
      console.error('Error generating captions:', error);
      toast.error('Failed to generate captions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyncCaption = async (caption: CaptionFile) => {
    if (!scenes || scenes.length === 0) {
      toast.error('No scenes available to sync with');
      return;
    }

    try {
      setIsSyncing(true);
      toast.loading(`Syncing caption "${caption.name}" with scenes...`);

      // Fetch the VTT file content
      const response = await fetch(caption.url);
      const vttContent = await response.text();

      // Parse the VTT content
      const captionSegments = parseVTT(vttContent);
      
      if (captionSegments.length === 0) {
        toast.error('No caption segments found in the VTT file');
        return;
      }

      console.log('Parsed caption segments:', captionSegments);

      // Log for debugging
      console.log('Voice-over duration:', voiceOver?.duration);
      console.log('Caption segments:', captionSegments);
      console.log('Last caption segment end time:', 
        captionSegments.length > 0 ? captionSegments[captionSegments.length - 1].endTime : 'N/A');

      // Synchronize scene durations with caption timing
      const updatedScenes = syncSceneDurations(
        [...scenes], 
        captionSegments,
        voiceOver?.duration
      );
      console.log('Updated scenes with synced durations:', updatedScenes);
      
      // Update scenes with new durations
      setScenes(updatedScenes);

      // Store caption segments in context for display during playback
      handleSetCaptionSegments(captionSegments);
      
      // Set this caption as the active caption
      setActiveCaption({
        ...caption,
        segments: captionSegments
      });
      
      toast.success(`Caption "${caption.name}" synced with scenes successfully`);
      console.log('Updated scenes with synced durations:', updatedScenes);
      
    } catch (error) {
      console.error('Error syncing caption with scenes:', error);
      toast.error('Failed to sync caption with scenes');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
        onClick={handleGenerateCaption}
        disabled={isGenerating || !voiceOver}
      >
        {isGenerating ? 'Generating...' : 'Generate Caption'}
      </button>
      
      <div className="mt-4">
        <h3 className="text-white text-sm font-medium mb-2">Your Captions</h3>
        
        {isLoading ? (
          <div className="bg-[#1a1f2c] rounded-md p-4 text-gray-400 text-center">
            <p>Loading captions...</p>
          </div>
        ) : captions.length > 0 ? (
          <div className="space-y-2">
            {captions.map((caption, index) => (
              <div 
                key={index} 
                className="bg-[#1a1f2c] rounded-md p-3 flex justify-between items-center hover:bg-[#252a37] transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-2 0c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6 6 2.686 6 6z" clipRule="evenodd" />
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium truncate">{caption.name}</p>
                    <p className="text-xs text-gray-400">VTT Caption</p>
                  </div>
                </div>
                <button 
                  className="text-purple-400 hover:text-purple-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSyncCaption(caption);
                  }}
                  disabled={isSyncing}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1a1f2c] rounded-md p-4 text-gray-400 text-center">
            <p>No captions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Caption;