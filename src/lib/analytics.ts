/**
 * Analítica de comportamiento para el panel de métricas del admin.
 *
 * Registra una "sesión" por visitante (sessionStorage) con todos sus
 * eventos: qué secciones vio, en qué hizo clic, hasta dónde llegó en el
 * diagnóstico, scroll máximo y tiempo activo. Los eventos se agrupan en
 * lotes y se envían a /api/track (Cloudflare Pages Function), que los
 * fusiona en un único registro KV por sesión (`sess:{startTs}:{sid}`,
 * TTL 90 días). La geolocalización por IP la aporta Cloudflare en el
 * servidor (request.cf) — la IP cruda nunca se almacena.
 *
 * Todo es fire-and-forget: si algo falla, el usuario no lo nota.
 */

import { captureUtm, readUtm, utmSummary } from "./utm";
import { detectMarket } from "./market";

interface TrackEvent {
  eid: string;
  e: string;
  t: number;
  d?: Record<string, unknown>;
}

const SID_KEY = "whapi:an_sid";
const START_KEY = "whapi:an_start";

/** Solo crawlers obvios (HeadlessChrome se acepta: incluye pruebas del dueño). */
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|lighthouse|pingdom|uptimerobot|checkly|monitoring|curl\/|wget|python-requests|facebookexternalhit|whatsapp/i;

/** Eventos de hito del embudo: se envían al momento. */
const IMPORTANT = new Set([
  "quiz_open",
  "quiz_filter",
  "quiz_booked",
  "quiz_disqual",
  "whatsapp_open",
  "whatsapp_confirm",
  "whatsapp_link",
]);

const SECTION_LABELS: Record<string, string> = {
  diagnostico: "Diagnóstico",
  sistema: "El sistema",
  faq: "Preguntas frecuentes",
};

let initialized = false;
let disabled = false;
let sid = "";
let startTs = 0;
let seq = 0;
let lastFlush = 0;
let lastActivity = 0;
let lastSentDur = -1;
let scrollMax = 0;
let queue: TrackEvent[] = [];
/** Cola de envíos serializados: nunca dos escrituras simultáneas al KV. */
let flushChain: Promise<void> = Promise.resolve();
let pendingSends = 0;

function now(): number {
  return Date.now();
}

function randomId(): string {
  return (
    crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
}

function deviceInfo(): { dev: string; br: string; os: string } {
  const ua = navigator.userAgent;
  const uaData = (
    navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  ).userAgentData;
  const mobile = uaData?.mobile ?? /Android.*Mobile|iPhone|iPod/i.test(ua);
  const tablet = !mobile && /iPad|Android(?!.*Mobile)/i.test(ua);
  const dev = mobile ? "mobile" : tablet ? "tablet" : "desktop";
  let br = "Otro";
  if (/FBAV|FBAN/.test(ua)) br = "Facebook";
  else if (/Instagram/.test(ua)) br = "Instagram";
  else if (/Edg\//.test(ua)) br = "Edge";
  else if (/OPR\//.test(ua)) br = "Opera";
  else if (/SamsungBrowser/.test(ua)) br = "Samsung";
  else if (/Chrome\//.test(ua)) br = "Chrome";
  else if (/Firefox\//.test(ua)) br = "Firefox";
  else if (/Safari\//.test(ua)) br = "Safari";
  let os = "Otro";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";
  return { dev, br, os };
}

function push(e: string, d?: Record<string, unknown>): void {
  queue.push({
    eid: `${now().toString(36)}-${++seq}-${sid.slice(0, 8)}`,
    e,
    t: now(),
    ...(d ? { d } : {}),
  });
  if (queue.length > 120) queue = queue.slice(-120);
}

/** Registra un evento de comportamiento. Los hitos se envían al momento. */
export function track(e: string, d?: Record<string, unknown>): void {
  if (disabled || !initialized) return;
  lastActivity = now();
  push(e, d);
  if (IMPORTANT.has(e)) void flush(true);
}

/** Envío inmediato (lo usan los hitos del quiz). */
export function flushAnalytics(): void {
  if (disabled) return;
  void flush(true);
}

function buildPayload(): Record<string, unknown> {
  const { dev, br, os } = deviceInfo();
  return {
    sid,
    startTs,
    market: detectMarket(),
    path: window.location.pathname.slice(0, 12),
    lang: (navigator.language || "").slice(0, 8),
    screen: `${window.screen.width}x${window.screen.height}`,
    dev,
    br,
    os,
    ref: document.referrer ? document.referrer.slice(0, 120) : null,
    src: utmSummary(),
    utm: readUtm() ?? undefined,
    scroll: scrollMax,
    dur: Math.max(0, Math.round((lastActivity - startTs) / 1000)),
    evts: queue.slice(-60),
  };
}

async function sendPayload(
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    /* fire-and-forget */
  }
}

function queueSend(payload: Record<string, unknown>): void {
  pendingSends++;
  flushChain = flushChain
    .then(() => sendPayload(payload))
    .finally(() => {
      pendingSends--;
    });
}

async function flush(force: boolean): Promise<void> {
  if (disabled || !sid) return;
  // Nunca se envían lotes sin eventos: la duración viaja con los eventos
  // y un lote vacío solo agregaría riesgo de sobrescritura en KV.
  if (queue.length === 0) return;
  const t = now();
  if (!force) {
    if (t - lastFlush < 15_000 && queue.length < 12) return;
    if (t - lastActivity > 120_000) return; // usuario inactivo
  }
  lastFlush = t;
  const payload = buildPayload();
  queue = [];
  lastSentDur = payload.dur as number;
  queueSend(payload);
  await flushChain;
}

function beaconFlush(): void {
  if (disabled || !sid) return;
  // Sin eventos pendientes no hay nada que garantizar: no escribir.
  if (queue.length === 0) return;
  try {
    const payload = buildPayload();
    queue = [];
    lastSentDur = payload.dur as number;
    if (pendingSends > 0) {
      // Hay un lote en vuelo: encadenar (espera su turno) para no
      // competir por el mismo registro KV.
      queueSend(payload);
      return;
    }
    const blob = new Blob([JSON.stringify(payload)], {
      type: "application/json",
    });
    navigator.sendBeacon?.("/api/track", blob);
  } catch {
    /* noop */
  }
}

/** Inicializa la analítica (una sola vez por página). */
export function initAnalytics(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;
  if (BOT_RE.test(navigator.userAgent)) {
    disabled = true;
    return;
  }
  try {
    sid = window.sessionStorage.getItem(SID_KEY) || randomId();
    window.sessionStorage.setItem(SID_KEY, sid);
    const stored = window.sessionStorage.getItem(START_KEY);
    startTs = stored ? Number(stored) || now() : now();
    window.sessionStorage.setItem(START_KEY, String(startTs));
  } catch {
    sid = randomId();
    startTs = now();
  }
  lastActivity = now();
  captureUtm();
  track("view", {
    path: window.location.pathname.slice(0, 12),
    market: detectMarket(),
  });
  window.setTimeout(() => void flush(true), 1500);

  /* scroll máximo alcanzado */
  let raf = 0;
  const onScroll = () => {
    lastActivity = now();
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0) {
        const pct = Math.min(100, Math.round((window.scrollY / h) * 100));
        if (pct > scrollMax) scrollMax = pct;
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  /* secciones vistas (una vez cada una) */
  const seen = new WeakSet<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting || seen.has(en.target)) continue;
        seen.add(en.target);
        const el = en.target as HTMLElement;
        const label =
          SECTION_LABELS[el.id] ||
          el.id ||
          el
            .querySelector("h2,h3")
            ?.textContent?.trim()
            .replace(/\s+/g, " ")
            .slice(0, 26) ||
          "sección";
        track("section", { s: label });
      }
    },
    { rootMargin: "0px 0px -40% 0px", threshold: 0.01 }
  );
  window.setTimeout(() => {
    document
      .querySelectorAll("main > section, header")
      .forEach((el) => io.observe(el));
  }, 400);

  /* clics: CTAs, opciones del quiz, FAQs… (captura global) */
  let lastLabel = "";
  let lastLabelAt = 0;
  const onClick = (ev: MouseEvent) => {
    const target = ev.target as Element | null;
    const el = target?.closest?.("a, button");
    if (!el) return;
    lastActivity = now();
    const href = el.getAttribute("href") || "";
    if (href.includes("api.whatsapp.com")) {
      track("whatsapp_link");
      return;
    }
    const label = (el.textContent || el.getAttribute("aria-label") || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 26);
    if (label.length < 2) return;
    const t = now();
    if (label === lastLabel && t - lastLabelAt < 1200) return; // doble tap
    lastLabel = label;
    lastLabelAt = t;
    track("click", { t: label });
  };
  document.addEventListener("click", onClick, true);

  /* heartbeat: sincroniza periódicamente mientras el usuario esté activo */
  window.setInterval(() => void flush(false), 10_000);

  /* salida de la página (garantiza el último lote) */
  window.addEventListener("pagehide", beaconFlush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") beaconFlush();
  });
}
