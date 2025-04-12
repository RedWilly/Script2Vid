import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { ChatCompletionMessageParam } from 'openai/resources';
import { IMAGE_STYLE_PREFIX } from '@/lib/constants';

// Initialize the OpenAI client with DeepSeek API configuration
const openai = new OpenAI({
  apiKey: process.env.DEEP_SEEK_API,
  baseURL: 'https://api.deepseek.com/v1', // DeepSeek API endpoint
});

// Load system prompt from file
const systemPromptPath = path.join(process.cwd(), 'systemprompt.txt');
const SYSTEM_PROMPT = fs.readFileSync(systemPromptPath, 'utf-8');

export async function POST(request: Request) {
  try {
    const { scenes } = await request.json();

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: 'Valid scenes array is required' },
        { status: 400 }
      );
    }

    const updatedScenes = [...scenes];

    // Process scenes one by one to maintain continuity
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];

      // Skip scenes that are just included for context (when preparing a single scene)
      // We identify these by checking if this is not the last scene and it already has a prompt
      if (i < scenes.length - 1 && scene.prompt) {
        continue;
      }

      // Prepare the messages for the API call
      const messages: ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
      ];

      // If there's a previous prompt, add it as context
      // This could be from a scene we just processed or from a scene included for context
      if (i > 0 && updatedScenes[i - 1].prompt) {
        messages.push({
          role: 'assistant',
          content: updatedScenes[i - 1].prompt,
        });
      }

      // Add the current scene text as the user message
      messages.push({
        role: 'user',
        content: scene.content,
      });

      try {
        // Make the API call to DeepSeek
        const completion = await openai.chat.completions.create({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 100,
        });

        // Extract the generated prompt from the response
        const generatedPrompt = completion.choices[0]?.message?.content || '';

        // Add the style prefix and the --16:9 format specification
        const formattedPrompt = `${IMAGE_STYLE_PREFIX} ${generatedPrompt.trim()} --16:9`;

        updatedScenes[i] = {
          ...scene,
          prompt: formattedPrompt,
        };
      } catch (error) {
        console.error(`Error generating prompt for scene ${i+1}:`, error);
        // If generation fails, leave the prompt as is or set a default
        updatedScenes[i] = {
          ...scene,
          prompt: scene.prompt || `Failed to generate prompt for scene ${i+1}`,
        };
      }
    }

    // Modify the response to avoid leaking full prompts in network requests
    const sanitizedScenes = updatedScenes.map(scene => ({
      ...scene,
      // Include a flag to indicate if the prompt was successfully generated
      promptGenerated: !!scene.prompt,
      // Don't send the full prompt back to the client
      promptFirstWord: scene.prompt ? scene.prompt.split(' ')[0] + '...' : ''
    }));

    return NextResponse.json({ scenes: sanitizedScenes });
  } catch (error) {
    console.error('Error generating all prompts:', error);
    return NextResponse.json(
      { error: 'Failed to generate all prompts' },
      { status: 500 }
    );
  }
}
