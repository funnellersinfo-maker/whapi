/**
 * POST /api/lead — almacena un lead en KV (Cloudflare Pages Function).
 *
 * Lo llama el quiz del landing (fire-and-forget) en dos momentos:
 *  - status "booked": reserva confirmada, se abre WhatsApp con el mensaje.
 *  - status "descalificado": no pasa el filtro de presupuesto.
 *
 * El valor completo incluye las respuestas del diagnóstico; en metadata se
 * guarda un resumen compacto para listar sin leer cada entrada.
 */

const TTL_SECONDS = 90 * 24 * 60 * 60; // 90 días
const MAX_BODY_BYTES = 16 * 1024;
const ALLOWED_STATUS = new Set(["booked", "descalificado"]);

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function str(v, max) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t.slice(0, max);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.LEADS) return json({ ok: false, error: "no_binding" }, 500);

  const len = Number(request.headers.get("content-length") || "0");
  if (len > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  const status = ALLOWED_STATUS.has(body.status) ? body.status : "booked";
  const now = new Date().toISOString();
  const lead = {
    status,
    name: str(body.name, 120),
    whatsapp: str(body.whatsapp, 40),
    email: str(body.email, 160),
    businessType: str(body.businessType, 120),
    sessionDate: str(body.sessionDate, 10),
    sessionTime: str(body.sessionTime, 20),
    origin: str(body.origin, 200),
    market: str(body.market, 40),
    quiz: typeof body.quiz === "object" && body.quiz !== null ? body.quiz : null,
    userAgent: str(body.userAgent, 300),
    language: str(body.language, 20),
    createdAt: now,
    updatedAt: now,
  };

  // Clave ascendente por tiempo: list() devuelve en orden y la UI invierte.
  const key = `lead:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  const metadata = {
    status,
    name: lead.name,
    whatsapp: lead.whatsapp,
    sessionDate: lead.sessionDate,
    sessionTime: lead.sessionTime,
    origin: lead.origin,
    market: lead.market,
    createdAt: now,
  };

  try {
    await env.LEADS.put(key, JSON.stringify(lead), { metadata, expirationTtl: TTL_SECONDS });
  } catch {
    return json({ ok: false, error: "kv_write_failed" }, 500);
  }
  return json({ ok: true, id: key });
}

export async function onRequest() {
  // Solo POST está soportado.
  return json({ ok: false, error: "method_not_allowed" }, 405);
}
