import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'test-streams.mux.dev' },
      { protocol: 'https', hostname: '*.supabase.co' }, // Wildcard for any supabase project
      { protocol: 'https', hostname: 'pub-*.r2.dev' }, // Wildcard for Cloudflare R2 public buckets
    ],
  },
  /* 
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
  */
};

export default nextConfig;
