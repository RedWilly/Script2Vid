import { AbsoluteFill, Img } from 'remotion';

export interface Timeline {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  scenes: {
    id: string;
    imageUrl: string;
    captions: {
      text: string;
      position: { x: number; y: number };
      fontSize: number;
      color: string;
    }[];
  }[];
}

export const TimelineVideo: React.FC<{ timeline: Timeline }> = ({ timeline }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {timeline.scenes.map((scene) => (
        <AbsoluteFill key={scene.id}>
          <Img src={scene.imageUrl} style={{ width: '100%', height: '100%' }} />
          {scene.captions.map((cap, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                top: cap.position.y,
                left: cap.position.x,
                fontSize: cap.fontSize,
                color: cap.color,
                whiteSpace: 'pre-wrap',
              }}
            >
              {cap.text}
            </div>
          ))}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};
