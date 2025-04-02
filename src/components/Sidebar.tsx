import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onToggle }) => {
  return (
    <div 
      className={`fixed left-0 top-0 h-full bg-[#0a0d14] border-r border-[#1a1f2c]/50 transition-all duration-300 flex flex-col z-40 ${
        isExpanded ? 'w-56' : 'w-14'
      }`}
    >
      {/* Toggle button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute -right-2.5 top-20 h-5 w-5 rounded-full bg-[#1a1f2c] border border-[#2a3042]/60 hover:bg-[#252a3a] text-gray-400 z-50 p-0 flex items-center justify-center"
        onClick={onToggle}
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path 
            fillRule="evenodd" 
            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" 
            clipRule="evenodd" 
          />
        </svg>
      </Button>

      {/* Sidebar content */}
      <div className="flex flex-col items-center pt-16 space-y-8">
        {/* Style section */}
        <div className={`flex flex-col items-center ${isExpanded ? 'w-full px-4' : ''}`}>
          <div className="p-2 rounded-lg hover:bg-[#1a1f2c]/60 cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          {isExpanded && <span className="mt-1 text-xs text-gray-400">Style</span>}
        </div>

        {/* Audio section */}
        <div className={`flex flex-col items-center ${isExpanded ? 'w-full px-4' : ''}`}>
          <div className="p-2 rounded-lg hover:bg-[#1a1f2c]/60 cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414-9.9m-2.828 9.9a9 9 0 010-12.728" />
            </svg>
          </div>
          {isExpanded && <span className="mt-1 text-xs text-gray-400">Audio</span>}
        </div>

        {/* Text section */}
        <div className={`flex flex-col items-center ${isExpanded ? 'w-full px-4' : ''}`}>
          <div className="p-2 rounded-lg hover:bg-[#1a1f2c]/60 cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </div>
          {isExpanded && <span className="mt-1 text-xs text-gray-400">Text</span>}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
