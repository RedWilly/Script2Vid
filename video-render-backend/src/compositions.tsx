import { Composition } from 'remotion';
import { TimelineVideo, Timeline } from './compositions/TimelineVideo';

const defaultTimeline: Timeline = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 300,
  scenes: []
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TimelineVideo"
        component={TimelineVideo}
        durationInFrames={defaultTimeline.durationInFrames}
        fps={defaultTimeline.fps}
        width={defaultTimeline.width}
        height={defaultTimeline.height}
        defaultProps={{ timeline: defaultTimeline }}
      />
    </>
  );
};
