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
