import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Minha Biblioteca",
    short_name: "Biblioteca",
    description: "Sua biblioteca pessoal",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F0E6",
    theme_color: "#8B6F50",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
