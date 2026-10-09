import { utmSummary } from './utm'
import type { MarketConfig } from './market'
import type { BookingData, QuizData } from './types'

function formatSpanishDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  // Noon UTC keeps the same calendar day in America/Bogota (UTC-5) regardless
  // of the server's local timezone.
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota',
  }).format(date)
}

export function buildLeadMessage(
  quiz: QuizData,
  booking: BookingData,
  market?: Pick<MarketConfig, 'country' | 'flag' | 'tzShort'>
): string {
  const automationPrev = quiz.automationTool
    ? `${quiz.automationPrev} (${quiz.automationTool})`
    : quiz.automationPrev

  return `🚀 NUEVO LEAD CALIFICADO

👤 Nombre:
${booking.name}

📱 WhatsApp:
${booking.whatsapp}

🏢 Negocio:
${booking.businessType || quiz.businessType}

💬 MENSAJES DIARIOS:
${quiz.dailyMessages}

📈 FUENTES DE TRÁFICO:
${quiz.trafficSources.join(', ')}

⚙️ SISTEMA ACTUAL:
${quiz.currentSystem}

🤖 AUTOMATIZACIÓN PREVIA:
${automationPrev}

⏱️ MOMENTO PARA IMPLEMENTAR:
${quiz.implementationTiming}

👥 DECISIÓN:
${quiz.decisionMaker}

💰 CAPACIDAD DE INVERSIÓN:
${quiz.investmentCapacity}

💵 PRESUPUESTO MÍNIMO:
CONFIRMADO

📅 SESIÓN:
${formatSpanishDate(booking.sessionDate)} — ${booking.sessionTime} (${market?.tzShort ?? 'Hora Colombia'})

🌎 PAÍS:
${market ? `${market.flag} ${market.country}` : '🇨🇴 Colombia'}

🔥 ESTADO:
LEAD CALIFICADO

📣 ORIGEN:
${utmSummary()}`
}

/**
 * Mensaje para el visitante que no pasa el filtro de presupuesto pero pide
 * una cotización personalizada. Llega al mismo WhatsApp con todo el contexto
 * del diagnóstico (para cotizar a la medida) y el perfil de potencial.
 */
export function buildQuoteMessage(
  quiz: QuizData,
  market?: Pick<MarketConfig, 'country' | 'flag'>,
  fit?: { score: number; tier: 'alto' | 'medio' }
): string {
  const automationPrev = quiz.automationTool
    ? `${quiz.automationPrev} (${quiz.automationTool})`
    : quiz.automationPrev

  return `💎 COTIZACIÓN PERSONALIZADA
(terminó el diagnóstico — presupuesto por debajo del mínimo)

🏢 Negocio:
${quiz.businessType}

💬 Mensajes diarios:
${quiz.dailyMessages}

📈 Fuentes de tráfico:
${quiz.trafficSources.join(', ')}

⚙️ Sistema actual:
${quiz.currentSystem}

🤖 Automatización previa:
${automationPrev}

⏱️ Momento para implementar:
${quiz.implementationTiming}

👥 Decisión:
${quiz.decisionMaker}

💰 Capacidad de inversión:
${quiz.investmentCapacity}

💵 Presupuesto mínimo:
NO POR AHORA — pidió cotización a su medida

🌎 País:
${market ? `${market.flag} ${market.country}` : '🇨🇴 Colombia'}

🏆 Perfil:
${fit ? `${fit.tier === 'alto' ? 'ALTO' : 'MEDIO'} potencial (${fit.score}/12)` : '—'}

📣 Origen:
${utmSummary()}`
}

export function buildWaUrl(
  message: string,
  number: string = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '573112441018'
): string {
  // Direct link to the official click-to-chat endpoint.
  // Linking api.whatsapp.com directly (instead of wa.me) avoids the redirect
  // hop that can re-encode and corrupt emoji bytes on some network paths.
  return `https://api.whatsapp.com/send/?phone=${number}&text=${encodeURIComponent(
    message
  )}&type=phone_number&app_absent=0`
}
