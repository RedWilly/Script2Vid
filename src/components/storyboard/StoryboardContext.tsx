"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { Howl } from 'howler';
import { SceneWithDuration, MIN_SCENE_DURATION, DEFAULT_SCENE_DURATION, VoiceOverFile } from './types';

interface StoryboardContextType {
  // Scene state
  scenes: SceneWithDuration[];
  setScenes: React.Dispatch<React.SetStateAction<SceneWithDuration[]>>;
  selectedSceneIndex: number | null;
  setSelectedSceneIndex: React.Dispatch<React.SetStateAction<number | null>>;
  
  // Playback state
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  totalDuration: number;
  setTotalDuration: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  currentTimeDisplay: string;
  
  // Voice-over state
  voiceOver: VoiceOverFile | null;
  setVoiceOver: React.Dispatch<React.SetStateAction<VoiceOverFile | null>>;
  isVoiceOverPlaying: boolean;
  isVoiceOverLoaded: boolean;
  
  // Trim state
  isTrimming: boolean;
  trimmingSceneIndex: number | null;
  setTrimmingSceneIndex: React.Dispatch<React.SetStateAction<number | null>>;
  isDraggingLeftTrim: boolean;
  setIsDraggingLeftTrim: React.Dispatch<React.SetStateAction<boolean>>;
  isDraggingRightTrim: boolean;
  setIsDraggingRightTrim: React.Dispatch<React.SetStateAction<boolean>>;
  activeTrimDuration: number | null;
  setActiveTrimDuration: React.Dispatch<React.SetStateAction<number | null>>;
  
  // Playhead state
  isDraggingPlayhead: boolean;
  setIsDraggingPlayhead: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Export state
  isExporting: boolean;
  setIsExporting: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Sidebar state
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Refs
  timelineRulerRef: React.RefObject<HTMLDivElement>;
  playheadRef: React.RefObject<HTMLDivElement>;
  timelineRowRef: React.RefObject<HTMLDivElement>;
  
  // Functions
  recalculateTotalDuration: (currentScenes: SceneWithDuration[]) => number;
  getSceneStartTime: (index: number, currentScenes: SceneWithDuration[]) => number;
  getSceneIndexAtTime: (time: number, currentScenes: SceneWithDuration[], totalDur: number) => number | null;
  updatePlayheadPosition: (time: number, currentTotalDuration: number) => void;
  scrollToSelectedScene: (index: number | null) => void;
  handleSceneSelect: (index: number, forceSelect?: boolean) => void;
  handleSceneClick: (e: React.MouseEvent, index: number) => void;
  handleAddScene: () => void;
  handleDeleteScene: (indexToDelete: number) => void;
  handlePlayPause: () => void;
  handleExportVideo: () => Promise<void>;
  
  // Voice-over methods
  handleAddVoiceOver: (voiceOverFile: VoiceOverFile) => void;
  handlePlayVoiceOver: () => void;
  handlePauseVoiceOver: () => void;
}

const StoryboardContext = createContext<StoryboardContextType | undefined>(undefined);

export const useStoryboard = () => {
  const context = useContext(StoryboardContext);
  if (context === undefined) {
    throw new Error('useStoryboard must be used within a StoryboardProvider');
  }
  return context;
};

interface StoryboardProviderProps {
  children: ReactNode;
}

export const StoryboardProvider: React.FC<StoryboardProviderProps> = ({ children }) => {
  // Scene state
  const [scenes, setScenes] = useState<SceneWithDuration[]>([]);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null);
  
  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('00:00');
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Voice-over state
  const [voiceOver, setVoiceOver] = useState<VoiceOverFile | null>(null);
  const [isVoiceOverPlaying, setIsVoiceOverPlaying] = useState(false);
  const [isVoiceOverLoaded, setIsVoiceOverLoaded] = useState(false);
  const voiceOverRef = useRef<Howl | null>(null);
  
  // Trim state
  const [isDraggingLeftTrim, setIsDraggingLeftTrim] = useState(false);
  const [isDraggingRightTrim, setIsDraggingRightTrim] = useState(false);
  const [trimmingSceneIndex, setTrimmingSceneIndex] = useState<number | null>(null);
  const [activeTrimDuration, setActiveTrimDuration] = useState<number | null>(null);
  
  // Playhead state
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  
  // Sidebar state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  // Refs
  const timelineRulerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timelineRowRef = useRef<HTMLDivElement>(null);
  
  // Computed state
  const isTrimming = isDraggingLeftTrim || isDraggingRightTrim;
  
  // --- Duration & Time Calculations ---
  const recalculateTotalDuration = useCallback((currentScenes: SceneWithDuration[]) => {
    const total = currentScenes.reduce((sum, scene) => sum + scene.duration, 0);
    console.log(`Recalculated total duration: ${total.toFixed(1)}s from ${currentScenes.length} scenes`);
    setTotalDuration(total);
    return total;
  }, [setTotalDuration]);

  const getSceneStartTime = useCallback((index: number, currentScenes: SceneWithDuration[]): number => {
    let startTime = 0;
    for (let i = 0; i < index; i++) {
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
  }, []);

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
  }, []);

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

  // --- Scene Add/Delete ---
  const handleAddScene = useCallback(() => {
    // Get the last scene or the first one if no scene is selected
    const sceneToAddFrom = scenes.length > 0 ? scenes[scenes.length - 1] : null;
    
    if (sceneToAddFrom) {
      const newScene: SceneWithDuration = {
        ...sceneToAddFrom,
        duration: DEFAULT_SCENE_DURATION,
        id: `scene-${scenes.length}-${Date.now()}`,
      };
      
      // Add the scene to the end of the array
      const updatedScenes = [...scenes, newScene];
      
      setScenes(updatedScenes);
      recalculateTotalDuration(updatedScenes);
      setSelectedSceneIndex(scenes.length); // Select the newly added scene
      
      // Scroll to the newly added scene after a short delay
      setTimeout(() => {
        scrollToSelectedScene(scenes.length);
      }, 50);
      
      toast.success("Scene added to timeline.");
    } else {
      toast.error("Cannot add scene: No existing scenes.");
    }
  }, [scenes, recalculateTotalDuration, scrollToSelectedScene]);

  const handleDeleteScene = useCallback((indexToDelete: number) => {
    if (indexToDelete < 0 || indexToDelete >= scenes.length || isDraggingLeftTrim || isDraggingRightTrim) return;

    const sceneToDelete = scenes[indexToDelete];
    const updatedScenes = scenes.filter((_, index) => index !== indexToDelete);
    const deletedSceneDuration = sceneToDelete.duration;
    const deletedSceneStartTime = getSceneStartTime(indexToDelete, scenes);

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
        newSelectedSceneIndex = selectedSceneIndex - 1;
      }
      // Clamp index
      if (newSelectedSceneIndex !== null && newSelectedSceneIndex >= updatedScenes.length) {
        newSelectedSceneIndex = updatedScenes.length - 1;
      }

      // Adjust current time
      if (currentTime > deletedSceneStartTime) {
        if (currentTime < deletedSceneStartTime + deletedSceneDuration) {
          // Time was within the deleted scene, move to its start
          newCurrentTime = getSceneStartTime(indexToDelete, updatedScenes);
        } else {
          // Time was after the deleted scene
          newCurrentTime -= deletedSceneDuration;
        }
        newCurrentTime = Math.max(0, newCurrentTime);
      }
      // If the new selected index exists, make sure current time is within its bounds
      if (newSelectedSceneIndex !== null) {
        const selectedStartTime = getSceneStartTime(newSelectedSceneIndex, updatedScenes);
        const selectedEndTime = selectedStartTime + updatedScenes[newSelectedSceneIndex].duration;
        newCurrentTime = Math.max(selectedStartTime, Math.min(newCurrentTime, selectedEndTime));
      } else {
        newCurrentTime = 0;
      }
    }

    setScenes(updatedScenes);
    const newTotal = recalculateTotalDuration(updatedScenes);
    setSelectedSceneIndex(newSelectedSceneIndex);
    setCurrentTime(newCurrentTime);
    updatePlayheadPosition(newCurrentTime, newTotal);

    toast.warning(`Scene ${indexToDelete + 1} deleted.`);

    // Scroll after state update
    setTimeout(() => {
      if (newSelectedSceneIndex !== null) {
        scrollToSelectedScene(newSelectedSceneIndex);
      }
    }, 50);
  }, [scenes, selectedSceneIndex, currentTime, isDraggingLeftTrim, isDraggingRightTrim, getSceneStartTime, recalculateTotalDuration, updatePlayheadPosition, scrollToSelectedScene]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
    console.log(`Playback ${!isPlaying ? 'started' : 'paused'} at ${currentTime.toFixed(1)}s`);
  }, [isPlaying, currentTime]);

  // Handle video export
  const handleExportVideo = useCallback(async () => {
    if (scenes.length === 0) {
      toast.error("No scenes to export");
      return;
    }

    try {
      setIsExporting(true);
      // Create a toast ID to reference the loading toast later
      const toastId = toast.loading("Generating video...");

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'storyboard_video.mp4';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Dismiss the loading toast and show the success toast
      toast.dismiss(toastId);
      toast.success("Video exported successfully!");
    } catch (error) {
      console.error('Error exporting video:', error);
      // Dismiss any existing toasts before showing the error
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Failed to export video');
    } finally {
      setIsExporting(false);
    }
  }, [scenes]);

  // Update time display whenever current time changes
  useEffect(() => {
    setCurrentTimeDisplay(`${currentTime.toFixed(1)}s`);
  }, [currentTime]);

  // Load scenes from local storage on mount
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
        const scenesWithImages = parsedScenes.filter((scene: any) => Boolean(scene.imageUrl));
        console.log("StoryBoard: Scenes with images", scenesWithImages.length);
        
        if (scenesWithImages.length === 0) {
          toast.info("No scenes with images found in storage.");
          return;
        }
        
        // Map the scenes to include duration
        loadedScenes = scenesWithImages.map((scene: any, index: number): SceneWithDuration => {
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
        
        // Preload all scene images
        preloadAllSceneImages(loadedScenes);
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
      
      // Calculate total duration
      const totalDur = loadedScenes.reduce((sum, scene) => sum + scene.duration, 0);
      setTotalDuration(totalDur);
    }
  }, []);

  // Function to preload all scene images
  const preloadAllSceneImages = (scenes: SceneWithDuration[]) => {
    const toastId = toast.loading(`Preloading ${scenes.length} scene images...`);
    let loadedCount = 0;
    
    // Create an array to track which images have loaded
    const imagePromises = scenes
      .filter(scene => scene.imageUrl)
      .map(scene => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          
          img.onload = () => {
            loadedCount++;
            if (loadedCount === scenes.length) {
              toast.dismiss(toastId);
              toast.success("All scene images preloaded");
            }
            resolve();
          };
          
          img.onerror = () => {
            console.error(`Failed to preload image: ${scene.imageUrl}`);
            loadedCount++;
            if (loadedCount === scenes.length) {
              toast.dismiss(toastId);
              toast.success("All scene images preloaded");
            }
            resolve();
          };
          
          // Start loading the image
          img.src = scene.imageUrl as string;
        });
      });
    
    // Wait for all images to load
    Promise.all(imagePromises)
      .then(() => {
        console.log("All scene images preloaded successfully");
      })
      .catch(error => {
        console.error("Error preloading images:", error);
      });
  };

  // Load voice-over audio using Howler.js
  useEffect(() => {
    if (!voiceOver) return;
    
    // Reset state
    setIsVoiceOverLoaded(false);
    setIsVoiceOverPlaying(false);
    
    // Destroy previous Howl instance if it exists
    if (voiceOverRef.current) {
      voiceOverRef.current.unload();
      voiceOverRef.current = null;
    }
    
    // Show loading indicator
    const loadingToastId = toast.loading('Loading voice-over audio...');
    
    // Create new Howl instance
    const sound = new Howl({
      src: [voiceOver.url],
      html5: true, // Use HTML5 Audio for better streaming support
      preload: true, // Preload the audio
      format: ['mp3', 'wav'], // Supported formats
      onload: () => {
        console.log('Voice-over loaded successfully');
        setIsVoiceOverLoaded(true);
        toast.dismiss(loadingToastId);
        toast.success('Voice-over loaded successfully');
      },
      onloaderror: (id, error) => {
        console.error('Error loading voice-over:', error);
        toast.dismiss(loadingToastId);
        toast.error('Failed to load voice-over audio');
      },
      onplay: () => {
        console.log('Voice-over started playing');
        setIsVoiceOverPlaying(true);
      },
      onpause: () => {
        console.log('Voice-over paused');
        setIsVoiceOverPlaying(false);
      },
      onstop: () => {
        console.log('Voice-over stopped');
        setIsVoiceOverPlaying(false);
      },
      onend: () => {
        console.log('Voice-over playback ended');
        setIsVoiceOverPlaying(false);
      }
    });
    
    voiceOverRef.current = sound;
    
  }, [voiceOver]);

  // Handle voice-over playback state changes
  useEffect(() => {
    if (!voiceOverRef.current || !isVoiceOverLoaded) return;
    
    if (isPlaying) {
      console.log('Timeline is playing, starting voice-over');
      
      // Get current position of the voice-over
      const currentSoundPosition = voiceOverRef.current.seek() as number;
      
      // If we need to seek to a different position (more than 0.1s difference)
      if (Math.abs(currentTime - currentSoundPosition) > 0.1) {
        console.log(`Seeking voice-over to ${currentTime}s`);
        voiceOverRef.current.seek(currentTime);
      }
      
      // Play if not already playing
      if (!voiceOverRef.current.playing()) {
        voiceOverRef.current.play();
      }
    } else {
      // Pause voice-over when timeline is paused
      if (voiceOverRef.current.playing()) {
        console.log('Pausing voice-over');
        voiceOverRef.current.pause();
      }
    }
  }, [isPlaying, currentTime, isVoiceOverLoaded]);

  // Update voice-over position when timeline position changes
  useEffect(() => {
    if (!voiceOverRef.current || !isVoiceOverLoaded || !isPlaying) return;
    
    // If the time has changed significantly (e.g., seeking), update voice-over position
    const currentSoundPosition = voiceOverRef.current.seek() as number;
    if (Math.abs(currentTime - currentSoundPosition) > 0.1) {
      console.log(`Seeking voice-over to ${currentTime}s`);
      voiceOverRef.current.seek(currentTime);
    }
  }, [currentTime, isVoiceOverLoaded, isPlaying]);

  // Handle adding a voice-over to the timeline
  const handleAddVoiceOver = useCallback((voiceOverFile: VoiceOverFile) => {
    console.log('Adding voice-over to timeline:', voiceOverFile.name);
    
    // Reset audio state when changing voice-over
    if (voiceOverRef.current) {
      voiceOverRef.current.stop();
      voiceOverRef.current.unload();
      voiceOverRef.current = null;
    }
    
    setIsVoiceOverLoaded(false);
    setIsVoiceOverPlaying(false);
    
    setVoiceOver(voiceOverFile);
    toast.success(`Voice-over "${voiceOverFile.name}" added to timeline`);
  }, []);
  
  // Handle playing voice-over
  const handlePlayVoiceOver = useCallback(() => {
    if (isVoiceOverLoaded && voiceOverRef.current && !voiceOverRef.current.playing()) {
      console.log('Playing voice-over');
      voiceOverRef.current.play();
    }
  }, [isVoiceOverLoaded]);
  
  // Handle pausing voice-over
  const handlePauseVoiceOver = useCallback(() => {
    if (voiceOverRef.current && voiceOverRef.current.playing()) {
      console.log('Pausing voice-over');
      voiceOverRef.current.pause();
    }
  }, []);

  // Playback timer logic
  useEffect(() => {
    let playbackInterval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      playbackInterval = setInterval(() => {
        setCurrentTime(prevTime => {
          // Calculate which scene we're in and the time within that scene
          let newTime = prevTime + 0.1; // Update every 100ms
          
          // Check if we've reached the end of all scenes
          if (newTime >= totalDuration) {
            // Reset to the beginning and pause
            setIsPlaying(false);
            setSelectedSceneIndex(0);
            return 0; // Reset time to 0
          }
          
          // Find which scene we're in based on the current time
          let accumulatedTime = 0;
          let currentSceneIdx = 0;
          
          for (let i = 0; i < scenes.length; i++) {
            accumulatedTime += scenes[i].duration;
            if (newTime < accumulatedTime) {
              currentSceneIdx = i;
              break;
            }
          }
          
          // Update selected scene if it changed
          if (selectedSceneIndex !== currentSceneIdx) {
            setSelectedSceneIndex(currentSceneIdx);
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
  }, [isPlaying, scenes, totalDuration, selectedSceneIndex]);

  // Update playhead position based on current time
  useEffect(() => {
    updatePlayheadPosition(currentTime, totalDuration);
    
    // Update selected scene based on current time if not dragging
    if (!isDraggingLeftTrim && !isDraggingRightTrim && !isDraggingPlayhead) {
      const sceneIndex = getSceneIndexAtTime(currentTime, scenes, totalDuration);
      if (sceneIndex !== null && sceneIndex !== selectedSceneIndex) {
        setSelectedSceneIndex(sceneIndex);
      }
    }
  }, [currentTime, totalDuration, isDraggingLeftTrim, isDraggingRightTrim, isDraggingPlayhead, scenes, selectedSceneIndex, updatePlayheadPosition, getSceneIndexAtTime]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up voice-over
      if (voiceOverRef.current) {
        voiceOverRef.current.unload();
      }
    };
  }, []);

  // Context value
  const contextValue: StoryboardContextType = {
    // Scene state
    scenes,
    setScenes,
    selectedSceneIndex,
    setSelectedSceneIndex,
    
    // Playback state
    currentTime,
    setCurrentTime,
    totalDuration,
    setTotalDuration,
    isPlaying,
    setIsPlaying,
    currentTimeDisplay,
    
    // Voice-over state
    voiceOver,
    setVoiceOver,
    isVoiceOverPlaying,
    isVoiceOverLoaded,
    
    // Trim state
    isTrimming,
    trimmingSceneIndex,
    setTrimmingSceneIndex,
    isDraggingLeftTrim,
    setIsDraggingLeftTrim,
    isDraggingRightTrim,
    setIsDraggingRightTrim,
    activeTrimDuration,
    setActiveTrimDuration,
    
    // Playhead state
    isDraggingPlayhead,
    setIsDraggingPlayhead,
    
    // Export state
    isExporting,
    setIsExporting,
    
    // Sidebar state
    isSidebarExpanded,
    setIsSidebarExpanded,
    
    // Refs
    timelineRulerRef,
    playheadRef,
    timelineRowRef,
    
    // Functions
    recalculateTotalDuration,
    getSceneStartTime,
    getSceneIndexAtTime,
    updatePlayheadPosition,
    scrollToSelectedScene,
    handleSceneSelect,
    handleSceneClick,
    handleAddScene,
    handleDeleteScene,
    handlePlayPause,
    handleExportVideo,
    
    // Voice-over methods
    handleAddVoiceOver,
    handlePlayVoiceOver,
    handlePauseVoiceOver,
  };

  return (
    <StoryboardContext.Provider value={contextValue}>
      {children}
    </StoryboardContext.Provider>
  );
};
