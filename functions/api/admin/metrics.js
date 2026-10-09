/**
 * GET /api/admin/metrics — sesiones para el panel de métricas.
 *
 * Devuelve la metadata compacta de hasta 3.000 sesiones (90 días de
 * retención). La agregación (KPIs, embudo, geografía…) la hace el panel
 * en el cliente. Autenticación: cabecera "x-admin-key".
 */

const ADMIN_KEY = "WHAPI2027";
const MAX_KEYS = 3000;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (request.headers.get("x-admin-key") !== ADMIN_KEY) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!env.LEADS) return json({ ok: false, error: "no_binding" }, 500);

  const sessions = [];
  let cursor;
  try {
    let pages = 0;
    do {
      const page = await env.LEADS.list({ prefix: "sess:", limit: 1000, cursor });
      for (const k of page.keys) {
        sessions.push({ id: k.name, ...(k.metadata || {}) });
      }
      cursor = page.list_complete ? undefined : page.cursor;
      pages++;
    } while (cursor && pages < MAX_KEYS / 1000 && sessions.length < MAX_KEYS);
  } catch {
    return json({ ok: false, error: "kv_list_failed" }, 500);
  }

  // Las claves se ordenan por t0 (inicio de sesión) → recientes primero.
  sessions.reverse();
  return json({ ok: true, now: Date.now(), sessions });
}

export async function onRequest() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}
