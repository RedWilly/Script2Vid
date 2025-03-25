/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DEEP_SEEK_API: process.env.DEEP_SEEK_API,
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
};

export default nextConfig;
