// One-off generator for PWA placeholder icons.
// Run: node scripts/generate-pwa-icons.mjs
// Pode ser deletado depois — saída fica em /public.
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public");

const BG = "#8B6F50"; // cappuccino-soft
const INK = "#F5F0E6"; // ivory
const ACCENT = "#F0C040"; // gold
const SHADOW = "#4A3826"; // ink-deep

// Glyph: livro aberto centralizado.
// Coordenadas no viewBox 0 0 100 100 — escalável.
function bookGlyph({ stroke = INK, fill = INK, accent = ACCENT } = {}) {
  return `
    <g stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="none">
      <!-- páginas (duas folhas abertas) -->
      <path d="M 50 30 C 42 26, 30 24, 22 26 L 22 70 C 30 68, 42 70, 50 74 Z" fill="${fill}" />
      <path d="M 50 30 C 58 26, 70 24, 78 26 L 78 70 C 70 68, 58 70, 50 74 Z" fill="${fill}" />
      <!-- linhas das páginas (texto estilizado) -->
      <line x1="28" y1="36" x2="44" y2="34" stroke="${accent}" stroke-width="1.4" />
      <line x1="28" y1="42" x2="44" y2="40" stroke="${accent}" stroke-width="1.4" />
      <line x1="28" y1="48" x2="42" y2="46" stroke="${accent}" stroke-width="1.4" />
      <line x1="56" y1="34" x2="72" y2="36" stroke="${accent}" stroke-width="1.4" />
      <line x1="56" y1="40" x2="72" y2="42" stroke="${accent}" stroke-width="1.4" />
      <line x1="58" y1="46" x2="72" y2="48" stroke="${accent}" stroke-width="1.4" />
      <!-- lombada central -->
      <line x1="50" y1="30" x2="50" y2="74" stroke="${stroke}" stroke-width="2" />
    </g>
  `;
}

function buildSVG({ size, maskable = false }) {
  // Maskable: conteúdo dentro do "safe zone" central (40% raio em viewBox 100).
  // Não-maskable: glyph maior, ocupa mais da arte.
  const scale = maskable ? 0.62 : 0.84;
  const offset = (100 - 100 * scale) / 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${BG}"/>
  <!-- vinheta sutil -->
  <radialGradient id="vig" cx="50%" cy="40%" r="70%">
    <stop offset="60%" stop-color="${BG}" stop-opacity="0"/>
    <stop offset="100%" stop-color="${SHADOW}" stop-opacity="0.35"/>
  </radialGradient>
  <rect width="100" height="100" fill="url(#vig)"/>
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    ${bookGlyph()}
  </g>
</svg>`;
}

async function gen({ size, file, maskable = false }) {
  const svg = buildSVG({ size, maskable });
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(join(OUT, file), buf);
  console.log(`  ${file}  (${size}x${size}${maskable ? ", maskable" : ""})`);
}

console.log("Generating PWA icons in /public ...");
await gen({ size: 192, file: "icon-192.png" });
await gen({ size: 512, file: "icon-512.png" });
await gen({ size: 512, file: "icon-512-maskable.png", maskable: true });
await gen({ size: 180, file: "apple-touch-icon.png" });
console.log("Done.");
