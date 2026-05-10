/**
 * Duração elapsada entre duas datas, em PT-BR. Granularidade aumenta
 * conforme a magnitude:
 *
 *   < 24h        → "hoje"
 *   1–30 dias    → "há 1 dia" / "há 5 dias"
 *   30–365 dias  → "há 1 mês" / "há 11 meses"
 *   365+ dias    → "há 1 ano" / "há 1 ano e 3 meses" / "há 5 anos"
 *
 * Quando `end` é null, calcula até hoje. **Pausas não descontam** —
 * é tempo elapsado total. Decisão de produto: "quanto tempo o livro
 * acompanhou você", não "horas ativas lendo".
 */
export function formatDuration(
  start: Date | string,
  end: Date | string | null,
): string {
  const startMs = typeof start === "string" ? Date.parse(start) : start.getTime();
  const endMs =
    end === null
      ? Date.now()
      : typeof end === "string"
        ? Date.parse(end)
        : end.getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return "—";

  const diffMs = Math.max(0, endMs - startMs);
  const days = Math.floor(diffMs / 86_400_000); // 24h em ms

  if (days < 1) return "hoje";
  if (days === 1) return "há 1 dia";
  if (days < 30) return `há ${days} dias`;

  const months = Math.floor(days / 30);
  if (days < 365) {
    return months === 1 ? "há 1 mês" : `há ${months} meses`;
  }

  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days - years * 365) / 30);
  const yearLabel = years === 1 ? "1 ano" : `${years} anos`;
  if (remainingMonths === 0) return `há ${yearLabel}`;
  const monthLabel = remainingMonths === 1 ? "1 mês" : `${remainingMonths} meses`;
  return `há ${yearLabel} e ${monthLabel}`;
}

/**
 * Versão "Durou X" pra leituras concluídas/abandonadas. Mesma lógica de
 * magnitude do `formatDuration` mas sem o prefixo "há".
 */
export function formatDurationLabel(
  start: Date | string,
  end: Date | string | null,
): string {
  const raw = formatDuration(start, end);
  if (raw === "hoje") return "menos de 1 dia";
  // "há 5 dias" → "5 dias"
  return raw.replace(/^há /, "");
}
