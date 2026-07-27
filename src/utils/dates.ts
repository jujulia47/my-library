/**
 * Fuso horário do app. O servidor (Vercel) roda em UTC — sem fixar o fuso,
 * "hoje" vira o dia seguinte a partir das 21h no Brasil.
 */
export const APP_TIME_ZONE = "America/Sao_Paulo";

/**
 * Data de hoje em `YYYY-MM-DD` no fuso do Brasil (funciona igual no servidor
 * e no navegador). `en-CA` formata exatamente como ISO.
 */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
  }).format(new Date());
}

/**
 * Mês de uma data ISO como 1º dia do mês (`YYYY-MM-01`) — a chave usada em
 * `home_next_read.plan_month`.
 */
export function monthStartISO(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** Mês corrente (fuso do Brasil) como `YYYY-MM-01`. */
export function currentMonthISO(): string {
  return monthStartISO(todayISO());
}

/**
 * Valida e normaliza um `YYYY-MM` (ou `YYYY-MM-DD`) para `YYYY-MM-01`.
 * Retorna null se não for um mês válido — defensivo contra query param.
 */
export function normalizeMonthParam(value: string | null): string | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})/);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${m[1]}-${m[2]}-01`;
}

/** Avança/retrocede N meses num `YYYY-MM-01`, mantendo o formato. */
export function addMonthsISO(monthISO: string, n: number): string {
  const y = Number(monthISO.slice(0, 4));
  const m = Number(monthISO.slice(5, 7));
  const total = (y * 12 + (m - 1)) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-01`;
}
