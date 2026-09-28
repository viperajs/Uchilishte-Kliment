import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // A warm build cache once kept an outdated globals.css; builds are quick without it.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
