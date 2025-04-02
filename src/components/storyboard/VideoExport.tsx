"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useStoryboard } from './StoryboardContext';

export const VideoExport = () => {
  const { 
    isExporting, 
    handleExportVideo,
    scenes
  } = useStoryboard();

  return (
    <Button 
      onClick={handleExportVideo} 
      disabled={isExporting || scenes.length === 0}
      className={`bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-1.5 rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-1 sm:gap-2 text-sm ${isExporting ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {isExporting ? (
        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2a1 1 0 000-1.664l-3-2z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
      <span className="truncate">{isExporting ? 'Exporting...' : 'Export Video'}</span>
    </Button>
  );
};

export default VideoExport;
