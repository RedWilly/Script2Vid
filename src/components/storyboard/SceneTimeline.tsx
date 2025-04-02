"use client";

import React from 'react';
import { useStoryboard } from './StoryboardContext';
import SceneThumbnail from './SceneThumbnail';

export const SceneTimeline = () => {
  const { 
    scenes, 
    timelineRowRef,
    handleAddScene
  } = useStoryboard();

  return (
    <div 
      ref={timelineRowRef} 
      className="flex items-center flex-grow overflow-x-auto whitespace-nowrap h-20 py-2 space-x-2 scrollbar-thin scrollbar-thumb-[#1a1f2c] scrollbar-track-[#1a1f2c]/50"
    >
      {scenes.map((scene, index) => (
        <SceneThumbnail 
          key={scene.id} 
          scene={scene} 
          index={index} 
        />
      ))}
      
      {/* Add Scene Button */}
      <div 
        className="relative inline-block w-28 h-16 rounded border-2 border-dashed border-[#1a1f2c] align-top cursor-pointer transition-all hover:border-purple-500 hover:bg-[#1a1f2c]/50 flex items-center justify-center flex-shrink-0 group" 
        onClick={handleAddScene} 
        title="Add Scene"
      >
        <span className="text-3xl font-light text-gray-500 group-hover:text-purple-400 transition-colors">+</span>
        <span className="absolute bottom-1 text-xs text-gray-400 group-hover:text-gray-300">Add Scene</span>
      </div>
    </div>
  );
};

export default SceneTimeline;
