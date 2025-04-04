"use client";

import React, { useState } from 'react';
import Caption from './Caption';

interface TextPanelProps {
  isVisible: boolean;
}

const TextPanel: React.FC<TextPanelProps> = ({ isVisible }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'caption'>('text');

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-[#0f1218] border-l border-[#1a1f2c] z-30 shadow-xl">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-[#1a1f2c] p-4">
          <h2 className="text-lg font-semibold text-white">Text</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1f2c]">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'text' 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('text')}
          >
            Text
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'caption' 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('caption')}
          >
            Caption
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'text' ? (
            <div className="text-gray-400 text-center py-8">
              <p>Nothing here yet</p>
            </div>
          ) : (
            <Caption />
          )}
        </div>
      </div>
    </div>
  );
};

export default TextPanel;
