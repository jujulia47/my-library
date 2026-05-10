import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qoposqagubgqjtbeuqzz.supabase.co",
      },
      {
        protocol: "https",
        hostname: "ynxkgtfoiupxeygimwsb.supabase.co",
      },
    ],
  },
};

export default nextConfig;
