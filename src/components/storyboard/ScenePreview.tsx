"use client";

import { useStoryboard } from './StoryboardContext';

export const ScenePreview = () => {
  const { scenes, selectedSceneIndex } = useStoryboard();
  
  // Get the current scene for preview
  const currentSceneForPreview = selectedSceneIndex !== null && 
    selectedSceneIndex >= 0 && 
    selectedSceneIndex < scenes.length
      ? scenes[selectedSceneIndex]
      : null;

  return (
    <div className="flex-grow bg-black border border-[#1a1f2c]/50 rounded-xl overflow-hidden shadow-xl relative flex items-center justify-center min-h-[300px] md:min-h-[400px]">
      {currentSceneForPreview ? (
        <img
          key={currentSceneForPreview.id} // Force re-render on scene change
          src={currentSceneForPreview.imageUrl}
          alt={`Scene ${selectedSceneIndex !== null ? selectedSceneIndex + 1 : ''}`}
          className="max-w-full max-h-full object-contain"
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
      {currentSceneForPreview && selectedSceneIndex !== null && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 text-white pointer-events-none">
          <span className="font-semibold drop-shadow-md">Scene {selectedSceneIndex + 1}</span>
        </div>
      )}
    </div>
  );
};

export default ScenePreview;
