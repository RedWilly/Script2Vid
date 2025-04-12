import React from 'react';
import { useCurrentFrame } from 'remotion';

/**
 * Direction options for Ken Burns effect
 */
export type KenBurnsDirection = 
  | "center"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/**
 * Ken Burns effect configuration
 */
export interface KenBurnsConfig {
  /**
   * Whether the effect is enabled
   */
  enabled: boolean;
  
  /**
   * Type of zoom: "in" zooms from normal to zoomed, "out" zooms from zoomed to normal
   */
  zoomType: "in" | "out" | "none";
  
  /**
   * Direction to focus the zoom effect
   */
  direction: KenBurnsDirection;
  
  /**
   * Speed of the effect: slow, moderate, fast
   */
  speed: "slow" | "moderate" | "fast";
}

/**
 * Calculate the transform style for Ken Burns effect
 * 
 * @param frame Current frame number
 * @param durationInFrames Total duration in frames
 * @param config Ken Burns effect configuration
 * @returns CSS transform style string
 */
export const getKenBurnsTransform = (
  frame: number,
  durationInFrames: number,
  config: KenBurnsConfig
): string => {
  // If no effect is selected, return no transform
  if (config.zoomType === "none" || !config.enabled) {
    return "scale(1)";
  }
  
  // Calculate progress (0 to 1)
  const progress = frame / durationInFrames;
  
  // Define zoom levels based on zoom type
  const startScale = config.zoomType === "in" ? 1 : 1.3;
  const endScale = config.zoomType === "in" ? 1.3 : 1;
  
  // Calculate current scale based on progress
  const scale = startScale + (endScale - startScale) * progress;
  
  // Define speed multipliers
  const speedMultiplier = 
    config.speed === "slow" ? 0.5 :
    config.speed === "fast" ? 1.5 : 
    1; // moderate is default
  
  // Calculate translation values based on direction
  let translateX = 0;
  let translateY = 0;
  
  // Maximum translation as percentage
  const maxTranslation = 5 * speedMultiplier;
  
  // Calculate translation based on direction
  // For "in" we move toward the direction, for "out" we move away from the direction
  if (config.direction.includes("left")) {
    translateX = config.zoomType === "in" ? maxTranslation * progress : maxTranslation * (1 - progress);
  } else if (config.direction.includes("right")) {
    translateX = config.zoomType === "in" ? -maxTranslation * progress : -maxTranslation * (1 - progress);
  }
  
  if (config.direction.includes("top")) {
    translateY = config.zoomType === "in" ? maxTranslation * progress : maxTranslation * (1 - progress);
  } else if (config.direction.includes("bottom")) {
    translateY = config.zoomType === "in" ? -maxTranslation * progress : -maxTranslation * (1 - progress);
  }
  
  // Combine scale and translation into a transform string
  return `scale(${scale}) translate(${translateX}%, ${translateY}%)`;
};

interface KenBurnsEffectProps {
  src: string;
  durationInFrames: number;
  config: KenBurnsConfig;
  style?: React.CSSProperties;
}

/**
 * Ken Burns Effect Component
 * Applies Ken Burns effect to an image
 */
export const KenBurnsEffect: React.FC<KenBurnsEffectProps> = ({
  src,
  durationInFrames,
  config,
  style = {}
}) => {
  const frame = useCurrentFrame();
  
  // Calculate transform based on current frame
  const transform = getKenBurnsTransform(frame, durationInFrames, config);
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        ...style
      }}
    >
      <img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          transform,
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
};
