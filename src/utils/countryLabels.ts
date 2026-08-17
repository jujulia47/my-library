import type { Database } from "./typings/supabase";

type Country = Database["public"]["Enums"]["country"];

export const COUNTRY_LABELS: Record<Country, string> = {
  africa_do_sul: "África do Sul",
  alemanha: "Alemanha",
  angola: "Angola",
  argentina: "Argentina",
  australia: "Austrália",
  brasil: "Brasil",
  cabo_verde: "Cabo Verde",
  canada: "Canadá",
  chile: "Chile",
  china: "China",
  colombia: "Colômbia",
  coreia_do_sul: "Coreia do Sul",
  cuba: "Cuba",
  dinamarca: "Dinamarca",
  egito: "Egito",
  espanha: "Espanha",
  estados_unidos: "Estados Unidos",
  franca: "França",
  holanda: "Holanda",
  hungria: "Hungria",
  india: "Índia",
  irlanda: "Irlanda",
  israel: "Israel",
  italia: "Itália",
  japao: "Japão",
  jerusalem: "Jerusalém",
  mexico: "México",
  mocambique: "Moçambique",
  niassalandia: "Niassalândia",
  noruega: "Noruega",
  peru: "Peru",
  polonia: "Polônia",
  portugal: "Portugal",
  quenia: "Quênia",
  reino_unido: "Reino Unido",
  republica_tcheca: "República Tcheca",
  russia: "Rússia",
  suecia: "Suécia",
  suica: "Suíça",
  turquia: "Turquia",
  venezuela: "Venezuela",
};

/**
 * Códigos ISO 3166-1 alpha-2 — usados em <CountryBadge /> em vez de
 * bandeiras emoji, que não renderizam no Windows. Texto + bg gold é
 * mais previsível cross-platform.
 */
export const COUNTRY_CODES: Record<Country, string> = {
  africa_do_sul: "ZA",
  alemanha: "DE",
  angola: "AO",
  argentina: "AR",
  australia: "AU",
  brasil: "BR",
  cabo_verde: "CV",
  canada: "CA",
  chile: "CL",
  china: "CN",
  colombia: "CO",
  coreia_do_sul: "KR",
  cuba: "CU",
  dinamarca: "DK",
  egito: "EG",
  espanha: "ES",
  estados_unidos: "US",
  franca: "FR",
  holanda: "NL",
  hungria: "HU",
  india: "IN",
  irlanda: "IE",
  israel: "IL",
  italia: "IT",
  japao: "JP",
  // Jerusalém é cidade (não país) — sem código ISO/bandeira, só o nome.
  jerusalem: "",
  mexico: "MX",
  mocambique: "MZ",
  // Niassalândia (histórica) → bandeira do Malawi (Estado sucessor).
  niassalandia: "MW",
  noruega: "NO",
  peru: "PE",
  polonia: "PL",
  portugal: "PT",
  quenia: "KE",
  reino_unido: "GB",
  republica_tcheca: "CZ",
  russia: "RU",
  suecia: "SE",
  suica: "CH",
  turquia: "TR",
  venezuela: "VE",
};

/** Lista ordenada por label PT-BR — usada em selects. */
export const COUNTRY_OPTIONS: { value: Country; label: string; code: string }[] =
  (Object.keys(COUNTRY_LABELS) as Country[])
    .map((c) => ({
      value: c,
      label: COUNTRY_LABELS[c],
      code: COUNTRY_CODES[c],
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
