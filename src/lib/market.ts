/**
 * Configuración por mercado de la landing.
 *
 * Una sola página sirve Colombia (por defecto) y México:
 *  - https://whapi.pages.dev/          → Colombia (COP)
 *  - https://whapi.pages.dev/mx        → México (USD)
 *  - https://whapi.pages.dev/?mx=1     → México (alias para ads)
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
  minBudget: "$390 USD",
  budgetOptions: [
    "Menos de $390 USD",
    "Entre $390 y $550 USD",
    "Entre $550 y $800 USD",
    "Entre $800 y $1.300 USD",
    "Entre $1.300 y $1.800 USD",
    "Más de $1.800 USD",
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
 * Detecta el mercado desde la URL. Orden: query param explícito (?mx=1,
 * ?pais=mx, ?market=mx) → prefijo de ruta /mx → Colombia por defecto.
 * Solo debe llamarse en cliente (devuelve "CO" en el servidor).
 */
export function detectMarket(): Market {
  if (typeof window === "undefined") return "CO";
  try {
    const q = new URLSearchParams(window.location.search);
    const explicit = (
      q.get("pais") ??
      q.get("market") ??
      q.get("m") ??
      ""
    ).toLowerCase();
    if (explicit === "mx" || q.get("mx") === "1") return "MX";
    if (explicit === "co" || q.get("co") === "1") return "CO";
    if (/^\/mx\/?$/i.test(window.location.pathname)) return "MX";
  } catch {
    /* URL ilegible: default CO */
  }
  return "CO";
}
