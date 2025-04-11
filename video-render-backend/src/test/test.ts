import { writeFile, mkdir } from 'fs/promises';
import * as path from 'path';

const jsonPath = path.join(import.meta.dir, 'test.json');

const jsonData = await Bun.file(jsonPath).json();

console.log('Sending render request...');

const response = await fetch('http://localhost:3001/render', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(jsonData),
});

if (!response.ok) {
  console.error('Render failed:', response.status, await response.text());
  process.exit(1);
}

console.log('Video sent to be rendered, will be saved soon by the server.');
