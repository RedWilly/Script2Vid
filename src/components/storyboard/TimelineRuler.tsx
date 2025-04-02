"use client";

import React from 'react';
import { useStoryboard } from './StoryboardContext';

export const TimelineRuler = () => {
  const { 
    timelineRulerRef,
    playheadRef,
    totalDuration,
    currentTime,
    scenes,
    selectedSceneIndex,
    getSceneStartTime,
    isDraggingLeftTrim,
    isDraggingRightTrim,
    setIsDraggingPlayhead,
    setIsPlaying,
    setCurrentTime,
    setSelectedSceneIndex,
    getSceneIndexAtTime
  } = useStoryboard();

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

  return (
    <div
      ref={timelineRulerRef}
      className="h-8 bg-[#1a1f2c] rounded-t-md relative cursor-pointer mb-2"
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
        
        {/* Add a marker at the end of the timeline */}
        {totalDuration > 0 && (
          <div className="absolute top-0 bottom-0 border-l border-purple-500" style={{ left: '100%' }}>
            <span className="absolute -top-4 left-1 text-[10px] text-purple-400 transform -translate-x-1/2 whitespace-nowrap">
              {`${totalDuration.toFixed(1)}s`}
            </span>
          </div>
        )}
      </div>
      
      {/* Playhead */}
      <div 
        ref={playheadRef} 
        className="absolute top-0 bottom-0 w-0.5 bg-purple-500 cursor-ew-resize z-30 group" 
        style={{ left: '0%' }} 
        onMouseDown={handlePlayheadMouseDown} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-purple-500 transform transition-transform group-hover:scale-110"></div>
      </div>
      
      {/* Scene duration indicators */}
      <div className="absolute inset-0 pointer-events-none">
        {scenes.map((scene, index) => {
          // Calculate start and end percentages
          const startTime = getSceneStartTime(index, scenes);
          const endTime = startTime + scene.duration;
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
              {/* Scene number indicator at the top */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-gray-400">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineRuler;
