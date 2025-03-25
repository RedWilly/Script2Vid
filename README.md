# Scene Visualizer

A Next.js 14 application for generating image prompts for scene-based storytelling using the DeepSeek Chat model.

## Features

- Split scripts into scenes automatically
- Generate AI-powered image prompts for each scene
- Maintain visual continuity between scenes
- Copy prompts for use in image generation tools
- Server-side rendering (SSR) for improved performance

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/scene-visualize-next.git
cd scene-visualize-next
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your DeepSeek API key:
```
DEEP_SEEK_API=your_deepseek_api_key
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production

Build the application for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## How It Works

1. Enter your script on the home page
2. The system splits your script into scenes of approximately 18 words each
3. AI generates image prompts for each scene, maintaining continuity
4. You can customize the base prompt style and generate individual or all prompts
5. Copy the generated prompts to use with image generation tools

## API Endpoints

- `/api/generate-prompt` - Generate a prompt for a single scene
- `/api/generate-all-prompts` - Generate prompts for all scenes in batch

## Technologies Used

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI SDK (configured for DeepSeek API)
- Server-Side Rendering (SSR)

## Migration from Vite

This project was migrated from a Vite-based React application to Next.js 14 to leverage built-in server-side rendering capabilities. The migration involved:

1. Creating a new Next.js 14 project structure
2. Implementing API routes for prompt generation
3. Migrating React components and utilities
4. Configuring environment variables
5. Updating the styling and UI components

The server-side implementation now uses Next.js API routes instead of a separate Express server, simplifying the architecture while maintaining the same functionality.
