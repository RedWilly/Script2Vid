"use client";

import React, { useState } from 'react';
import VoiceOver from './VoiceOver';
import MyUploads from './MyUploads';

interface AudioPanelProps {
  isVisible: boolean;
}

const AudioPanel: React.FC<AudioPanelProps> = ({ isVisible }) => {
  const [activeTab, setActiveTab] = useState<'voiceover' | 'uploads'>('voiceover');

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-[#0f1218] border-l border-[#1a1f2c] z-30 shadow-xl">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-[#1a1f2c] p-4">
          <h2 className="text-lg font-semibold text-white">Audio</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1f2c]">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'voiceover' 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('voiceover')}
          >
            Voice Over
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'uploads' 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('uploads')}
          >
            My Uploads
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'voiceover' ? (
            <VoiceOver />
          ) : (
            <MyUploads key="my-uploads" />
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPanel;
