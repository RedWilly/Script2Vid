/**
 * Shared types for the application
 */

export interface Scene {
  id: string;
  content: string;  // The text content of the scene
  prompt?: string;  // The prompt used for image generation
  imageUrl?: string; // URL to the generated image
  seed?: number;    // Seed used for image generation
  duration?: number; // Duration of the scene in seconds for storyboard
}

export interface VoiceType {
  id: string;
  name: string;
  description: string;
  gender: 'Male' | 'Female';
  age: 'Young' | 'Old';
  color?: string; // Optional color for the avatar background
  samplePath?: string; // Path to the sample audio file
}

export const VOICE_OPTIONS: VoiceType[] = [
  {
    id: 'OA001',
    name: 'Alloy',
    description: 'Neutral, professional, and clear',
    gender: 'Male',
    age: 'Young',
    color: '#3B82F6', // blue
    samplePath: '/sample/Alloy.mp3'
  },
  {
    id: 'OA002',
    name: 'Echo',
    description: 'Warm, friendly, and engaging',
    gender: 'Male',
    age: 'Young',
    color: '#8B5CF6', // purple
    samplePath: '/sample/Echo.mp3'
  },
  {
    id: 'OA003',
    name: 'Fable',
    description: 'Energetic, expressive, and engaging',
    gender: 'Male',
    age: 'Young',
    color: '#F59E0B', // amber
    samplePath: '/sample/Fable.mp3'
  },
  {
    id: 'OA004',
    name: 'Onyx',
    description: 'Older, mature, and experienced',
    gender: 'Male',
    age: 'Old',
    color: '#EF4444', // red
    samplePath: '/sample/Onyx.mp3'
  },
  {
    id: 'OA005',
    name: 'Nova',
    description: 'Young, energetic, and engaging',
    gender: 'Female',
    age: 'Young',
    color: '#EC4899', // pink
    samplePath: '/sample/Nova.mp3'
  },
  {
    id: 'OA006',
    name: 'Shimmer',
    description: 'Lively, vibrant, and dynamic',
    gender: 'Female',
    age: 'Young',
    color: '#9333EA', // purple
    samplePath: '/sample/Shimmer.mp3'
  }
];
