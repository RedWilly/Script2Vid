import { AbsoluteFill, Video, Img, Audio, Sequence, useCurrentFrame } from 'remotion';
import { KenBurnsEffect, KenBurnsConfig } from '../components/KenBurnsEffect';

interface Overlay {
  id: number | string;
  type: string;
  from: number;
  durationInFrames: number;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  rotation?: number;
  content?: string;
  src?: string;
  videoStartTime?: number;
  captions?: any[];
  styles?: Record<string, any>;
}

export interface Timeline {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  overlays: Overlay[];
}

export const TimelineVideo: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Render all non-caption overlays first */}
      {timeline.overlays
        ?.filter((overlay) => overlay.type !== 'caption')
        .map((overlay) => {
          const style: React.CSSProperties = {
            position: 'absolute',
            top: overlay.top ?? 0,
            left: overlay.left ?? 0,
            width: overlay.width ?? 'auto',
            height: overlay.height ?? 'auto',
            transform: overlay.rotation ? `rotate(${overlay.rotation}deg)` : undefined,
            ...overlay.styles,
          };

          return (
            <Sequence
              key={overlay.id}
              from={overlay.from ?? 0}
              durationInFrames={overlay.durationInFrames ?? timeline.durationInFrames}
            >
              {overlay.type === 'clip' && overlay.src ? (() => {
                const isVideo = /\.(mp4|mov|webm)$/i.test(overlay.src);
                if (isVideo) {
                  return (
                    <Video
                      src={overlay.src}
                      startFrom={overlay.videoStartTime ?? 0}
                      style={style}
                    />
                  );
                } else {
                  return <Img src={overlay.src} style={style} />;
                }
              })() : null}

              {overlay.type === 'voiceover' && overlay.src && (
                <Audio src={overlay.src} />
              )}

              {overlay.type === 'text' && overlay.content && (
                <div style={style}>{overlay.content}</div>
              )}

              {overlay.type === 'image' && overlay.src && (
                overlay.styles?.kenBurns?.enabled ? (
                  <KenBurnsEffect
                    src={overlay.src}
                    durationInFrames={overlay.durationInFrames}
                    config={overlay.styles.kenBurns as KenBurnsConfig}
                    style={style}
                  />
                ) : (
                  <Img src={overlay.src} style={style} />
                )
              )}
            </Sequence>
          );
        })}

      {/* Render all caption overlays last (on top) */}
      {timeline.overlays
        ?.filter((overlay) => overlay.type === 'caption')
        .map((overlay) => {
          const style: React.CSSProperties = {
            position: 'absolute',
            bottom: 50,
            left: 0,
            width: '100%',
            textAlign: 'center',
            padding: '10px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            color: 'white',
            fontSize: 36,
            fontWeight: 'bold',
            textShadow: '2px 2px 4px black',
            zIndex: 9999,
            ...overlay.styles,
          };

          // Timed caption logic inline (no separate function)
          return (
            <Sequence
              key={overlay.id}
              from={overlay.from ?? 0}
              durationInFrames={overlay.durationInFrames ?? timeline.durationInFrames}
            >
              <TimedCaption captions={overlay.captions ?? []} fps={timeline.fps} style={style} />
            </Sequence>
          );
        })}

    </AbsoluteFill>
  );
};

// Helper component for timed captions
function TimedCaption({
  captions,
  fps,
  style,
}: {
  captions: any[];
  fps: number;
  style: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const currentMs = (frame / fps) * 1000;

  // Find the active caption
  const activeCaption = captions.find(
    (c: any) => c.startMs <= currentMs && currentMs < c.endMs
  );

  if (!activeCaption) return null;

  // Find the current word to highlight
  const currentWord = activeCaption.words.find(
    (w: any) => w.startMs <= currentMs && currentMs < w.endMs
  );

  // Split text into words and apply highlighting
  const words = activeCaption.text.split(' ');
  const highlightedText = words.map((word: string, index: number) => {
    const isHighlighted = currentWord && currentWord.word === word;
    return (
      <span
        key={index}
        style={isHighlighted ? {
          backgroundColor: "rgba(34, 197, 94, 0.9)",
          color: "#FFFFFF",
          fontWeight: 600,
          textShadow: "1px 1px 2px rgba(0,0,0,0.4)",
          borderRadius: "8px",
          padding: "0 4px",
          transform: "scale(1.08)",
          display: "inline-block",
          margin: "0 2px"
        } : undefined}
      >
        {word}{' '}
      </span>
    );
  });

  return (
    <div style={{
      ...style,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      width: '100%',
      padding: '20px'
    }}>
      <div>{highlightedText}</div>
    </div>
  );
}
