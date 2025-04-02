"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useStoryboard } from './StoryboardContext';
import { SceneWithDuration } from './types';
import TrimHandles from './TrimHandles';

interface SceneThumbnailProps {
  scene: SceneWithDuration;
  index: number;
}

export const SceneThumbnail: React.FC<SceneThumbnailProps> = ({ scene, index }) => {
  const { 
    selectedSceneIndex, 
    handleSceneClick, 
    handleDeleteScene,
    handleSceneSelect
  } = useStoryboard();

  const isSelected = selectedSceneIndex === index;

  return (
    <div
      key={scene.id}
      className={`relative inline-block w-28 h-16 rounded border-2 align-top cursor-pointer transition-all duration-150 group flex-shrink-0 focus:outline-none ${
        isSelected
          ? 'border-purple-500 shadow-lg shadow-purple-500/30'
          : 'border-[#1a1f2c] hover:border-[#1a1f2c]/80'
      }`}
      onClick={(e) => handleSceneClick(e, index)}
      tabIndex={0}
      onFocus={() => handleSceneSelect(index, true)}
      data-scene-index={index}
      role="button"
      aria-pressed={isSelected}
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

      {/* Trim Handles (Conditional) */}
      {isSelected && (
        <TrimHandles index={index} scene={scene} />
      )}

      {/* Delete Button (Show on hover/focus) */}
      <Button 
        variant="destructive" 
        size="icon" 
        className={`absolute top-1 ${isSelected ? 'left-3' : 'left-1'} h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-150 z-20 bg-red-600/80 hover:bg-red-500`}
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
  );
};

export default SceneThumbnail;
