export const TRACKING = {
  pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '573112441018',
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * Injects the standard Meta Pixel base code via DOM script elements.
 * Idempotent: does nothing on the server, without a pixel id, or if the
 * pixel was already injected (window.fbq already defined).
 */
export function initPixel(): void {
  if (typeof window === 'undefined') return
  if (!TRACKING.pixelId) return
  if (typeof window.fbq !== 'undefined') return

  type FbqStub = ((...args: unknown[]) => void) & {
    callMethod?: (...args: unknown[]) => void
    queue: unknown[][]
    push: unknown
    loaded: boolean
    version: string
  }

  // Standard Meta Pixel stub (equivalent to the official fbevents.js snippet).
  const fbq = function fbqStub(...args: unknown[]): void {
    const self = fbqStub as unknown as FbqStub
    if (self.callMethod) {
      self.callMethod(...args)
    } else {
      self.queue.push(args)
    }
  } as FbqStub

  fbq.queue = []
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'

  const w = window as typeof window & { _fbq?: unknown }
  w.fbq = fbq
  if (!w._fbq) w._fbq = fbq

  const script = document.createElement('script')
  script.id = 'meta-pixel-fbevents'
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  const firstScript = document.getElementsByTagName('script')[0]
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript)
  } else {
    document.head.appendChild(script)
  }

  fbq('init', TRACKING.pixelId)
  fbq('track', 'PageView')
}

export function trackStandard(
  event: 'ViewContent' | 'Lead' | 'CompleteRegistration' | 'Schedule' | 'Contact',
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  const fbq = window.fbq
  if (typeof fbq === 'function') fbq('track', event, params)
}

export function trackCustom(
  event:
    | 'quiz_started'
    | 'quiz_completed'
    | 'qualified_lead'
    | 'disqualified_lead'
    | 'calendar_viewed'
    | 'appointment_booked'
    | 'whatsapp_sent',
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  const fbq = window.fbq
  if (typeof fbq === 'function') fbq('trackCustom', event, params)
}
