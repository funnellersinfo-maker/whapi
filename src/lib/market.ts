/**
 * Configuración por mercado de la landing.
 *
 * Una sola página sirve Colombia (por defecto) y México:
 *  - https://whapi.pages.dev/          → Colombia (COP)
 *  - https://whapi.pages.dev/mx        → México (MXN al cambio)
 *  - https://whapi.pages.dev/?mx=1     → México (alias para ads)
 *  - subdominio mx.* / mexico.*        → México (landing del subdominio)
 *
 * El mercado se detecta en cliente (query param o prefijo de ruta) y adapta
 * precios, teléfono, zona horaria y copy. Los leads de ambos mercados llegan
 * al mismo número de WhatsApp y al mismo panel de administración, marcados
 * con su país de origen.
 */

export type Market = "CO" | "MX";

export interface MarketConfig {
  /** Nombre legible (para el mensaje de WhatsApp y el panel). */
  country: string;
  flag: string;
  /** Código corto para el chip del panel. */
  code: string;
  /** Etiqueta del presupuesto mínimo de implementación. */
  minBudget: string;
  /** Opciones de la pregunta de capacidad de inversión. */
  budgetOptions: string[];
  /** Prefijo telefónico mostrado en el input del formulario. */
  phonePrefix: string;
  phonePlaceholder: string;
  /** Formatea los dígitos mientras el usuario escribe. */
  formatPhone: (digits: string) => string;
  /** Valida el número nacional completo (sin prefijo). */
  isValidPhone: (digits: string) => boolean;
  /** Mensaje de error cuando el teléfono no es válido. */
  phoneError: string;
  /** Zona horaria de las sesiones (también para Google Calendar). */
  timezone: string;
  /** Etiqueta de zona horaria en la UI del calendario. */
  tzLabel: string;
  /** Etiqueta corta para la línea de sesión en el formulario. */
  tzShort: string;
}

const CO: MarketConfig = {
  country: "Colombia",
  flag: "🇨🇴",
  code: "CO",
  minBudget: "$1.300.000 COP",
  budgetOptions: [
    "Menos de $1.300.000 COP",
    "Entre $1.300.000 y $2.000.000 COP",
    "Entre $2.000.000 y $3.000.000 COP",
    "Entre $3.000.000 y $5.000.000 COP",
    "Entre $5.000.000 y $7.000.000 COP",
    "Más de $7.000.000 COP",
  ],
  phonePrefix: "+57",
  phonePlaceholder: "3XX XXX XXXX",
  formatPhone: (d) =>
    [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(" "),
  isValidPhone: (d) => /^3\d{9}$/.test(d),
  phoneError: "Escribe un número de WhatsApp válido (10 dígitos, empieza por 3).",
  timezone: "America/Bogota",
  tzLabel: "Hora Colombia (GMT-5)",
  tzShort: "Hora Colombia",
};

const MX: MarketConfig = {
  country: "México",
  flag: "🇲🇽",
  code: "MX",
  // $390 USD convertidos al cambio: 1 USD ≈ $18.20 MXN (Banxico/Investing,
  // nov 2025) → $390 × 18.20 ≈ $7,100 MXN. Los tramos se redondearon a
  // cifras limpias conservando el equivalente de los montos en USD.
  minBudget: "$7,100 MXN (≈ $390 USD)",
  budgetOptions: [
    "Menos de $7,100 MXN",
    "Entre $7,100 y $10,000 MXN",
    "Entre $10,000 y $14,500 MXN",
    "Entre $14,500 y $23,500 MXN",
    "Entre $23,500 y $33,000 MXN",
    "Más de $33,000 MXN",
  ],
  phonePrefix: "+52",
  phonePlaceholder: "55 1234 5678",
  formatPhone: (d) =>
    [d.slice(0, 2), d.slice(2, 6), d.slice(6, 10)].filter(Boolean).join(" "),
  isValidPhone: (d) => /^[2-9]\d{9}$/.test(d),
  phoneError: "Escribe un número de WhatsApp válido (10 dígitos).",
  timezone: "America/Mexico_City",
  tzLabel: "Hora México (GMT-6)",
  tzShort: "Hora México",
};

export const MARKETS: Record<Market, MarketConfig> = { CO, MX };

/**
 * Detecta el mercado desde la URL. Orden: ruta /mx o subdominio mx./mexico.
 * → query param (?mx=1, ?pais=mx) → Colombia por defecto. La ruta /mx y el
 * subdominio de México sirven SIEMPRE la versión México (ningún parámetro
 * puede cambiarlo). Solo debe llamarse en cliente (devuelve "CO" en el
 * servidor).
 */
export function detectMarket(): Market {
  if (typeof window === "undefined") return "CO";
  try {
    if (/^\/mx\/?$/i.test(window.location.pathname)) return "MX";
    const host = window.location.hostname.toLowerCase();
    if (/^(mx|mexico)\./.test(host)) return "MX";
    const q = new URLSearchParams(window.location.search);
    const explicit = (
      q.get("pais") ??
      q.get("market") ??
      q.get("m") ??
      ""
    ).toLowerCase();
    if (explicit === "mx" || q.get("mx") === "1") return "MX";
    if (explicit === "co" || q.get("co") === "1") return "CO";
  } catch {
    /* URL ilegible: default CO */
  }
  return "CO";
}
