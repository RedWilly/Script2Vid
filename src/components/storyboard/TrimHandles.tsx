"use client";

import React from 'react';
import { useStoryboard } from './StoryboardContext';
import { formatDuration } from './types';
import { toast } from 'sonner';

interface TrimHandlesProps {
  index: number;
  scene: any;
}

export const TrimHandles: React.FC<TrimHandlesProps> = ({ index, scene }) => {
  const {
    scenes,
    setScenes,
    selectedSceneIndex,
    setTrimmingSceneIndex,
    setIsDraggingLeftTrim,
    setIsDraggingRightTrim,
    setIsPlaying,
    setActiveTrimDuration,
    activeTrimDuration,
    getSceneStartTime,
    recalculateTotalDuration,
    setCurrentTime
  } = useStoryboard();

  const handleTrimMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    handleType: 'left' | 'right'
  ) => {
    // Prevent any default browser behavior
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`Starting trim operation on scene ${index + 1}, handle: ${handleType}`);
    
    // Set trimming state
    setTrimmingSceneIndex(index);
    setIsPlaying(false); // Pause playback

    // Set the appropriate drag flag
    if (handleType === 'left') {
      setIsDraggingLeftTrim(true);
    } else {
      setIsDraggingRightTrim(true);
    }

    // Get the thumbnail element being trimmed
    const thumbnailElement = document.querySelector(`[data-scene-index="${index}"]`) as HTMLElement;
    if (!thumbnailElement) {
      console.error("Could not find thumbnail element for trimming");
      return;
    }

    // Initial scene data
    const originalScene = scenes[index];
    const originalDuration = originalScene.duration;
    const thumbnailWidth = thumbnailElement.offsetWidth;
    const initialMouseX = e.clientX;
    
    console.log(`Trim start - Scene: ${index + 1}, Duration: ${originalScene.duration}s, Thumbnail width: ${thumbnailWidth}px`);

    // Mouse move handler for trimming
    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Prevent default browser behavior
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      // Skip if no scene is being trimmed
      if (index === null) return;

      // Calculate mouse movement delta
      const deltaX = moveEvent.clientX - initialMouseX;
      
      // Convert pixel movement to time (based on thumbnail width)
      // Scale factor: 1 pixel movement = (originalDuration / thumbnailWidth) seconds
      const timePerPixel = originalDuration / thumbnailWidth;
      let timeDelta = deltaX * timePerPixel;
      
      // For left handle, movement is inverted (left = increase start time = decrease duration)
      if (handleType === 'left') {
        timeDelta = -timeDelta;
      }
      
      // Calculate new duration
      let newDuration = Math.max(0.5, originalDuration + timeDelta);
      
      // Apply constraints based on handle type
      if (handleType === 'left') {
        // For left handle, check if we're pushing against previous scene
        if (index > 0) {
          const prevScene = scenes[index - 1];
          const prevSceneEnd = getSceneStartTime(index, scenes);
          const maxReduction = originalScene.duration - 0.5;
          const maxAllowedReduction = Math.min(maxReduction, prevSceneEnd);
          
          // Limit how much we can reduce from the left
          if (timeDelta > maxAllowedReduction) {
            newDuration = originalDuration - maxAllowedReduction;
          }
        }
      }
      
      // Update the scene with new duration
      setScenes(currentScenes => {
        // Skip if scene index is invalid
        if (index >= currentScenes.length) return currentScenes;
        
        const sceneToTrim = currentScenes[index];
        
        // Only update if duration actually changed
        if (Math.abs(newDuration - sceneToTrim.duration) > 0.01) {
          const updatedScenes = [...currentScenes];
          updatedScenes[index] = { 
            ...sceneToTrim, 
            duration: newDuration 
          };
          
          // Recalculate total duration with the updated scenes
          recalculateTotalDuration(updatedScenes);
          
          // Update current time to match the handle position
          if (handleType === 'left') {
            const newStartTime = getSceneStartTime(index, updatedScenes);
            setCurrentTime(newStartTime);
          } else {
            const newStartTime = getSceneStartTime(index, updatedScenes);
            setCurrentTime(newStartTime + newDuration);
          }
          
          return updatedScenes;
        }
        
        return currentScenes;
      });
      
      // Visual feedback during trimming
      if (handleType === 'left') {
        // Left handle - adjust width and transform
        const scaleX = newDuration / originalDuration;
        thumbnailElement.style.transform = `scaleX(${scaleX})`;
        thumbnailElement.style.transformOrigin = 'right';
      } else {
        // Right handle - just adjust width
        const scaleX = newDuration / originalDuration;
        thumbnailElement.style.transform = `scaleX(${scaleX})`;
        thumbnailElement.style.transformOrigin = 'left';
      }
      
      // Update active trim duration
      setActiveTrimDuration(newDuration);
    };

    // Mouse up handler to end trimming
    const handleMouseUp = (upEvent: MouseEvent) => {
      // Prevent default browser behavior
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      // Reset visual transformation
      if (thumbnailElement) {
        thumbnailElement.style.transform = '';
      }
      
      // Reset active trim duration
      setActiveTrimDuration(null);
      
      // Determine if we were actually dragging
      let wasDragging = false;
      
      if (handleType === 'left') {
        setIsDraggingLeftTrim(false);
        wasDragging = true;
        console.log("Left trim completed");
      } else {
        setIsDraggingRightTrim(false);
        wasDragging = true;
        console.log("Right trim completed");
      }

      // Clean up if we were dragging
      if (wasDragging) {
        // Clear trimming state
        setTrimmingSceneIndex(null);
        
        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Get the LATEST scene after trimming - use a callback to ensure we have the most recent state
        setScenes(currentScenes => {
          // Get the final scene with the updated duration
          const updatedScene = currentScenes[index];
          
          // Only show notification if we have a valid scene
          if (updatedScene) {
            // Notify user of the update with a nice animation - ONLY PLACE we show the toast
            toast.success(
              <div className="flex items-center gap-2">
                <span>Scene {index + 1} duration: </span>
                <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded text-purple-300">
                  {updatedScene.duration.toFixed(1)}s
                </span>
              </div>, 
              { duration: 2000, id: `trim-scene-${index}` }
            );
          }
          
          // Ensure the timeline reflects the final state
          recalculateTotalDuration(currentScenes);
          return currentScenes; // Return unchanged
        });
      }
    };

    // Add event listeners to the document to track mouse movement outside the handle
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {/* Left Handle */}
      <div
        className="absolute top-0 left-0 bottom-0 w-5 bg-gradient-to-r from-purple-600/90 to-purple-600/50 hover:from-purple-500 hover:to-purple-500/70 cursor-ew-resize z-20 rounded-l-sm flex items-center justify-center transition-all duration-150 group/handle"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleTrimMouseDown(e, 'left');
        }}
        title={`Trim start (Current: ${formatDuration(scene.duration)})`}
        data-handle="left"
        data-scene-index={index}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-[2px] bg-white/80 group-hover/handle:bg-white group-hover/handle:h-12 transition-all duration-150"></div>
      </div>

      {/* Right Handle */}
      <div
        className="absolute top-0 right-0 bottom-0 w-5 bg-gradient-to-l from-purple-600/90 to-purple-600/50 hover:from-purple-500 hover:to-purple-500/70 cursor-ew-resize z-20 rounded-r-sm flex items-center justify-center transition-all duration-150 group/handle"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleTrimMouseDown(e, 'right');
        }}
        title={`Trim end (Current: ${formatDuration(scene.duration)})`}
        data-handle="right"
        data-scene-index={index}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-[2px] bg-white/80 group-hover/handle:bg-white group-hover/handle:h-12 transition-all duration-150"></div>
      </div>

      {/* Duration Display on Selected */}
      <div className="absolute top-0 right-0 left-0 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 text-center pointer-events-none">
        {formatDuration(scene.duration)}
      </div>
      
      {/* Active Trim Duration Display */}
      {activeTrimDuration !== null && (
        <div className="absolute top-0 right-0 left-0 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 text-center pointer-events-none">
          {formatDuration(activeTrimDuration)}
        </div>
      )}
    </>
  );
};

export default TrimHandles;
