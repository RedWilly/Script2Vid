import { Hono } from 'hono';
import { serve } from 'bun';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { tmpdir } from 'os';
import { join } from 'path';
import { readFile } from 'fs/promises';
import type { Timeline } from './compositions/TimelineVideo';

const app = new Hono();

app.post('/render', async (c) => {
  try {
    console.log('Received /render request');
    const timeline = await c.req.json<Timeline>();
    console.log('Timeline JSON parsed');

    const entry = join(import.meta.dir, 'index.tsx');
    console.log('Bundling project...');
    const bundled = await bundle({
      entryPoint: entry,
      enableCaching: false,
    });
    console.log('Bundling complete');

    console.log('Fetching compositions...');
    const comps = await getCompositions(bundled, {
      inputProps: { timeline },
    });
    console.log('Compositions fetched');

    const comp = comps.find((c) => c.id === 'TimelineVideo');
    if (!comp) {
      console.log('Composition not found');
      return c.text('Composition not found', 404);
    }

    // Override composition properties with timeline values
    comp.durationInFrames = timeline.durationInFrames;
    comp.fps = timeline.fps;
    comp.width = timeline.width;
    comp.height = timeline.height;

    // Save to project test directory
    const outDir = join(import.meta.dir, 'test');
    await Bun.write(outDir + '/.keep', ''); // ensure directory exists (Bun.write will create it)
    const outPath = join(outDir, `output-${Date.now()}.mp4`);
    console.log('Rendering video to', outPath);

    await renderMedia({
      composition: comp,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outPath,
      inputProps: { timeline },
    });

    console.log('Render complete, video saved to', outPath);
    return new Response(
      `Render complete. Video saved to: ${outPath}`,
      { status: 200 }
    );
  } catch (err) {
    console.error('Render error:', err);
    return c.text('Render error: ' + (err as Error).message, 500);
  }
});

// serve(app.fetch);
serve({
    fetch: app.fetch,
    port: 3001,
  });
  
console.log('Remotion render server running on http://localhost:3001');
