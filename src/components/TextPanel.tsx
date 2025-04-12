"use client";

import React, { useState } from 'react';
import Caption from './Caption';
import { Button } from '@/components/ui/button';

interface TextPanelProps {
  isVisible: boolean;
  onClose?: () => void;
}

const TextPanel: React.FC<TextPanelProps> = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'caption'>('text');

  if (!isVisible) return null;

  return (
    <div
      className="fixed right-0 top-0 h-full w-80 bg-[#0f1218] border-l border-[#1a1f2c] z-30 shadow-xl"
      onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching the main content
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-[#1a1f2c] p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Text</h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-[#1a1f2c]/50"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
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
