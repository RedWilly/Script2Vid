"use client";

import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import { StoryboardProvider, useStoryboard } from './StoryboardContext';
import TimelineRuler from './TimelineRuler';
import VideoExport from './VideoExport';
import { RemotionTimeline } from './RemotionTimeline';

// Inner component that uses the context
const StoryboardContent = () => {
  const { isSidebarExpanded, setIsSidebarExpanded } = useStoryboard();

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col">
      {/* Sidebar */}
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)} 
      />
      
      {/* Main content with padding to account for sidebar */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? 'ml-56' : 'ml-14'}`}>
        <div className="max-w-full">
          {/* Header */}
          <header className="bg-[#0a0d14] border-b border-[#1a1f2c]/50 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
                <span className="text-blue-400">Script</span><span className="text-white">Viz</span> <span className="text-purple-400">StoryBoard</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <VideoExport />
              <Link href="/scene-visualizer">
                <Button variant="outline" className="bg-transparent hover:bg-[#1a1f2c] text-gray-300 border border-[#1a1f2c] rounded-md transition-all hover:text-white flex items-center gap-1 sm:gap-2 px-3 py-1.5 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" />
                  </svg>
                  <span className="truncate">Back</span>
                </Button>
              </Link>
            </div>
          </header>
          {/* Main content area */}
          <main className="flex-grow flex flex-col p-4 sm:p-6 gap-4 sm:gap-6">
            {/* Preview Area - Now using Remotion */}
            <div className="bg-black border border-[#1a1f2c]/50 rounded-xl p-3 sm:p-4 shadow-xl">
              <RemotionTimeline />
            </div>

            {/* Timeline Section - Consolidated */}
            <div className="flex-shrink-0 bg-black border border-[#1a1f2c]/50 rounded-xl p-3 sm:p-4 shadow-xl">
              {/* Consolidated Timeline with Ruler, Controls, and Thumbnails */}
              <TimelineRuler />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Wrapper component that provides the context
export const StoryboardPage = () => {
  return (
    <StoryboardProvider>
      <StoryboardContent />
    </StoryboardProvider>
  );
};

export default StoryboardPage;
