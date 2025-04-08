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
    const timeline = await c.req.json<Timeline>();

    const entry = join(import.meta.dir, 'compositions.tsx');

    // Bundle the Remotion project
    const bundled = await bundle({
      entryPoint: entry,
      enableCaching: false,
    });

    // Get compositions
    const comps = await getCompositions(bundled, {
      inputProps: { timeline },
    });

    const comp = comps.find((c) => c.id === 'TimelineVideo');
    if (!comp) {
      return c.text('Composition not found', 404);
    }

    // Temp output path
    const outPath = join(tmpdir(), `render-${Date.now()}.mp4`);

    // Render video
    await renderMedia({
      composition: comp,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outPath,
      inputProps: { timeline },
    });

    const data = await readFile(outPath);
    return new Response(data, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="video.mp4"',
      },
    });
  } catch (err) {
    console.error(err);
    return c.text('Render error: ' + (err as Error).message, 500);
  }
});

// serve(app.fetch);
serve({
    fetch: app.fetch,
    port: 3000,
  });
  
console.log('Remotion render server running on http://localhost:3000');
