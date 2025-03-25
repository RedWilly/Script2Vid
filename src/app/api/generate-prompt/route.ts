import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { ChatCompletionMessageParam } from 'openai/resources';

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
    const { sceneText, previousPrompt } = await request.json();

    if (!sceneText) {
      return NextResponse.json(
        { error: 'Scene text is required' },
        { status: 400 }
      );
    }

    // Prepare the messages for the API call
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
    ];

    // If there's a previous prompt, add it as context
    if (previousPrompt) {
      messages.push({
        role: 'assistant',
        content: previousPrompt,
      });
    }

    // Add the current scene text as the user message
    messages.push({
      role: 'user',
      content: sceneText,
    });

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
    const stylePrefix = "Visualize this in a simple doodle 2D style with black ink on a white background in an extremely minimalistic approach.";
    const formattedPrompt = `${stylePrefix} ${generatedPrompt.trim()} --16:9`;

    return NextResponse.json({ prompt: formattedPrompt });
  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
