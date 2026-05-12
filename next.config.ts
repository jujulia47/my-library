import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

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
    // Capas de livro são pequenas (≤ ~220px nos cards, ≤ ~400px no detail).
    // Limita o pool de tamanhos gerados pelo otimizador a essa faixa pra
    // evitar baixar variantes 1080/1920/3840 desnecessárias.
    deviceSizes: [320, 640, 750, 1080],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 384],
    // AVIF (mais novo, ~30% menor que WebP) com fallback pra WebP. Browser
    // pega o primeiro formato que suporta.
    formats: ["image/avif", "image/webp"],
    // Allowed quality values. Inclui 75 (default do Next quando `quality`
    // não é passado) pra evitar mismatch — sem 75 na lista, Next gerava
    // URLs diferentes entre server e client. 70 é o valor escolhido pra
    // capas pequenas (~10% mais leve, perda imperceptível).
    qualities: [70, 75, 80, 90],
    // Cache mais agressivo no browser: 30 dias. Capas raramente mudam.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default withSerwist(nextConfig);
