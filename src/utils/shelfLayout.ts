/**
 * Layout determinístico de slots de prateleira (sessão 17.6, evoluído na 17.8).
 *
 * Cada estante tem N slots; cada slot tem um tipo predefinido por hash do
 * `shelf_id`. Distribuição estável entre renders e dispositivos.
 *
 * Distribuição alvo:
 *  - decoration   ~8%  (slot único)
 *  - laying-stack ~12% (cluster de 5 slots contíguos compartilhando stackId)
 *  - tilted       ~20% (slot único, com leanDirection)
 *  - standing     ~60% (slot único, default)
 *
 * Sessão 17.8: o tipo `laying` virou `laying-stack`. Cada cluster ocupa 5
 * posições contíguas — books são empilhados visualmente bottom-up via
 * `<LayingStackCluster>` (gravidade: livros caem pra slots inferiores vagos).
 *
 * Garantia física dos `tilted`: cada um aponta com `leanDirection` pra um
 * slot adjacente sólido (standing / laying-stack / decoration). Sem suporte
 * disponível, o slot vira `standing`.
 */

export type SlotType =
  | "standing"
  | "tilted"
  | "laying-stack"
  | "decoration";

// Variantes de decoração (sessão 17.8: 11 variantes — 6 antigas + 5 novas).
export type DecorationVariant =
  | "vela"
  | "lamparina"
  | "maquina"
  | "bau"
  | "pilha"
  | "livro_deitado"
  | "planta"
  | "globo"
  | "quadro"
  | "tinteiro"
  | "estante";

export type LeanDirection = "left" | "right";

export type ShelfSlot = {
  position: number;
  type: SlotType;
  leanDirection?: LeanDirection;
  decorationVariant?: DecorationVariant;
  /** Sessão 17.8: identificador do cluster de laying-stack (0-N). 5 slots
   *  contíguos com mesmo `stackId` formam um cluster. */
  stackId?: number;
  /** Sessão 17.8: posição no cluster — 0 (base) a 4 (topo). */
  stackIndex?: number;
};

export type ShelfLayout = {
  slots: ShelfSlot[];
  totalSlots: number;
};

const DECORATION_VARIANTS: DecorationVariant[] = [
  "vela",
  "lamparina",
  "maquina",
  "bau",
  "pilha",
  "livro_deitado",
  "planta",
  "globo",
  "quadro",
  "tinteiro",
  "estante",
];

const STACK_HEIGHT = 5;

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pseudoRandom(seed: number, offset: number): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function isSolidType(type: SlotType): boolean {
  return (
    type === "standing" ||
    type === "laying-stack" ||
    type === "decoration"
  );
}

export function getShelfLayout(
  shelfId: string,
  totalSlots: number,
): ShelfLayout {
  const seed = hashString(shelfId);
  const slots: ShelfSlot[] = [];

  // Pass 1: tipo de cada slot. Loop com índice `i` que pode pular 5
  // posições quando consome um cluster laying-stack.
  let i = 0;
  let stackCounter = 0;
  while (i < totalSlots) {
    const r = pseudoRandom(seed, i);

    if (r < 0.08) {
      slots.push({ position: i, type: "decoration" });
      i += 1;
    } else if (r < 0.2 && i + STACK_HEIGHT - 1 < totalSlots) {
      // Cluster de 5 slots contíguos. Só roda se há espaço; senão cai pro
      // próximo branch (tilted ou standing).
      const stackId = stackCounter;
      stackCounter += 1;
      for (let j = 0; j < STACK_HEIGHT; j += 1) {
        slots.push({
          position: i + j,
          type: "laying-stack",
          stackId,
          stackIndex: j,
        });
      }
      i += STACK_HEIGHT;
    } else if (r < 0.4) {
      slots.push({ position: i, type: "tilted" });
      i += 1;
    } else {
      slots.push({ position: i, type: "standing" });
      i += 1;
    }
  }

  // Pass 2: garantir suporte físico dos tilted. Tilted sem suporte
  // adjacente vira standing.
  for (let k = 0; k < slots.length; k += 1) {
    const slot = slots[k];
    if (slot.type !== "tilted") continue;

    const leftIsSolid = k > 0 && isSolidType(slots[k - 1].type);
    const rightIsSolid =
      k < slots.length - 1 && isSolidType(slots[k + 1].type);

    if (leftIsSolid && rightIsSolid) {
      slot.leanDirection =
        pseudoRandom(seed, k + 1000) > 0.5 ? "left" : "right";
    } else if (leftIsSolid) {
      slot.leanDirection = "left";
    } else if (rightIsSolid) {
      slot.leanDirection = "right";
    } else {
      slot.type = "standing";
    }
  }

  // Pass 3: variante de decoração estável por slot.
  for (let k = 0; k < slots.length; k += 1) {
    if (slots[k].type === "decoration") {
      const idx = Math.floor(
        pseudoRandom(seed, k + 2000) * DECORATION_VARIANTS.length,
      );
      slots[k].decorationVariant = DECORATION_VARIANTS[idx];
    }
  }

  return { slots, totalSlots };
}

/**
 * `totalSlots` fixo por estante (decisão da sessão — viewport menor absorve
 * via scroll horizontal interno; não realoca slots no resize). Padrão 30.
 */
export const DEFAULT_SHELF_SLOTS = 30;
