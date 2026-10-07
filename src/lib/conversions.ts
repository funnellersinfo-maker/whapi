export interface ConversionResult {
  sent: boolean
  reason?: string
}

/**
 * Sends a server-side Meta Conversions API event.
 * Configured via META_CAPI_PIXEL_ID and META_CAPI_ACCESS_TOKEN env vars.
 * Never throws — always resolves with a ConversionResult.
 */
export async function sendConversionEvent(
  eventName: string,
  eventSourceUrl?: string,
  customData?: Record<string, unknown>
): Promise<ConversionResult> {
  const pixelId = process.env.META_CAPI_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN

  if (!pixelId || !accessToken) {
    console.log(`[meta-capi] Not configured — skipping conversion event "${eventName}".`)
    return { sent: false, reason: 'not_configured' }
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [
          {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: crypto.randomUUID(),
            action_source: 'website',
            event_source_url: eventSourceUrl,
            custom_data: customData,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.log(`[meta-capi] Event "${eventName}" rejected with status ${response.status}.`)
      return { sent: false, reason: 'request_failed' }
    }

    return { sent: true }
  } catch (error) {
    console.log(`[meta-capi] Event "${eventName}" request failed:`, error)
    return { sent: false, reason: 'request_failed' }
  }
}
