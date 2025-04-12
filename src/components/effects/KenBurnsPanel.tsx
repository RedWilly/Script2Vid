import React from "react";
import { KenBurnsConfig, KenBurnsDirection, DEFAULT_KEN_BURNS_CONFIG } from "./ken-burns-effect";
import { Button } from "@/components/ui/button";

interface KenBurnsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onApplyToAllScenes: () => void;
  config: KenBurnsConfig;
  onChange: (config: KenBurnsConfig) => void;
}

/**
 * Ken Burns Effect Panel Component
 * 
 * A UI panel that allows users to configure Ken Burns effect settings:
 * - Zoom type (in, out, none)
 * - Direction (center, left, right, top, bottom, etc.)
 * - Speed (slow, moderate, fast)
 */
export const KenBurnsPanel: React.FC<KenBurnsPanelProps> = ({
  isVisible,
  onClose,
  onApplyToAllScenes,
  config = DEFAULT_KEN_BURNS_CONFIG,
  onChange,
}) => {
  // Handle zoom type change
  const handleZoomTypeChange = (zoomType: "in" | "out" | "none") => {
    onChange({ 
      ...config, 
      zoomType,
      enabled: zoomType !== "none"
    });
  };

  // Handle direction change
  const handleDirectionChange = (direction: KenBurnsDirection) => {
    onChange({ ...config, direction });
  };

  // Handle speed change
  const handleSpeedChange = (speed: "slow" | "moderate" | "fast") => {
    onChange({ ...config, speed });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-[#0a0d14] border-l border-[#1a1f2c]/50 shadow-xl z-30 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1a1f2c]/50">
        <h2 className="text-lg font-medium text-white">Ken Burns Effect</h2>
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

      {/* Panel Content */}
      <div className="p-4 space-y-6">
        <div className="space-y-4 rounded-md bg-gray-800/50 p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300">
            Ken Burns Settings
          </h3>

          {/* Zoom Type Selection */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400">
              Zoom
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleZoomTypeChange("in")}
                className={`text-xs py-1 px-2 rounded-md ${
                  config.zoomType === "in"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 border border-gray-600"
                }`}
              >
                In
              </button>
              <button
                onClick={() => handleZoomTypeChange("out")}
                className={`text-xs py-1 px-2 rounded-md ${
                  config.zoomType === "out"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 border border-gray-600"
                }`}
              >
                Out
              </button>
              <button
                onClick={() => handleZoomTypeChange("none")}
                className={`text-xs py-1 px-2 rounded-md ${
                  config.zoomType === "none"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 border border-gray-600"
                }`}
              >
                None
              </button>
            </div>
          </div>

          {/* Direction Grid */}
          {config.zoomType !== "none" && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400">
                Direction
              </label>
              <div className="grid grid-cols-3 gap-1">
                {/* Top Row */}
                <button
                  onClick={() => handleDirectionChange("top-left")}
                  className={`text-xs p-2 rounded-md flex items-center justify-center ${
                    config.direction === "top-left"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 border border-gray-600"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 17L7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 17V7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDirectionChange("top")}
                  className={`text-xs p-2 rounded-md flex items-center justify-center ${
                    config.direction === "top"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 border border-gray-600"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDirectionChange("top-right")}
                  className={`text-xs p-2 rounded-md flex items-center justify-center ${
                    config.direction === "top-right"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 border border-gray-600"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 7H17V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Middle Row */}
                <button
                  onClick={() => handleDirectionChange("left")}
                  className={`text-xs p-2 rounded-md flex items-center justify-center ${
                    config.direction === "left"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 border border-gray-600"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDirectionChange("center")}
                  className={`text-xs p-2 rounded-md flex items-center justify-center ${
                    config.direction === "center"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 border border-gray-600"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDirectionChange("right")}
                  className={`text-xs p-2 rounded-md flex items-center justify-center ${
                    config.direction === "right"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 border border-gray-600"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Bottom Row */}
                <button
                  onClick={() => handleDirectionChange("bottom-left")}
                  className={`text-xs p-2 rounded-md flex items-center justify-center ${
                    config.direction === "bottom-left"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 border border-gray-600"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 17H7V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDirectionChange("bottom")}
                  className={`text-xs p-2 rounded-md flex items-center justify-center ${
                    config.direction === "bottom"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 border border-gray-600"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 12L12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDirectionChange("bottom-right")}
                  className={`text-xs p-2 rounded-md flex items-center justify-center ${
                    config.direction === "bottom-right"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 border border-gray-600"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 7L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 7V17H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Speed Selection */}
          {config.zoomType !== "none" && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400">
                Speed
              </label>
              <select
                value={config.speed}
                onChange={(e) => handleSpeedChange(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md text-xs p-2 hover:border-gray-600 transition-colors text-gray-100"
              >
                <option value="slow">Slow</option>
                <option value="moderate">Moderate</option>
                <option value="fast">Fast</option>
              </select>
            </div>
          )}
        </div>

        {/* Apply to All Scenes Button */}
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onApplyToAllScenes}
        >
          Apply Ken Burns to All Scenes
        </Button>

        <div className="text-xs text-gray-400 mt-2">
          <p>The Ken Burns effect creates a subtle zooming and panning motion on static images, adding visual interest to your scenes.</p>
          <p className="mt-2">Clicking "Apply to All Scenes" will automatically generate a sequence of Ken Burns effects across all your scenes with varied zoom directions for a professional look.</p>
        </div>
      </div>
    </div>
  );
};

export default KenBurnsPanel;
