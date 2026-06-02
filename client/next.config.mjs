import os from 'node:os';
import path from 'node:path';

/**
 * Next.js 14 config. (Using .mjs rather than the spec's next.config.ts because
 * TypeScript config files are only supported from Next 15; this project pins
 * Next 14 per the Phase 2 stack requirement.)
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer is ESM-only; let Next transpile it for correct interop.
  transpilePackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  /**
   * OneDrive corruption fix.
   *
   * This project lives under a OneDrive-synced path. OneDrive intercepts the
   * webpack cache files (`.next/cache/webpack/*.pack.gz`) mid-write, so Next.js
   * later fails to read them back → `ENOENT … pack.gz` and `Cannot find module
   * './XXXX.js'`, surfacing as a flat navbar + empty page.
   *
   * - dev: memory-only cache, so no `.pack.gz` files are written for OneDrive to grab.
   * - build: keep the faster filesystem cache but write it to the OS temp dir,
   *   outside the synced tree.
   *
   * This removes the webpack *cache* from OneDrive's reach. For a fully
   * bullet-proof setup, move the project out of OneDrive (e.g. C:\Projects) so
   * the compiled `.next` *output* is never synced either.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: 'memory' };
    } else if (config.cache && typeof config.cache === 'object') {
      config.cache.cacheDirectory = path.join(os.tmpdir(), 'nextlearn-webpack-cache');
    }
    return config;
  },
};

export default nextConfig;
