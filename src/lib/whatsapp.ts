import { utmSummary } from './utm'
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

export function buildLeadMessage(quiz: QuizData, booking: BookingData): string {
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
${formatSpanishDate(booking.sessionDate)} — ${booking.sessionTime} (Hora Colombia)

🔥 ESTADO:
LEAD CALIFICADO

📣 ORIGEN:
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
