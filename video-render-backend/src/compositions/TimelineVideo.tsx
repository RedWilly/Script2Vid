import { AbsoluteFill, Video, Img, Audio, Sequence, useCurrentFrame } from 'remotion';

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
                <Img src={overlay.src} style={style} />
              )}
            </Sequence>
          );
        })}

      {/* Render all caption overlays last (on top) */}
      {timeline.overlays
        ?.filter((overlay) => overlay.type === 'caption')
        .map((overlay) => {
          // Merge minimal required defaults with overlay.styles for captions
          const style: React.CSSProperties = {
            position: 'absolute',
            bottom: 50,
            left: 0,
            width: '100%',
            textAlign: 'center',
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
  const active = captions.filter(
    (c: any) => c.startMs <= currentMs && currentMs < c.endMs
  );
  if (active.length === 0) return null;
  return (
    <div style={style}>
      {active.map((cap: any, idx: number) => {
        // Highlight the currently spoken word if highlightStyle is present and words are present
        const highlightStyle =
          (style && (style as any).highlightStyle) ||
          (cap.highlightStyle ? cap.highlightStyle : undefined);

        if (cap.words && cap.words.length > 0 && highlightStyle) {
          const wordSpans = cap.words.map((word: any, widx: number) => {
            // Determine if this word should be highlighted
            const isActive =
              currentMs >= word.startMs && currentMs < word.endMs;
            return (
              <span
                key={widx}
                style={isActive ? highlightStyle : undefined}
              >
                {word.word + " "}
              </span>
            );
          });
          return <div key={idx}>{wordSpans}</div>;
        }
        // Otherwise, just render the text
        return <div key={idx}>{cap.text}</div>;
      })}
    </div>
  );
}
