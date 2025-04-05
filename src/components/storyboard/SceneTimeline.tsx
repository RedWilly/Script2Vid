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
    </div>
  );
};

export default SceneTimeline;
