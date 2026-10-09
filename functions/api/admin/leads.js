/**
 * GET /api/admin/leads — lista los leads almacenados (Cloudflare Pages Function).
 *
 * Autenticación: cabecera "x-admin-key" con la clave compartida.
 * Devuelve los metadatos (resumen) de cada lead; el detalle completo se
 * consulta con GET /api/admin/lead?key=...
 */

const ADMIN_KEY = "WHAPI2027"; // misma clave del panel original
const MAX_KEYS = 1000;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (request.headers.get("x-admin-key") !== ADMIN_KEY) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!env.LEADS) return json({ ok: false, error: "no_binding" }, 500);

  const leads = [];
  let cursor;
  try {
    do {
      // Solo claves de leads — el namespace también guarda las sesiones
      // de analítica (prefijo "sess:").
      const page = await env.LEADS.list({ prefix: "lead:", limit: 100, cursor });
      for (const k of page.keys) {
        leads.push({
          id: k.name,
          ...(k.metadata || {}),
        });
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor && leads.length < MAX_KEYS);
  } catch {
    return json({ ok: false, error: "kv_list_failed" }, 500);
  }

  // Más recientes primero.
  leads.reverse();
  return json({ ok: true, leads });
}

export async function onRequest() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}
