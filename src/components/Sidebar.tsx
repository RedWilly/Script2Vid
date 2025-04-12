"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import AudioPanel from './AudioPanel';
import TextPanel from './TextPanel';
import KenBurnsPanel from './effects/KenBurnsPanel';
import { DEFAULT_KEN_BURNS_CONFIG, KenBurnsConfig, KenBurnsAutomation } from './effects/ken-burns-effect';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  onApplyKenBurnsToAllScenes?: (config: KenBurnsConfig) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onToggle, onApplyKenBurnsToAllScenes }) => {
  const [isAudioPanelVisible, setIsAudioPanelVisible] = useState(false);
  const [isTextPanelVisible, setIsTextPanelVisible] = useState(false);
  const [isKenBurnsPanelVisible, setIsKenBurnsPanelVisible] = useState(false);
  const [kenBurnsConfig, setKenBurnsConfig] = useState<KenBurnsConfig>(DEFAULT_KEN_BURNS_CONFIG);

  // Listen for the custom event to close sidebars
  useEffect(() => {
    const handleCloseSidebars = () => {
      if (isAudioPanelVisible || isTextPanelVisible || isKenBurnsPanelVisible) {
        setIsAudioPanelVisible(false);
        setIsTextPanelVisible(false);
        setIsKenBurnsPanelVisible(false);
      }
    };

    // Add event listener
    document.addEventListener('closeSidebars', handleCloseSidebars);

    // Clean up
    return () => {
      document.removeEventListener('closeSidebars', handleCloseSidebars);
    };
  }, [isAudioPanelVisible, isTextPanelVisible, isKenBurnsPanelVisible]);

  // Close other panels when opening a new one
  const handleAudioPanelToggle = () => {
    setIsAudioPanelVisible(!isAudioPanelVisible);
    if (!isAudioPanelVisible) {
      setIsTextPanelVisible(false);
      setIsKenBurnsPanelVisible(false);
    }
  };

  const handleTextPanelToggle = () => {
    setIsTextPanelVisible(!isTextPanelVisible);
    if (!isTextPanelVisible) {
      setIsAudioPanelVisible(false);
      setIsKenBurnsPanelVisible(false);
    }
  };

  const handleKenBurnsPanelToggle = () => {
    setIsKenBurnsPanelVisible(!isKenBurnsPanelVisible);
    if (!isKenBurnsPanelVisible) {
      setIsAudioPanelVisible(false);
      setIsTextPanelVisible(false);
    }
  };

  // Handle applying Ken Burns effect to all scenes
  const handleApplyKenBurnsToAllScenes = () => {
    if (onApplyKenBurnsToAllScenes) {
      onApplyKenBurnsToAllScenes(kenBurnsConfig);
    }
  };

  return (
    <>
      <div
        className={`fixed left-0 top-0 h-full bg-[#0a0d14] border-r border-[#1a1f2c]/50 transition-all duration-300 flex flex-col z-40 ${
          isExpanded ? 'w-56' : 'w-14'
        }`}
      >
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-gray-400 hover:text-white hover:bg-[#1a1f2c]/50"
          onClick={onToggle}
        >
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </Button>

        {/* Sidebar content */}
        <div className="flex-grow overflow-y-auto">
          {/* Navigation */}
          <div className="py-4 mt-12">
            <div className="flex flex-col items-center space-y-6">
              {/* Scene Visualizer */}
              <div className="flex flex-col items-center">
                <a href="/scene-visualizer" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1f2c]/50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </a>
                {isExpanded && <span className="mt-1 text-xs text-gray-400">Visualizer</span>}
              </div>

              {/* Storyboard */}
              <div className="flex flex-col items-center">
                <a href="/storyboard" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1a1f2c]/50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </a>
                {isExpanded && <span className="mt-1 text-xs text-gray-400">Storyboard</span>}
              </div>

              {/* Text */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    isTextPanelVisible
                      ? 'text-purple-400 bg-[#1a1f2c]'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1f2c]/50'
                  }`}
                  onClick={handleTextPanelToggle}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                {isExpanded && <span className="mt-1 text-xs text-gray-400">Text</span>}
              </div>

              {/* Audio */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    isAudioPanelVisible
                      ? 'text-purple-400 bg-[#1a1f2c]'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1f2c]/50'
                  }`}
                  onClick={handleAudioPanelToggle}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </div>
                {isExpanded && <span className="mt-1 text-xs text-gray-400">Audio</span>}
              </div>

              {/* Ken Burns Effect */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    isKenBurnsPanelVisible
                      ? 'text-purple-400 bg-[#1a1f2c]'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1f2c]/50'
                  }`}
                  onClick={handleKenBurnsPanelToggle}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                {isExpanded && <span className="mt-1 text-xs text-gray-400">Ken Burns</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Panel */}
      <AudioPanel
        isVisible={isAudioPanelVisible}
        onClose={handleAudioPanelToggle}
      />

      {/* Text Panel */}
      <TextPanel
        isVisible={isTextPanelVisible}
        onClose={handleTextPanelToggle}
      />

      {/* Ken Burns Panel */}
      <KenBurnsPanel
        isVisible={isKenBurnsPanelVisible}
        onClose={handleKenBurnsPanelToggle}
        config={kenBurnsConfig}
        onChange={setKenBurnsConfig}
        onApplyToAllScenes={handleApplyKenBurnsToAllScenes}
      />
    </>
  );
};

export default Sidebar;
