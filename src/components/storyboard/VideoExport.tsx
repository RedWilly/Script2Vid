"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useStoryboard } from './StoryboardContext';

export function VideoExport() {
  const { isExporting, scenes, voiceOver, totalDuration, activeCaption } = useStoryboard();

  const handleExport = async () => {
    try {
      const fps = 30;
      const width = 1920;
      const height = 1080;

      // Calculate scene duration
      let sceneDurationSec = 0;
      const sceneOverlays: any[] = [];
      let currentFrame = 0;
      scenes.forEach((scene, index) => {
        const sceneDurationFrames = Math.ceil(scene.duration * fps);
        sceneDurationSec += scene.duration;
        const url = scene.imageUrl || "";
        const filename = url.split('/').pop() || "";
        const overlay = {
          left: 0,
          top: 0,
          width,
          height,
          durationInFrames: sceneDurationFrames,
          from: currentFrame,
          id: index,
          rotation: 0,
          row: 0,
          isDragging: false,
          type: "image",
          src: url,
          videoStartTime: 0,
          styles: {
            opacity: 1,
            zIndex: 100,
            transform: "none",
            objectFit: "cover",
            borderRadius: "0px"
          }
        };
        currentFrame += sceneDurationFrames;
        sceneOverlays.push(overlay);
      });

      // Voice-over overlay
      let voiceOverDurationSec = 0;
      const overlays = [...sceneOverlays];
      if (voiceOver && voiceOver.url) {
        voiceOverDurationSec = voiceOver.duration || 0;
        overlays.push({
          id: overlays.length,
          type: "voiceover",
          from: 0,
          durationInFrames: Math.ceil(voiceOverDurationSec * fps),
          src: voiceOver.url,
          content: voiceOver.name || "",
          styles: {},
          isDragging: false,
          rotation: 0,
          row: 0,
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          videoStartTime: 0
        });
      }

      // Caption overlay
      let lastCaptionEndSec = 0;
      if (activeCaption && activeCaption.segments && activeCaption.segments.length > 0) {
        const captionOverlay = {
          id: overlays.length,
          type: "caption",
          from: 0,
          durationInFrames: 0, // will be set below
          captions: [] as any[],
          styles: {
            fontFamily: "Caveat, cursive",
            fontSize: "2.2rem",
            lineHeight: 1.4,
            textAlign: "center",
            color: "#FFFFFF",
            textShadow: "1px 1px 2px rgba(0,0,0,0.6)",
            fontWeight: "normal",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderRadius: "8px",
            padding: "8px",
            highlightStyle: {
              backgroundColor: "rgba(34, 197, 94, 0.9)",
              color: "#FFFFFF",
              fontWeight: 600,
              textShadow: "1px 1px 2px rgba(0,0,0,0.4)",
              borderRadius: "8px",
              padding: "0 4px",
              transform: "scale(1.08)"
            }
          },
          isDragging: false,
          rotation: 0,
          row: 0,
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          videoStartTime: 0,
          content: ""
        };

        activeCaption.segments.forEach((seg) => {
          captionOverlay.captions.push({
            text: seg.text,
            startMs: seg.startTime * 1000,
            endMs: seg.endTime * 1000,
            timestampMs: null,
            confidence: 0.99,
            words: seg.words?.map(w => ({
              word: w.word,
              startMs: w.startTime * 1000,
              endMs: w.endTime * 1000,
              confidence: 0.99
            })) || []
          });
          if (seg.endTime > lastCaptionEndSec) {
            lastCaptionEndSec = seg.endTime;
          }
        });

        captionOverlay.durationInFrames = Math.ceil(lastCaptionEndSec * fps);
        overlays.push(captionOverlay);
      }

      // Calculate max duration in seconds
      const maxDurationSec = Math.max(sceneDurationSec, voiceOverDurationSec, lastCaptionEndSec);
      const durationInFrames = Math.ceil(maxDurationSec * fps);

      const exportData = {
        overlays,
        durationInFrames,
        fps,
        width,
        height
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "composition.json";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error exporting JSON composition:", error);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || scenes.length === 0}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {/* Simple download icon using SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {isExporting ? "Exporting..." : "Download JSON"}
    </Button>
  );
}

export default VideoExport;
