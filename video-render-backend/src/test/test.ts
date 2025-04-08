import { writeFile } from 'fs/promises';
import * as path from 'path';

const jsonPath = path.join(import.meta.dir, 'test.json');

const jsonData = await Bun.file(jsonPath).json();

console.log('Sending render request...');

const response = await fetch('http://localhost:3000/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(jsonData),
});

if (!response.ok) {
  console.error('Render failed:', response.status, await response.text());
  process.exit(1);
}

const arrayBuffer = await response.arrayBuffer();
await writeFile('./video-render-backend/src/test/output.mp4', Buffer.from(arrayBuffer));

console.log('Video saved to src/test/output.mp4');
