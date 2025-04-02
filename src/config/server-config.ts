// Server-side configuration
// This file should only be imported in server components or API routes

const serverConfig = {
  s3: {
    apiUrl: process.env.S3_API_URL || '',
    consoleUrl: process.env.S3_CONSOLE_URL || '',
    accessKey: process.env.S3_ACCESS_KEY || '',
    secretKey: process.env.S3_SECRET_KEY || '',
  },
  deepSeek: {
    apiKey: process.env.DEEP_SEEK_API || '',
  },
  assemblyAi: {
    apiKey: process.env.ASSEMBLY_AI || '',
  },
  falAi: {
    keys: process.env.FAL_KEYS || '',
  },
  tts: {
    openaiApiKey: process.env.TTS_OPENAI_API_KEY || '',
  },
};

export default serverConfig;
