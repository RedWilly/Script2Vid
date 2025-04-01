// storyboard.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react"; 
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { Scene } from "@/types";

// Define interface for scene with duration and ID
interface SceneWithDuration extends Scene {
  id: string; // Ensure each scene has a unique ID
  duration: number;
}

const MIN_SCENE_DURATION = 0.5; // Minimum duration in seconds
const DEFAULT_SCENE_DURATION = 5.0; // Default duration in seconds

export default function StoryBoard() {
  const [scenes, setScenes] = useState<SceneWithDuration[]>([]);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('00:00');
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isDraggingLeftTrim, setIsDraggingLeftTrim] = useState(false);
  const [isDraggingRightTrim, setIsDraggingRightTrim] = useState(false);
  const [trimmingSceneIndex, setTrimmingSceneIndex] = useState<number | null>(null);
  const [activeTrimDuration, setActiveTrimDuration] = useState<number | null>(null);

  const timelineRulerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timelineRowRef = useRef<HTMLDivElement>(null);

  // --- Duration & Time Calculations ---

  const recalculateTotalDuration = useCallback((currentScenes: SceneWithDuration[]) => {
    const total = currentScenes.reduce((sum, scene) => sum + scene.duration, 0);
    console.log(`Recalculated total duration: ${total.toFixed(1)}s from ${currentScenes.length} scenes`);
    setTotalDuration(total);
    return total; // Return total for immediate use if needed
  }, [setTotalDuration]);

  const getSceneStartTime = useCallback((index: number, currentScenes: SceneWithDuration[]): number => {
    let startTime = 0;
    for (let i = 0; i < index; i++) {
      // Ensure scene exists, though it should in normal flow
      if (currentScenes[i]) {
        startTime += currentScenes[i].duration;
      }
    }
    return startTime;
  }, []);

  const getSceneIndexAtTime = useCallback((time: number, currentScenes: SceneWithDuration[], totalDur: number): number | null => {
    if (currentScenes.length === 0 || time < 0 || totalDur <= 0) return null;
    
    // If time is at or beyond total duration, return the last scene
    if (time >= totalDur) {
      return currentScenes.length - 1;
    }
    
    let accumulatedTime = 0;
    
    for (let i = 0; i < currentScenes.length; i++) {
      const scene = currentScenes[i];
      const sceneEndTime = accumulatedTime + scene.duration;
      
      // If time falls within this scene's duration
      if (time >= accumulatedTime && time < sceneEndTime) {
        return i;
      }
      
      accumulatedTime = sceneEndTime;
    }
    
    // Fallback to first scene if no match found (shouldn't happen with proper time bounds)
    console.warn(`Could not find scene at time ${time}s, defaulting to first scene`);
    return 0;
  }, []);

  // --- Playhead & Timeline Interaction ---

  const updatePlayheadPosition = useCallback((time: number, currentTotalDuration: number) => {
    if (!playheadRef.current || !timelineRulerRef.current || currentTotalDuration <= 0) {
       // If duration is 0, explicitly set playhead to start
       if (playheadRef.current) playheadRef.current.style.left = '0px';
       return;
    }

    const timelineWidth = timelineRulerRef.current.offsetWidth;
    const clampedTime = Math.max(0, Math.min(time, currentTotalDuration));
    const percentage = clampedTime / currentTotalDuration;
    const position = percentage * timelineWidth;

    playheadRef.current.style.left = `${position}px`;
  }, [playheadRef, timelineRulerRef]);

  const scrollToSelectedScene = useCallback((index: number | null) => {
    if (index === null || !timelineRowRef.current) return;
    // Ensure children are loaded before accessing
    if (timelineRowRef.current.children.length > index) {
        const thumbnailElement = timelineRowRef.current.children[index + 1] as HTMLElement; // +1 because play button is first child
        if (thumbnailElement) {
            thumbnailElement.scrollIntoView({
                behavior: 'smooth',
                inline: 'nearest',
                block: 'nearest'
            });
        }
    }
  }, [timelineRowRef]);

  // --- Scene Selection ---
  const handleSceneSelect = useCallback((index: number, forceSelect: boolean = false) => {
    // Don't change selection while trimming unless forced
    if ((isDraggingLeftTrim || isDraggingRightTrim) && !forceSelect) return;

    if (index >= 0 && index < scenes.length) {
      console.log(`Selecting scene ${index + 1}`);
      setSelectedSceneIndex(index);
      
      // Jump playhead to the start of the selected scene
      const sceneStartTime = getSceneStartTime(index, scenes);
      setCurrentTime(sceneStartTime);
      
      // Stop playback when selecting a new scene manually
      if (isPlaying) setIsPlaying(false);
      
      // Scroll to make the selected scene visible
      scrollToSelectedScene(index);
    }
  }, [scenes, getSceneStartTime, isPlaying, isDraggingLeftTrim, isDraggingRightTrim, scrollToSelectedScene]);

  // Dedicated function for handling scene click events
  const handleSceneClick = useCallback((e: React.MouseEvent, index: number) => {
    // Stop event propagation to prevent other handlers from firing
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`Scene ${index + 1} clicked`);
    handleSceneSelect(index);
  }, [handleSceneSelect]);

  const handleSceneSelectWithEvent = useCallback((event: React.MouseEvent<HTMLDivElement>, index: number) => {
    event.stopPropagation();
    handleSceneSelect(index);
  }, [handleSceneSelect]);

  // Update playhead position whenever time or duration changes
  useEffect(() => {
    updatePlayheadPosition(currentTime, totalDuration);

    // Update selected scene based on time, only if NOT dragging playhead or trimming
    if (!isDraggingPlayhead && !isDraggingLeftTrim && !isDraggingRightTrim) {
        const sceneIndex = getSceneIndexAtTime(currentTime, scenes, totalDuration);
         if (sceneIndex !== null && sceneIndex !== selectedSceneIndex) {
            setSelectedSceneIndex(sceneIndex);
             // Don't scroll automatically during playback, can be jarring
            // scrollToSelectedScene(sceneIndex);
        } else if (currentTime >= totalDuration && scenes.length > 0 && selectedSceneIndex !== scenes.length -1) {
            // If playback reaches the end, make sure last scene is selected
            setSelectedSceneIndex(scenes.length - 1);
        }
    }
  }, [currentTime, totalDuration, scenes, isDraggingPlayhead, isDraggingLeftTrim, isDraggingRightTrim, selectedSceneIndex, updatePlayheadPosition, getSceneIndexAtTime]);

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
        // Don't auto-scroll here, selection happens in useEffect
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

  // --- Trimming Logic ---
  const handleTrimMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number,
    handleType: 'left' | 'right'
  ) => {
    // Prevent any default browser behavior
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`Starting trim operation on scene ${index + 1}, handle: ${handleType}`);
    
    // Force select this scene if not already selected
    if (index !== selectedSceneIndex) {
      console.log(`Forcing selection of scene ${index + 1} for trimming`);
      handleSceneSelect(index, true);
    }

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
        if (trimmingSceneIndex === null) return;

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
        let newDuration = Math.max(MIN_SCENE_DURATION, originalDuration + timeDelta);
        
        // Apply constraints based on handle type
        if (handleType === 'left') {
            // For left handle, check if we're pushing against previous scene
            if (index > 0) {
                const prevScene = scenes[index - 1];
                const prevSceneEnd = getSceneStartTime(index, scenes);
                const maxReduction = originalScene.duration - MIN_SCENE_DURATION;
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
            if (trimmingSceneIndex >= currentScenes.length) return currentScenes;
            
            const sceneToTrim = currentScenes[trimmingSceneIndex];
            
            // Only update if duration actually changed
            if (Math.abs(newDuration - sceneToTrim.duration) > 0.01) {
                const updatedScenes = [...currentScenes];
                updatedScenes[trimmingSceneIndex] = { 
                    ...sceneToTrim, 
                    duration: newDuration 
                };
                
                // Recalculate total duration with the updated scenes
                recalculateTotalDuration(updatedScenes);
                
                // Update current time to match the handle position
                if (handleType === 'left') {
                    const newStartTime = getSceneStartTime(trimmingSceneIndex, updatedScenes);
                    setCurrentTime(newStartTime);
                } else {
                    const newStartTime = getSceneStartTime(trimmingSceneIndex, updatedScenes);
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
        
        if (handleType === 'left' && isDraggingLeftTrim) {
            setIsDraggingLeftTrim(false);
            wasDragging = true;
            console.log("Left trim completed");
        } else if (handleType === 'right' && isDraggingRightTrim) {
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
            
            // Get the final scene after trimming
            const finalScene = scenes[index];
            
            // Notify user of the update with a nice animation
            toast.success(
                <div className="flex items-center gap-2">
                    <span>Scene {index + 1} duration: </span>
                    <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded text-purple-300">
                        {finalScene.duration.toFixed(1)}s
                    </span>
                </div>, 
                { duration: 2000 }
            );
            
            // Ensure the timeline reflects the final state
            recalculateTotalDuration(scenes);
        }
    };

    // Add event listeners to the document to track mouse movement outside the handle
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // --- Effects ---

  // Load scenes from local storage
   useEffect(() => {
    // Clear any previous scenes to avoid stale data
    setScenes([]);
    setSelectedSceneIndex(null);
    
    const storedScenes = localStorage.getItem('scriptVizScenes');
    console.log("StoryBoard: Loading scenes from localStorage", storedScenes ? "Found data" : "No data found");
    
    let loadedScenes: SceneWithDuration[] = [];
    if (storedScenes) {
      try {
        const parsedScenes = JSON.parse(storedScenes);
        console.log("StoryBoard: Parsed scenes", parsedScenes);
        
        // Check if we have valid scenes data
        if (!Array.isArray(parsedScenes)) {
          console.error("StoryBoard: Parsed scenes is not an array", parsedScenes);
          toast.error("Invalid scenes data format.");
          return;
        }
        
        // Only include scenes that have an imageUrl
        const scenesWithImages = parsedScenes.filter((scene: Scene) => Boolean(scene.imageUrl));
        console.log("StoryBoard: Scenes with images", scenesWithImages.length);
        
        if (scenesWithImages.length === 0) {
          toast.info("No scenes with images found in storage.");
          return;
        }
        
        // Map the scenes to include duration
        loadedScenes = scenesWithImages.map((scene: Scene, index: number): SceneWithDuration => {
          // Ensure each scene has a valid duration
          const duration = typeof scene.duration === 'number' && scene.duration >= MIN_SCENE_DURATION
                      ? scene.duration
                      : DEFAULT_SCENE_DURATION;
          
          // Ensure each scene has a valid ID
          const id = scene.id || `scene-${index}-${Date.now()}`;
          
          const mappedScene = {
            ...scene,
            duration,
            id
          };
          console.log(`StoryBoard: Mapped scene ${index}`, mappedScene);
          return mappedScene;
        });

        console.log("StoryBoard: Final loaded scenes", loadedScenes);
        toast.success(`Loaded ${loadedScenes.length} scenes.`);
      } catch (error) {
        console.error("Error parsing stored scenes:", error);
        toast.error("Failed to load scenes.");
        return;
      }
    } else {
      toast.info("No scenes found in storage.");
      return;
    }
    
    // Only update state if we have valid scenes
    if (loadedScenes.length > 0) {
      setScenes(loadedScenes);
      setSelectedSceneIndex(0); // Select the first scene
      setCurrentTime(0);
      
      // Calculate total duration using the function directly
      let totalDur = 0;
      for (const scene of loadedScenes) {
        totalDur += scene.duration;
      }
      setTotalDuration(totalDur);
      
      // Update playhead position manually
      if (playheadRef.current && timelineRulerRef.current) {
        const rulerWidth = timelineRulerRef.current.offsetWidth;
        const position = (0 / totalDur) * rulerWidth;
        playheadRef.current.style.left = `${position}px`;
      }
    }
  }, []); // Only run once on mount

  // Playback timer logic
 useEffect(() => {
    let playbackInterval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      playbackInterval = setInterval(() => {
        setCurrentTime((prevTime) => {
          // If we've reached the end of all scenes, reset to beginning
          if (prevTime >= totalDuration) {
            console.log("Reached end of timeline, resetting to beginning");
            return 0;
          }
          
          const newTime = prevTime + 0.1; // Update every 100ms
          
          // Update selected scene if needed
          const sceneIndex = getSceneIndexAtTime(newTime, scenes, totalDuration);
          if (sceneIndex !== null && sceneIndex !== selectedSceneIndex) {
            setSelectedSceneIndex(sceneIndex);
          }
          
          return newTime;
        });
      }, 100);
    }
    
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [isPlaying, totalDuration, scenes, selectedSceneIndex]);

  // Update playhead position based on current time
  useEffect(() => {
    if (!playheadRef.current || !timelineRulerRef.current) return;
    
    // Calculate percentage position
    const percentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
    playheadRef.current.style.left = `${percentage}%`;
    
    // Update time display
    setCurrentTimeDisplay(formatDuration(currentTime));
    
    // Update selected scene based on current time if not dragging
    if (!isDraggingLeftTrim && !isDraggingRightTrim && !isDraggingPlayhead) {
      const sceneIndex = getSceneIndexAtTime(currentTime, scenes, totalDuration);
      if (sceneIndex !== null && sceneIndex !== selectedSceneIndex) {
        setSelectedSceneIndex(sceneIndex);
      }
    }
  }, [currentTime, totalDuration, isDraggingLeftTrim, isDraggingRightTrim, isDraggingPlayhead, scenes, selectedSceneIndex]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log(`Playback ${!isPlaying ? 'started' : 'paused'} at ${currentTime.toFixed(1)}s`);
  };

  // --- Helper Functions ---

  const formatDuration = (timeInSeconds: number): string => {
      return `${timeInSeconds.toFixed(1)}s`;
  }
  
  const formatDisplayTime = (timeInSeconds: number): string => {
    const totalSeconds = Math.max(0, Math.floor(timeInSeconds));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- Scene Add/Delete ---
   const handleAddScene = () => {
     // Get the last scene or the first one if no scene is selected
     const sceneToAddFrom = scenes.length > 0 ? scenes[scenes.length - 1] : null;
     
     if (sceneToAddFrom) {
         const newScene: SceneWithDuration = {
             ...sceneToAddFrom,
             duration: DEFAULT_SCENE_DURATION, // Give default duration to new scene
             id: `scene-${scenes.length}-${Date.now()}`,
         };
         
         // Add the scene to the end of the array (which will display it horizontally next to the others)
         const updatedScenes = [...scenes, newScene];
         
         setScenes(updatedScenes);
         recalculateTotalDuration(updatedScenes);
         setSelectedSceneIndex(scenes.length); // Select the newly added scene
         
         // Scroll to the newly added scene after a short delay to ensure the DOM has updated
         setTimeout(() => {
           scrollToSelectedScene(scenes.length);
         }, 50);
         
         toast.success("Scene added to timeline.");
     } else {
         toast.error("Cannot add scene: No existing scenes.");
     }
};

const handleDeleteScene = (indexToDelete: number) => {
    if (indexToDelete < 0 || indexToDelete >= scenes.length || isDraggingLeftTrim || isDraggingRightTrim) return;

    const sceneToDelete = scenes[indexToDelete];
    const updatedScenes = scenes.filter((_, index) => index !== indexToDelete);
    const deletedSceneDuration = sceneToDelete.duration;
    const deletedSceneStartTime = getSceneStartTime(indexToDelete, scenes); // Use original scenes array for start time

    let newSelectedSceneIndex = selectedSceneIndex;
    let newCurrentTime = currentTime;

    if (updatedScenes.length === 0) {
        newSelectedSceneIndex = null;
        newCurrentTime = 0;
    } else {
         // Adjust selection
         if (selectedSceneIndex === indexToDelete) {
             newSelectedSceneIndex = Math.max(0, indexToDelete - 1);
         } else if (selectedSceneIndex !== null && selectedSceneIndex > indexToDelete) {
             newSelectedSceneIndex = selectedSceneIndex - 1; // Explicitly assign to avoid decrementing null
         }
         // Clamp index
         if (newSelectedSceneIndex !== null && newSelectedSceneIndex >= updatedScenes.length) {
            newSelectedSceneIndex = updatedScenes.length -1;
         }

         // Adjust current time
         if (currentTime > deletedSceneStartTime) {
             if (currentTime < deletedSceneStartTime + deletedSceneDuration) {
                // Time was within the deleted scene, move to its start (which is now end of prev or 0)
                newCurrentTime = getSceneStartTime(indexToDelete, updatedScenes); // Start time of the *next* element in the *new* array
             } else {
                 // Time was after the deleted scene
                newCurrentTime -= deletedSceneDuration;
             }
             newCurrentTime = Math.max(0, newCurrentTime); // Ensure non-negative
         }
         // If the new selected index exists, make sure current time is within its bounds
         if(newSelectedSceneIndex !== null) {
             const selectedStartTime = getSceneStartTime(newSelectedSceneIndex, updatedScenes);
             const selectedEndTime = selectedStartTime + updatedScenes[newSelectedSceneIndex].duration;
             newCurrentTime = Math.max(selectedStartTime, Math.min(newCurrentTime, selectedEndTime));
         } else {
             newCurrentTime = 0; // Reset time if no scene is selected
         }
    }

    setScenes(updatedScenes);
    const newTotal = recalculateTotalDuration(updatedScenes);
    setSelectedSceneIndex(newSelectedSceneIndex);
    setCurrentTime(newCurrentTime); // Update time *after* scenes/duration are set
    updatePlayheadPosition(newCurrentTime, newTotal); // Ensure playhead updates immediately

    toast.warning(`Scene ${indexToDelete + 1} deleted.`);

    // Scroll after state update
    setTimeout(() => {
        if (newSelectedSceneIndex !== null) {
            scrollToSelectedScene(newSelectedSceneIndex);
        }
    }, 50);
};

  // ---- UI Rendering ----
  const currentSceneForPreview = selectedSceneIndex !== null && selectedSceneIndex >= 0 && selectedSceneIndex < scenes.length
      ? scenes[selectedSceneIndex]
      : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" /></svg>
            <span className="text-blue-400">Script</span><span className="text-white">Viz</span><span className="text-purple-400 ml-2">StoryBoard</span>
          </h1>
          <div className="ml-4 flex items-center gap-2">
            <Button 
              onClick={() => window.location.href = '/scene-visualizer'}
              variant="outline" 
              size="sm"
              className="text-xs flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" /></svg>
              <span>Back to Scene Visualizer</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => toast.info("Export feature coming soon!")} className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-6 py-2 rounded-md transition-all shadow-md hover:shadow-lg flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" /></svg>
              <span className="truncate">Export</span>
          </Button>
          <Link href="/scene-visualizer">
            <Button variant="outline" className="bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-700 rounded-md transition-all hover:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" /></svg>
              <span className="truncate">Back</span>
            </Button>
          </Link>
        </div>
      </header>
      {/* Main content area */}
      <main className="flex-grow flex flex-col p-4 sm:p-6 gap-4 sm:gap-6">
        {/* Preview Area */}
        <div className="flex-grow bg-black border border-gray-800 rounded-xl overflow-hidden shadow-xl relative flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            {currentSceneForPreview ? (
            <img
                key={currentSceneForPreview.id} // Force re-render on scene change
                src={currentSceneForPreview.imageUrl}
                alt={`Scene ${selectedSceneIndex !== null ? selectedSceneIndex + 1 : ''}`}
                className="max-w-full max-h-full object-contain"
            />
            ) : (
            <div className="text-gray-500 text-center p-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2 text-gray-700" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                <p className="text-lg">{scenes.length > 0 ? "Select a scene" : "No scenes loaded"}</p>
                <p className="text-sm">Use the timeline below</p>
            </div>
            )}
            {currentSceneForPreview && selectedSceneIndex !== null && (
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 text-white pointer-events-none">
                    <span className="font-semibold drop-shadow-md">Scene {selectedSceneIndex + 1}</span>
                 </div>
             )}
        </div>

        {/* Timeline Section */}
        <div className="flex-shrink-0 bg-black border border-gray-800 rounded-xl p-3 sm:p-4 shadow-xl">
          {/* Ruler and Playhead */}
           <div
            ref={timelineRulerRef}
            className="h-8 bg-gray-800 rounded-t-md relative cursor-pointer mb-2"
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
                         <div key={i} className="absolute top-0 bottom-0 border-l border-gray-600" style={{ left: `${percentage}%` }}>
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
                      className={`absolute top-0 bottom-0 ${selectedSceneIndex === index ? 'bg-purple-500/20' : 'bg-gray-600/20'} border-r border-gray-600`}
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
          {/* Controls + Thumbnails Row */}
          <div className="flex items-center gap-3">
             {/* Play Button */}
             <Button onClick={handlePlayPause} variant="ghost" className="bg-gray-700 hover:bg-gray-600 text-white rounded-md h-16 w-12 flex items-center justify-center flex-shrink-0 p-0" disabled={totalDuration <= 0} >
                 {isPlaying ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                             : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
             </Button>
             
             {/* Time Display */}
             <div className="text-xs text-gray-300 font-mono bg-gray-800 px-2 py-1 rounded flex-shrink-0">
                {currentTimeDisplay} / {formatDuration(totalDuration)}
             </div>

            {/* Scrollable Thumbnails */}
            <div ref={timelineRowRef} className="flex-grow overflow-x-auto whitespace-nowrap h-20 py-2 space-x-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800" >
              {scenes.map((scene, index) => (
                <div
                  key={scene.id}
                  className={`relative inline-block w-28 h-16 rounded border-2 align-top cursor-pointer transition-all duration-150 group flex-shrink-0 focus:outline-none ${
                    selectedSceneIndex === index
                      ? 'border-purple-500 shadow-lg shadow-purple-500/30'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  onClick={(e) => handleSceneClick(e, index)}
                  tabIndex={0}
                  onFocus={() => handleSceneSelect(index, true)}
                  data-scene-index={index}
                  role="button"
                  aria-pressed={selectedSceneIndex === index}
                  aria-label={`Scene ${index + 1}`}
                >
                  {/* Thumbnail Image */}
                  <img 
                    src={scene.imageUrl} 
                    alt={`Thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover rounded-[1px]" 
                    loading="lazy"
                    draggable={false} // Prevent accidental dragging
                    onClick={(e) => e.stopPropagation()} // Prevent double-firing
                  />

                  {/* Scene Number */}
                  <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white text-[10px] px-1 py-0.5 rounded-tr-md pointer-events-none">
                    {index + 1}
                  </div>

                   {/* --- Trim Handles (Conditional) --- */}
                   {selectedSceneIndex === index && (
                     <>
                       {/* Left Handle */}
                       <div
                         className="absolute top-0 left-0 bottom-0 w-5 bg-gradient-to-r from-purple-600/90 to-purple-600/50 hover:from-purple-500 hover:to-purple-500/70 cursor-ew-resize z-20 rounded-l-sm flex items-center justify-center transition-all duration-150 group/handle"
                         onMouseDown={(e) => {
                           e.stopPropagation();
                           handleTrimMouseDown(e, index, 'left');
                         }}
                         title={`Trim start (Current: ${formatDuration(scene.duration)})`}
                         data-handle="left"
                         data-scene-index={index}
                       >
                           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-[2px] bg-white/80 group-hover/handle:bg-white group-hover/handle:h-10 transition-all duration-150"></div>
                           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-[2px] bg-white/80 group-hover/handle:bg-white group-hover/handle:h-10 transition-all duration-150 rotate-90"></div>
                       </div>

                       {/* Right Handle */}
                       <div
                         className="absolute top-0 right-0 bottom-0 w-5 bg-gradient-to-l from-purple-600/90 to-purple-600/50 hover:from-purple-500 hover:to-purple-500/70 cursor-ew-resize z-20 rounded-r-sm flex items-center justify-center transition-all duration-150 group/handle"
                         onMouseDown={(e) => {
                           e.stopPropagation();
                           handleTrimMouseDown(e, index, 'right');
                         }}
                         title={`Trim end (Current: ${formatDuration(scene.duration)})`}
                         data-handle="right"
                         data-scene-index={index}
                       >
                           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-[2px] bg-white/80 group-hover/handle:bg-white group-hover/handle:h-10 transition-all duration-150"></div>
                           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-[2px] bg-white/80 group-hover/handle:bg-white group-hover/handle:h-10 transition-all duration-150 rotate-90"></div>
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
                   )}

                   {/* Delete Button (Show on hover/focus) */}
                   <Button 
                      variant="destructive" 
                      size="icon" 
                      className={`absolute top-1 ${selectedSceneIndex === index ? 'left-3' : 'left-1'} h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-150 z-20 bg-red-600/80 hover:bg-red-500`}
                      onClick={(e) => { 
                        e.preventDefault();
                        e.stopPropagation(); 
                        handleDeleteScene(index); 
                      }}
                      aria-label={`Delete scene ${index + 1}`}
                      data-scene-index={index}
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                   </Button>
                </div>
              ))}
              {/* Add Scene Button */}
              <div 
                className="relative inline-block w-28 h-16 rounded border-2 border-dashed border-gray-500 align-top cursor-pointer transition-all hover:border-purple-500 hover:bg-gray-800/50 flex items-center justify-center flex-shrink-0 group" 
                onClick={handleAddScene} 
                title="Add Scene"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 group-hover:text-purple-400 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 01-1 1h-5a1 1 0 110-2h5V8a1 1 0 011-1V4a1 1 0 110-2z" clipRule="evenodd" />
                </svg>
                <span className="absolute bottom-1 text-xs text-gray-400 group-hover:text-gray-300">Add Scene</span>
              </div>
            </div>

             {/* Time Display */}
             <div className="flex-shrink-0 text-sm text-gray-400 font-mono ml-3 hidden md:block">
                 {formatDisplayTime(currentTime)} / {formatDisplayTime(totalDuration)}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}