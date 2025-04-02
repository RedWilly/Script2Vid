"use client";

import { Button } from "@/components/ui/button";
import { useStoryboard } from './StoryboardContext';
import { formatDuration, formatDisplayTime } from './types';

export const TimelineControls = () => {
  const { 
    isPlaying, 
    handlePlayPause, 
    totalDuration, 
    currentTime,
    currentTimeDisplay
  } = useStoryboard();

  return (
    <div className="flex items-center gap-3">
      {/* Play Button */}
      <Button 
        onClick={handlePlayPause} 
        variant="ghost" 
        className="bg-[#1a1f2c] hover:bg-[#1a1f2c]/80 text-white rounded-md h-16 w-12 flex items-center justify-center flex-shrink-0 p-0" 
        disabled={totalDuration <= 0}
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </Button>
      
      {/* Time Display */}
      <div className="text-xs text-gray-300 font-mono bg-[#1a1f2c] px-2 py-1 rounded flex-shrink-0">
        {currentTimeDisplay} / {formatDuration(totalDuration)}
      </div>

      {/* Additional Time Display (for larger screens) */}
      <div className="flex-shrink-0 text-sm text-gray-400 font-mono ml-auto hidden md:block">
        {formatDisplayTime(currentTime)} / {formatDisplayTime(totalDuration)}
      </div>
    </div>
  );
};

export default TimelineControls;
