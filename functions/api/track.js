/**
 * POST /api/track — analítica de comportamiento (Cloudflare Pages Function).
 *
 * Cada visitante genera una sesión con eventos (secciones vistas, clics,
 * avance del quiz, reserva…). El cliente envía lotes; aquí se fusionan en
 * un único registro KV por sesión (clave `sess:{startTs}:{sid}`, TTL 90 días)
 * con metadata compacta para que el panel de métricas agregue sin leer cada
 * registro completo.
 *
 * Geolocalización por IP: la aporta Cloudflare (request.cf) — país, ciudad,
 * región y proveedor. La IP cruda NO se almacena.
 */

const TTL = 90 * 24 * 60 * 60; // 90 días
const MAX_EVENTS = 250;
const MAX_BATCH = 60;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function str(v, max) {
  return typeof v === "string" && v.length > 0 ? v.slice(0, max) : undefined;
}

function num(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function sanitizeUtm(u) {
  if (!u || typeof u !== "object" || Array.isArray(u)) return undefined;
  const out = {};
  let count = 0;
  for (const [k, v] of Object.entries(u)) {
    if (count >= 6) break;
    if (typeof v === "string" && v) out[k.slice(0, 16)] = v.slice(0, 60);
    else if (v === true) out[k.slice(0, 16)] = true;
    else continue;
    count++;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.LEADS) return json({ ok: false, error: "no_binding" }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "bad_body" }, 400);
  }

  const sid = typeof body.sid === "string" ? body.sid : "";
  if (!/^[a-z0-9-]{6,45}$/i.test(sid)) {
    return json({ ok: false, error: "bad_sid" }, 400);
  }
  const startTs = Math.trunc(Number(body.startTs));
  if (
    !Number.isFinite(startTs) ||
    startTs < 1_600_000_000_000 ||
    startTs > Date.now() + 3_600_000
  ) {
    return json({ ok: false, error: "bad_ts" }, 400);
  }
  const key = `sess:${String(startTs).padStart(14, "0")}:${sid}`;

  const incoming = Array.isArray(body.evts) ? body.evts.slice(0, MAX_BATCH) : [];
  const existing = await env.LEADS.get(key, "json");
  if (existing && typeof existing !== "object") return json({ ok: true });

  // Lote sin eventos sobre una sesión existente: no escribir. Evita
  // sobrescribir en carrera un lote con eventos que aún está en vuelo.
  if (existing && incoming.length === 0) return json({ ok: true });

  /* fusionar eventos (dedupe por eid: beacon + fetch pueden duplicar) */
  const evts = new Map();
  if (existing && Array.isArray(existing.events)) {
    for (const e of existing.events) {
      if (e && typeof e.e === "string" && typeof e.eid === "string") {
        evts.set(e.eid, e);
      }
    }
  }
  for (const e of incoming) {
    if (!e || typeof e !== "object") continue;
    if (typeof e.e !== "string" || !/^[a-z_]{2,24}$/.test(e.e)) continue;
    const eid = typeof e.eid === "string" ? e.eid.slice(0, 48) : "";
    if (!eid) continue;
    let d;
    if (e.d && typeof e.d === "object" && !Array.isArray(e.d)) {
      const clean = {};
      let count = 0;
      for (const [k, v] of Object.entries(e.d)) {
        if (count >= 6) break;
        if (typeof v === "string" && v) clean[k.slice(0, 8)] = v.slice(0, 64);
        else if (typeof v === "number" && Number.isFinite(v)) {
          clean[k.slice(0, 8)] = v;
        } else continue;
        count++;
      }
      if (Object.keys(clean).length) d = clean;
    }
    evts.set(eid, {
      eid,
      e: e.e,
      t: num(e.t, 1_600_000_000_000, Date.now() + 3_600_000, Date.now()),
      ...(d ? { d } : {}),
    });
  }
  let list = [...evts.values()].sort((a, b) => a.t - b.t);
  if (list.length > MAX_EVENTS) list = list.slice(list.length - MAX_EVENTS);

  /* geolocalización por IP (Cloudflare) */
  const cf = request.cf || {};
  const h = request.headers;
  const co = str(cf.country || h.get("cf-ipcountry"), 2)?.toUpperCase();
  const city = str(cf.city, 24);
  const reg = str(cf.region || cf.regionCode, 24);
  const asn = str(cf.asOrganization, 28);

  const scroll = Math.max(
    existing?.scroll || 0,
    num(body.scroll, 0, 100, 0)
  );
  const dur = Math.max(existing?.dur || 0, num(body.dur, 0, 86_400, 0));
  const last = Math.max(
    existing?.last || 0,
    ...list.map((e) => e.t),
    Date.now()
  );

  const pick = (a, b) => a ?? b;
  const record = {
    sid,
    t0: pick(existing?.t0, startTs),
    mkt: str(body.market, 2)?.toUpperCase() === "MX" ? "MX" : pick(existing?.mkt, "CO"),
    path: pick(existing?.path, str(body.path, 10)),
    co: pick(existing?.co, co),
    city: pick(existing?.city, city),
    reg: pick(existing?.reg, reg),
    asn: pick(existing?.asn, asn),
    src: pick(existing?.src, str(body.src, 48)),
    utm: pick(existing?.utm, sanitizeUtm(body.utm)),
    ref: pick(existing?.ref, str(body.ref, 110)),
    dev: pick(existing?.dev, str(body.dev, 8)),
    br: pick(existing?.br, str(body.br, 14)),
    os: pick(existing?.os, str(body.os, 10)),
    lang: pick(existing?.lang, str(body.lang, 8)),
    screen: pick(existing?.screen, str(body.screen, 12)),
    scroll,
    dur,
    last,
    events: list,
  };

  /* derivados para la metadata (el panel agrega sin leer el registro) */
  const has = (name) => list.some((e) => e.e === name);
  let qs = 0;
  let fa;
  for (const e of list) {
    if (e.e === "quiz_step" && e.d && Number.isFinite(e.d.n)) {
      qs = Math.max(qs, e.d.n);
    }
    if (e.e === "quiz_filter" && e.d && typeof e.d.a === "string") fa = e.d.a;
  }
  const meta = {
    sid,
    t0: record.t0,
    last,
    mkt: record.mkt,
    co: record.co,
    city: record.city,
    reg: record.reg,
    asn: record.asn,
    src: record.src,
    ref: record.ref,
    dev: record.dev,
    br: record.br,
    os: record.os,
    qo: has("quiz_open") ? 1 : 0,
    qs,
    qc: has("quiz_filter") ? 1 : 0,
    fa: str(fa, 16),
    bk: has("quiz_booked") ? 1 : 0,
    dq: has("quiz_disqual") ? 1 : 0,
    cal: has("calendar_view") ? 1 : 0,
    wa: has("whatsapp_open") || has("whatsapp_confirm") || has("whatsapp_link")
      ? 1
      : 0,
    sm: scroll,
    dur,
    n: list.length,
  };

  try {
    await env.LEADS.put(key, JSON.stringify(record), {
      expirationTtl: TTL,
      metadata: meta,
    });
  } catch {
    return json({ ok: false, error: "kv_put_failed" }, 500);
  }
  return json({ ok: true });
}

export async function onRequest() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}
