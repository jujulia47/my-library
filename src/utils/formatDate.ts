// Helpers de formatação de data em pt-BR. Distinção principal:
//  - `formatLongDate`: "9 de junho de 2026" — estilo entrada de diário, pra
//    cards e destaques. Mais ar, mais sensação de jornal.
//  - `formatShortDate`: "9/jun/26" — pra rótulos densos (tabelas, tooltips,
//    timeline) onde texto longo quebraria layout.
//  - `formatMonthYearShort`: "jun/26" — selos/carimbos compactos.

const LONG_MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const SHORT_MONTHS_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function parseISODate(iso: string): Date | null {
  // Aceita `YYYY-MM-DD` e timestamp ISO completo. Para `YYYY-MM-DD` puro,
  // adicionamos `T00:00:00Z` pra forçar UTC e evitar shift de fuso.
  const value = iso.includes("T") ? iso : `${iso}T00:00:00Z`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatLongDate(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  return `${d.getUTCDate()} de ${LONG_MONTHS_PT[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

const WEEKDAYS_PT = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

/**
 * "Sábado, 21 de junho de 2026" — cabeçalho estilo entrada de diário.
 * Recebe Date ou ISO; UTC-aware.
 */
export function formatLongDateWithWeekday(input: Date | string): string {
  const d = typeof input === "string" ? parseISODate(input) : input;
  if (!d) return typeof input === "string" ? input : "";
  const weekday = WEEKDAYS_PT[d.getUTCDay()];
  return `${weekday}, ${d.getUTCDate()} de ${LONG_MONTHS_PT[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

export function formatShortDate(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${d.getUTCDate()}/${SHORT_MONTHS_PT[d.getUTCMonth()]}/${yy}`;
}

export function formatMonthYearShort(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${SHORT_MONTHS_PT[d.getUTCMonth()]}/${yy}`;
}

export const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    timeZone: 'UTC'
  };
  
  return new Date(dateString).toLocaleDateString('pt-BR', options);
};

export const calculateDaysSince = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  
  // Ajusta para o fuso horário UTC para evitar problemas com horário de verão
  const utcDate = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  
  const utcToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  
  // Calcula a diferença em dias
  const diffMs = Math.abs(utcToday - utcDate);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Calcula anos, meses e dias
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = diffDays % 30;
  
  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
  
  return parts.join(', ');
};

export const calculateDuration = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Ajusta para o fuso horário UTC para evitar problemas com horário de verão
  const utcStart = Date.UTC(
    start.getUTCFullYear(), 
    start.getUTCMonth(), 
    start.getUTCDate()
  );
  
  const utcEnd = Date.UTC(
    end.getUTCFullYear(), 
    end.getUTCMonth(), 
    end.getUTCDate()
  );
  
  // Calcula a diferença em milissegundos
  const diffMs = Math.abs(utcEnd - utcStart);
  
  // Converte para dias
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Calcula anos, meses e dias
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = diffDays % 30;
  
  const result = [];
  
  if (years > 0) {
    result.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  }
  
  if (months > 0) {
    result.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
  }
  
  if ((days > 0 && years === 0) || result.length === 0) {
    result.push(`${days || 1} ${(days || 1) === 1 ? 'dia' : 'dias'}`);
  }
  
  return `Duração: ${result.join(' e ')}`;
};
