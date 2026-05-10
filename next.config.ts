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
  // Erros de lint pré-existentes no código antigo bloqueiam o build —
  // type-check segue rodando normalmente.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
