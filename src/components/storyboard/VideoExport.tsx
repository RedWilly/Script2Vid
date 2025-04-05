"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useStoryboard } from './StoryboardContext';

export function VideoExport() {
  const { handleExportVideo, isExporting, scenes, voiceOver } = useStoryboard();

  const handleExport = async () => {
    try {
      await handleExportVideo();
    } catch (error) {
      console.error('Error exporting video:', error);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={isExporting || scenes.length === 0}
      variant="outline" 
      size="sm"
      className="flex items-center gap-2"
    >
      {/* Simple download icon using SVG */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {isExporting ? 'Exporting...' : 'Export Video'}
    </Button>
  );
}

export default VideoExport;
