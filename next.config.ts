import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'test-streams.mux.dev' },
      { protocol: 'https', hostname: '*.supabase.co' }, // Wildcard for any supabase project
    ],
  },
};

export default nextConfig;
