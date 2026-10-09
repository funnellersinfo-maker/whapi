/**
 * GET    /api/admin/session?key=sess:… — detalle completo de una sesión
 *         (línea de tiempo de eventos, para el explorador del panel).
 * DELETE /api/admin/session?key=sess:… — elimina la sesión (limpieza).
 *
 * Autenticación: cabecera "x-admin-key".
 */

const ADMIN_KEY = "WHAPI2027";
const KEY_RE = /^sess:[0-9]{10,16}:[a-z0-9-]{6,45}$/i;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function authorize(request, env) {
  if (request.headers.get("x-admin-key") !== ADMIN_KEY) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  if (!env.LEADS) return json({ ok: false, error: "no_binding" }, 500);
  return null;
}

function validKey(request) {
  const key = new URL(request.url).searchParams.get("key") || "";
  return KEY_RE.test(key) ? key : null;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const denied = authorize(request, env);
  if (denied) return denied;
  const key = validKey(request);
  if (!key) return json({ ok: false, error: "bad_key" }, 400);

  const session = await env.LEADS.get(key, "json");
  if (!session) return json({ ok: false, error: "not_found" }, 404);
  return json({ ok: true, session });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const denied = authorize(request, env);
  if (denied) return denied;
  const key = validKey(request);
  if (!key) return json({ ok: false, error: "bad_key" }, 400);

  try {
    await env.LEADS.delete(key);
  } catch {
    return json({ ok: false, error: "kv_delete_failed" }, 500);
  }
  return json({ ok: true });
}

export async function onRequest() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}
