'use client';

import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { CaptionSegment, WordSegment } from '../components/storyboard/types';

// Caption styles based on the handwritten style you specified
const captionStyles = {
  container: {
    position: 'absolute',
    bottom: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '1000px',
    textAlign: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '8px',
  },
  text: {
    fontFamily: 'Caveat, cursive',
    fontSize: '2.2rem',
    lineHeight: 1.4,
    textAlign: 'center',
    color: '#FFFFFF',
    textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
    fontWeight: 'normal',
  },
  highlightWord: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    color: '#FFFFFF',
    fontWeight: 600,
    textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
    borderRadius: '8px',
    padding: '0 4px',
    display: 'inline-block',
    transform: 'scale(1.08)',
  },
};

interface CaptionOverlayProps {
  captionSegments: CaptionSegment[];
  sceneStartTime: number;
  sceneDuration: number;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  captionSegments,
  sceneStartTime,
  sceneDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate current time within the video (global time)
  const currentTime = sceneStartTime + frame / fps;
  const sceneEndTime = sceneStartTime + sceneDuration;

  // Filter caption segments that are visible in this scene
  const visibleSegments = useMemo(() => {
    return captionSegments.filter(segment => {
      // Check if segment overlaps with current scene time range
      return (
        (segment.startTime >= sceneStartTime && segment.startTime < sceneEndTime) ||
        (segment.endTime > sceneStartTime && segment.endTime <= sceneEndTime) ||
        (segment.startTime <= sceneStartTime && segment.endTime >= sceneEndTime)
      );
    });
  }, [captionSegments, sceneStartTime, sceneEndTime]);

  // Find the active segment based on current time
  const activeSegment = useMemo(() => {
    return captionSegments.find(
      segment => currentTime >= segment.startTime && currentTime <= segment.endTime
    );
  }, [captionSegments, currentTime]);

  // Find the current word to highlight based on word-level timestamps
  const findCurrentWord = (segment: CaptionSegment, currentTime: number): number => {
    // If we have word-level timestamps, use them for precise highlighting
    if (segment.words && segment.words.length > 0) {
      const currentWord = segment.words.findIndex(
        word => currentTime >= word.startTime && currentTime <= word.endTime
      );

      // If we found a current word, return its index
      if (currentWord !== -1) {
        return currentWord;
      }

      // If we're before the first word, return -1
      if (currentTime < segment.words[0].startTime) {
        return -1;
      }

      // If we're after the last word, return the last word index
      if (currentTime > segment.words[segment.words.length - 1].endTime) {
        return segment.words.length - 1;
      }
    }

    // Fallback to the old method if we don't have word-level timestamps
    const words = segment.text.split(' ');
    const segmentDuration = segment.endTime - segment.startTime;
    const timePerWord = segmentDuration / words.length;
    const segmentElapsedTime = Math.max(0, currentTime - segment.startTime);
    return Math.min(Math.floor(segmentElapsedTime / timePerWord), words.length - 1);
  };

  // Render caption with highlighted word
  const renderCaptionWithHighlight = (segment: CaptionSegment) => {
    // Split the text into words
    const words = segment.text.split(' ');

    // Don't show any text if we're before the segment start time
    if (currentTime < segment.startTime) {
      return null;
    }

    // Find the current word to highlight
    const currentWordIndex = findCurrentWord(segment, currentTime);

    // Render each word with or without highlight
    return words.map((word, index) => {
      const isHighlighted = index === currentWordIndex;

      return (
        <span
          key={index}
          style={isHighlighted ? { ...captionStyles.highlightWord } : {}}
        >
          {word}{' '}
        </span>
      );
    });
  };

  if (!visibleSegments.length) {
    return null;
  }

  return (
    <div style={captionStyles.container as React.CSSProperties}>
      <div style={captionStyles.text as React.CSSProperties}>
        {visibleSegments.map((segment, index) => {
          const isActiveSegment = activeSegment && activeSegment.startTime === segment.startTime;

          // Only show the active segment's text
          if (!isActiveSegment) {
            return null;
          }

          return (
            <div key={index}>
              {renderCaptionWithHighlight(segment)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
