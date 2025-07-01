
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure config.resolve and config.resolve.fallback exist if not already
      config.resolve = config.resolve || {};
      config.resolve.fallback = config.resolve.fallback || {};

      // Add fallbacks for Node.js core modules that shouldn't be in the client bundle
      config.resolve.fallback['async_hooks'] = false;
      config.resolve.fallback['fs'] = false;
      config.resolve.fallback['tls'] = false;
      config.resolve.fallback['net'] = false;
      config.resolve.fallback['child_process'] = false;
    }
    return config;
  },
};

export default nextConfig;
