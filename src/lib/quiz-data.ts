import type { QuizData } from "@/lib/types";
import { MARKETS, type Market } from "@/lib/market";

export type QuestionField = Exclude<keyof QuizData, "budgetConfirmed">;

export interface QuestionDef {
  id: QuestionField;
  kind: "text" | "single" | "multi";
  title: string;
  helper?: string;
  options?: string[];
}

export const BUSINESS_SUGGESTIONS = [
  "E-commerce",
  "Servicios profesionales",
  "Belleza",
  "Salud",
  "Educación",
  "Inmobiliario",
  "Automotriz",
  "Restaurantes",
  "Moda",
  "Tecnología",
  "Consultoría",
  "Construcción",
  "Turismo",
  "Productos físicos",
  "Servicios B2B",
  "Otro",
];

export const NO_TRAFFIC_OPTION =
  "Todavía no tengo una fuente constante de tráfico";

/**
 * Preguntas del diagnóstico. La única que cambia por mercado es la de
 * capacidad de inversión (COP en Colombia, MXN en México); el resto del
 * cuestionario es idéntico.
 */
export function getQuestions(market: Market): QuestionDef[] {
  return QUESTIONS.map((q) =>
    q.id === "investmentCapacity"
      ? { ...q, options: MARKETS[market].budgetOptions }
      : q
  );
}

export const QUESTIONS: QuestionDef[] = [
  {
    id: "businessType",
    kind: "text",
    title: "¿A qué se dedica tu negocio?",
    helper: "Puedes escribirlo o elegir una categoría.",
  },
  {
    id: "dailyMessages",
    kind: "single",
    title: "¿Cuántos mensajes reciben aproximadamente por WhatsApp al día?",
    options: [
      "Estoy empezando / todavía no tengo tráfico",
      "10 – 100",
      "100 – 500",
      "500 – 1.000",
      "1.000 – 5.000",
      "5.000 – 10.000",
      "Más de 10.000",
    ],
  },
  {
    id: "trafficSources",
    kind: "multi",
    title: "¿De dónde llegan actualmente tus clientes?",
    helper: "Selecciona todas las que apliquen.",
    options: [
      "Meta Ads",
      "Instagram orgánico",
      "Facebook orgánico",
      "Google Ads",
      "Google / SEO",
      "TikTok",
      "Referidos",
      "Recomendaciones",
      "Base de datos",
      "WhatsApp directo",
      "Marketplace",
      "Otro",
      NO_TRAFFIC_OPTION,
    ],
  },
  {
    id: "currentSystem",
    kind: "single",
    title: "¿Cómo atienden actualmente las conversaciones de WhatsApp?",
    options: [
      "Yo respondo personalmente",
      "Un equipo responde manualmente",
      "WhatsApp Business",
      "WhatsApp API",
      "Chatbot",
      "CRM + automatizaciones",
      "Otra solución",
      "Tenemos varias herramientas, pero no están integradas",
    ],
  },
  {
    id: "automationPrev",
    kind: "single",
    title: "¿Has intentado automatizar la atención o las ventas anteriormente?",
    options: [
      "Sí, y funcionó",
      "Sí, pero no funcionó como esperaba",
      "Sí, pero quedó incompleto",
      "No, sería la primera vez",
      "Actualmente tengo automatizaciones",
    ],
  },
  {
    id: "implementationTiming",
    kind: "single",
    title:
      "¿Cuándo quieres solucionar lo que está frenando el crecimiento de tu negocio?",
    options: [
      "Lo antes posible",
      "En las próximas semanas",
      "En los próximos meses",
      "Todavía no lo tengo claro",
    ],
  },
  {
    id: "decisionMaker",
    kind: "single",
    title:
      "Si encontramos una solución viable para tu negocio, ¿quién participa en la decisión?",
    options: [
      "Yo tomo la decisión",
      "Debo decidirlo con mi socio",
      "Debo decidirlo con mi pareja/familia",
      "Otra persona participa en la decisión",
    ],
  },
  {
    id: "investmentCapacity",
    kind: "single",
    title:
      "Para implementar un sistema de automatización comercial adaptado a tu negocio se requiere una inversión inicial. ¿Qué capacidad de inversión tienes actualmente para crecer tu marca online?",
    // Las opciones se sustituyen por mercado en getQuestions().
    options: MARKETS.CO.budgetOptions,
  },
];

export const FILTER_OPTIONS = [
  { value: "SI_CUENTO" as const, label: "Sí, cuento con el presupuesto" },
  { value: "PUEDO_REUNIRLO" as const, label: "Sí, puedo reunirlo" },
  { value: "NO_POR_AHORA" as const, label: "No por ahora" },
];
