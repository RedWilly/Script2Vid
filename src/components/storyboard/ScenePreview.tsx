"use client";

import { useState, useEffect, useRef } from 'react';
import { useStoryboard } from './StoryboardContext';

export const ScenePreview = () => {
  const { scenes, selectedSceneIndex, currentCaptionText, isPlaying } = useStoryboard();
  const [isLoading, setIsLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const imageCache = useRef<Map<string, boolean>>(new Map());
  
  // Get the current scene for preview
  const currentSceneForPreview = selectedSceneIndex !== null && 
    selectedSceneIndex >= 0 && 
    selectedSceneIndex < scenes.length
      ? scenes[selectedSceneIndex]
      : null;

  // Handle image display with preloaded images
  useEffect(() => {
    if (!currentSceneForPreview || !currentSceneForPreview.imageUrl) {
      setCurrentImage(null);
      return;
    }

    const imageUrl = currentSceneForPreview.imageUrl;
    
    // Check if this image is already in our cache
    if (imageCache.current.has(imageUrl)) {
      // Image is already loaded, just set it without loading state
      setCurrentImage(imageUrl);
      setIsLoading(false);
    } else {
      // Only set loading if we're changing to a different image
      if (currentImage !== imageUrl) {
        setIsLoading(true);
        
        // Check if the image is already in browser cache
        const img = new Image();
        img.src = imageUrl;
        
        if (img.complete) {
          // Image was already cached by the browser
          setCurrentImage(imageUrl);
          setIsLoading(false);
          imageCache.current.set(imageUrl, true);
        } else {
          // Need to wait for the image to load
          img.onload = () => {
            setCurrentImage(imageUrl);
            setIsLoading(false);
            imageCache.current.set(imageUrl, true);
          };
          
          img.onerror = () => {
            console.error('Failed to load image:', imageUrl);
            setIsLoading(false);
            // Still set the image URL so we can show a fallback
            setCurrentImage(imageUrl);
          };
        }
      }
    }
  }, [currentSceneForPreview, currentImage]);

  return (
    <div className="flex-grow bg-black border border-[#1a1f2c]/50 rounded-xl overflow-hidden shadow-xl relative flex items-center justify-center min-h-[300px] md:min-h-[400px]">
      {currentImage ? (
        <img
          key={currentSceneForPreview?.id} // Force re-render on scene change
          src={currentImage}
          alt={`Scene ${selectedSceneIndex !== null ? selectedSceneIndex + 1 : ''}`}
          className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />
      ) : (
        <div className="text-gray-500 text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-lg">{scenes.length > 0 ? "Select a scene" : "No scenes loaded"}</p>
          <p className="text-sm">Use the timeline below</p>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {currentSceneForPreview && selectedSceneIndex !== null && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 text-white pointer-events-none">
          <span className="font-semibold drop-shadow-md">Scene {selectedSceneIndex + 1}</span>
        </div>
      )}
      
      {/* Caption display */}
      {isPlaying && currentCaptionText && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-3 px-4 text-center">
          <p className="text-white text-lg font-medium drop-shadow-md">{currentCaptionText}</p>
        </div>
      )}
    </div>
  );
};

export default ScenePreview;
