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
