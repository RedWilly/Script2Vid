"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useStoryboard } from './StoryboardContext';
import { Button } from "@/components/ui/button";
import { formatDuration } from './types';
import TrimHandles from './TrimHandles';

export const TimelineRuler = () => {
  const { 
    timelineRulerRef,
    playheadRef,
    timelineRowRef,
    totalDuration,
    scenes,
    selectedSceneIndex,
    getSceneStartTime,
    isDraggingLeftTrim,
    isDraggingRightTrim,
    setIsDraggingPlayhead,
    setIsPlaying,
    setCurrentTime,
    setSelectedSceneIndex,
    getSceneIndexAtTime,
    isPlaying,
    handlePlayPause,
    currentTimeDisplay,
    handleAddScene,
    handleSceneClick,
    handleSceneSelect,
    handleDeleteScene,
    voiceOver,
    currentCaptionText,
    currentTime
  } = useStoryboard();
  
  // Handle playhead mouse down event
  const handlePlayheadMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPlayhead(true);
    setIsPlaying(false); // Pause playback during drag
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      if (!timelineRulerRef.current) return;
      
      const rect = timelineRulerRef.current.getBoundingClientRect();
      const moveX = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(moveX / rect.width, 1));
      const newTime = percentage * totalDuration;
      
      setCurrentTime(newTime);
      
      // Update selected scene based on current time
      const sceneIndex = getSceneIndexAtTime(newTime, scenes, totalDuration);
      if (sceneIndex !== null && sceneIndex !== selectedSceneIndex) {
        setSelectedSceneIndex(sceneIndex);
      }
    };
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      setIsDraggingPlayhead(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTimelineRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRulerRef.current || totalDuration <= 0 || isDraggingLeftTrim || isDraggingRightTrim) return; // Prevent seek while trimming

    const rect = timelineRulerRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(clickPosition / rect.width, 1));
    const newTime = percentage * totalDuration;

    setCurrentTime(newTime);
    setIsPlaying(false); // Stop playback on seek

    const sceneIndex = getSceneIndexAtTime(newTime, scenes, totalDuration);
    if (sceneIndex !== null && sceneIndex !== selectedSceneIndex) {
      setSelectedSceneIndex(sceneIndex);
    }
  };

  return (
    <div className="timeline-ruler-container">
      {/* Main Timeline Container */}
      <div className="flex flex-col h-auto bg-[#121620] rounded-md mb-2 overflow-hidden">
        {/* RED SECTION: Fixed Playback Controls */}
        <div className="flex h-28">
          <div className="flex-shrink-0 flex flex-col justify-center h-full pl-2 pr-3 border-r border-[#1a1f2c]/50 z-10 bg-[#121620]">
            {/* Play Button */}
            <Button 
              onClick={handlePlayPause} 
              variant="ghost" 
              className="bg-[#1a1f2c] hover:bg-[#1a1f2c]/80 text-white rounded-md h-16 w-12 flex items-center justify-center flex-shrink-0 p-0 mb-1" 
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
          </div>
          
          {/* GREEN SECTION: Scrollable Timeline Container */}
          <div className="flex-1 overflow-x-auto relative">
            {/* Time ruler with markers - Now inside the scrollable area to align with content */}
            <div className="h-8 bg-[#1a1f2c] sticky top-0 w-full">
              <div
                ref={timelineRulerRef}
                className="h-full relative cursor-pointer"
                onClick={handleTimelineRulerClick}
              >
                {/* Time markers */}
                <div className="absolute inset-0 flex items-center pointer-events-none">
                  {/* Create time markers based on total duration */}
                  {[...Array(Math.max(1, Math.ceil(totalDuration / 5)) + 1)].map((_, i) => {
                    const timePoint = i * 5; // Show markers every 5 seconds
                    if (totalDuration > 0 && timePoint > totalDuration + 1) return null; // Hide markers too far past end
                    
                    // Calculate percentage position
                    const percentage = totalDuration > 0 ? Math.min(100, (timePoint / totalDuration) * 100) : (i * 10);

                    return (
                      <div key={i} className="absolute top-0 bottom-0 border-l border-[#1a1f2c] border-opacity-50" style={{ left: `${percentage}%` }}>
                        <span className="absolute -top-4 left-1 text-[10px] text-gray-400 transform -translate-x-1/2 whitespace-nowrap">
                          {`${timePoint}s`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Scene duration indicators */}
                <div className="absolute inset-0 pointer-events-none">
                  {scenes.map((scene, index) => {
                    // Calculate start and end percentages
                    const startTime = getSceneStartTime(index, scenes);
                    const startPercentage = (startTime / totalDuration) * 100;
                    const widthPercentage = (scene.duration / totalDuration) * 100;
                    
                    return (
                      <div 
                        key={`duration-${scene.id}`}
                        className={`absolute top-0 bottom-0 ${selectedSceneIndex === index ? 'bg-purple-500/20' : 'bg-[#1a1f2c]/20'} border-r border-[#1a1f2c] border-opacity-50`}
                        style={{ 
                          left: `${startPercentage}%`, 
                          width: `${widthPercentage}%`
                        }}
                      >
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* YELLOW SECTION: Scene Display Area - Now directly below the time ruler */}
            <div 
              ref={timelineRowRef}
              className="flex h-20 w-full"
            >
              {scenes.map((scene, index) => {
                // Calculate width based on duration
                const widthPercentage = (scene.duration / totalDuration) * 100;
                const isSelected = selectedSceneIndex === index;
                
                return (
                  <div 
                    key={`thumbnail-${scene.id}`}
                    className={`relative h-full border-r border-[#1a1f2c]/50 overflow-hidden
                      ${isSelected ? 'ring-2 ring-purple-500 ring-inset' : ''}`}
                    style={{ 
                      width: `${widthPercentage}%`,
                      minWidth: '80px', // Ensure thumbnails have a minimum width
                      flexShrink: 0
                    }}
                    onClick={(e) => handleSceneClick(e, index)}
                    data-scene-index={index}
                    tabIndex={0}
                    onFocus={() => handleSceneSelect(index, true)}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`Scene ${index + 1}`}
                  >
                    {/* Scene Thumbnail */}
                    <div className="w-full h-full relative">
                      <img 
                        src={scene.imageUrl} 
                        alt={`Scene ${index + 1}`}
                        className="w-full h-full object-cover"
                        draggable={false}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {/* Scene Number */}
                      <div className="absolute bottom-0 left-0 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded-tr-md pointer-events-none">
                        {index + 1}
                      </div>
                      
                      {/* Trim Handles (Conditional) */}
                      {isSelected && (
                        <TrimHandles index={index} scene={scene} />
                      )}
                      
                      {/* Delete Button (Show on hover/focus) */}
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-1 left-1 h-5 w-5 rounded-full opacity-0 hover:opacity-100 focus:opacity-100 transition-all duration-150 z-20 bg-red-600/80 hover:bg-red-500"
                        onClick={(e) => { 
                          e.preventDefault();
                          e.stopPropagation(); 
                          handleDeleteScene(index); 
                        }}
                        aria-label={`Delete scene ${index + 1}`}
                        data-scene-index={index}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {/* Add Scene Button - Always at the end */}
              <div 
                className="relative h-full min-w-[80px] w-20 border-l border-[#1a1f2c]/50 flex-shrink-0 flex items-center justify-center cursor-pointer group hover:bg-[#1a1f2c]/30 transition-colors"
                onClick={handleAddScene}
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl font-light text-gray-500 group-hover:text-purple-400 transition-colors">+</span>
                  <span className="text-xs text-gray-400 group-hover:text-gray-300">Add Scene</span>
                </div>
              </div>
            </div>
            
            {/* Voice-over Track */}
            <div className="flex h-10 w-full bg-[#1a1f2c]/30 border-t border-[#1a1f2c]/50 relative">
              {voiceOver ? (
                <div 
                  className={`h-full w-full flex items-center px-3 ${isPlaying ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}
                >
                  <div className="flex items-center space-x-2">
                    {/* Voice-over Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16h2a2 2 0 110 4H8a2 2 0 110-4h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                    </svg>
                    
                    {/* Voice-over Name */}
                    <span className="text-xs text-blue-300 font-medium">{voiceOver.name}</span>
                    
                    {/* Voice-over Duration */}
                    <span className="text-xs text-blue-200/70">{formatDuration(voiceOver.duration)}</span>
                  </div>
                </div>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-xs text-gray-400 italic">No voice-over added</span>
                </div>
              )}
            </div>
            
            {/* Single Continuous Playhead that spans the entire timeline height */}
            <div 
              ref={playheadRef} 
              className="absolute top-0 bottom-0 w-0.5 bg-purple-500 cursor-ew-resize z-30 group" 
              style={{ left: `${(currentTime / totalDuration) * 100}%`, height: 'calc(100% - 0px)' }} 
              onMouseDown={handlePlayheadMouseDown} 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Playhead triangle at the top */}
              <div className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-purple-500 transform transition-transform group-hover:scale-110"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineRuler;
