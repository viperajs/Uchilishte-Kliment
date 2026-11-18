import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // „Административни услуги“ became the „Декларации и заявления“ section of „Документи“.
  redirects: async () => [{ source: '/services', destination: '/documents/deklaracii-i-zayavleniya', permanent: true }],
  experimental: {
    // A warm build cache once kept an outdated globals.css; builds are quick without it.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
