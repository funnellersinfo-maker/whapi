/**
 * Attribution capture for the ad funnel.
 *
 * Meta attributes conversions to ads on its own (via fbclid + Pixel), so
 * UTMs are NOT required for Ads Manager reporting. They exist here for one
 * practical reason: the funnel ends in WhatsApp, outside Meta's visibility.
 * Capturing them lets the prefilled WhatsApp lead message carry the traffic
 * source, so every lead arrives labeled with the campaign that produced it.
 */

export interface UtmData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  /** Meta auto-appends fbclid to every ad click, even without URL params. */
  fbclid?: boolean;
}

const STORAGE_KEY = "whapi:utm";

/**
 * Reads attribution params from the landing URL and persists them for the
 * funnel session (sessionStorage). A visit carrying params overwrites what
 * was stored before (last ad click wins); a plain reload without params
 * keeps the previously captured attribution.
 */
export function captureUtm(): void {
  if (typeof window === "undefined") return;
  try {
    const q = new URLSearchParams(window.location.search);
    const data: Record<string, string | boolean> = {};
    let hasUtm = false;

    const fields = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ] as const;
    for (const f of fields) {
      const v = q.get(f)?.trim();
      if (v) {
        data[f] = v;
        hasUtm = true;
      }
    }
    if (q.get("fbclid")) data.fbclid = true;

    if (!hasUtm && !data.fbclid) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* Storage unavailable (private mode): attribution simply won't report. */
  }
}

export function readUtm(): UtmData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UtmData) : null;
  } catch {
    return null;
  }
}

/**
 * One-line, human-readable attribution for the WhatsApp lead message.
 * Examples:
 *   "fb · paid · whapi-tof-octubre · ad-3"   (ads with URL params)
 *   "Meta Ads (clic en anuncio)"             (ad click without URL params)
 *   "Directo / orgánico"                      (no ad attribution)
 */
export function utmSummary(): string {
  const u = readUtm();
  if (!u) return "Directo / orgánico";
  const parts = [u.utm_source, u.utm_medium, u.utm_campaign, u.utm_content]
    .filter((v): v is string => Boolean(v));
  if (parts.length > 0) return parts.join(" · ");
  if (u.fbclid) return "Meta Ads (clic en anuncio)";
  return "Directo / orgánico";
}
