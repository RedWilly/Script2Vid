/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DEEP_SEEK_API: process.env.DEEP_SEEK_API,
  },
  webpack: (config, { isServer }) => {
    // Handle platform-specific Remotion packages
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        // Darwin (macOS)
        '@remotion/compositor-darwin-x64': false,
        '@remotion/compositor-darwin-arm64': false,
        
        // Linux
        '@remotion/compositor-linux-x64': false,
        '@remotion/compositor-linux-arm64': false,
        '@remotion/compositor-linux-x64-musl': false,
        '@remotion/compositor-linux-arm64-musl': false,
        '@remotion/compositor-linux-x64-gnu': false,
        '@remotion/compositor-linux-arm64-gnu': false,
        
        // Windows
        '@remotion/compositor-win32-x64': false,
        
        // Add any other platform-specific packages that might be missing
        '@remotion/compositor-windows-x64': false,
        
        // Handle esbuild
        'esbuild': false,
      },
    };

    // Add esbuild to external modules
    if (isServer) {
      config.externals = [...config.externals, 'esbuild'];
    }

    return config;
  },
  // Configure server to handle API requests
  serverRuntimeConfig: {
    // Will only be available on the server side
    DEEP_SEEK_API: process.env.DEEP_SEEK_API,
  },
  // Will be available on both server and client side
  publicRuntimeConfig: {
    // Add public runtime config here if needed
  },
  // Increase serverComponentsExternalPackages to include Remotion packages
  experimental: {
    serverComponentsExternalPackages: [
      '@remotion/bundler',
      '@remotion/renderer',
      'esbuild',
    ],
  },
};

export default nextConfig;
