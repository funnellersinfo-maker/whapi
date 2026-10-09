/**
 * GET    /api/admin/lead?key=... — detalle completo de un lead.
 * DELETE /api/admin/lead?key=... — elimina un lead.
 *
 * Autenticación: cabecera "x-admin-key".
 */

const ADMIN_KEY = "WHAPI2027"; // misma clave del panel original

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function keyParam(url) {
  const key = new URL(url).searchParams.get("key") || "";
  // Solo claves de lead válidas: evita leer/borrar otros prefijos del KV.
  if (!/^lead:[0-9]{10,15}:[a-z0-9]{2,12}$/.test(key)) return null;
  return key;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (request.headers.get("x-admin-key") !== ADMIN_KEY) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  const key = keyParam(request.url);
  if (!key) return json({ ok: false, error: "invalid_key" }, 400);

  let raw = null;
  let metadata = null;
  try {
    raw = await env.LEADS.get(key);
    if (raw === null) return json({ ok: false, error: "not_found" }, 404);
    metadata = (await env.LEADS.getWithMetadata(key)).metadata;
  } catch {
    return json({ ok: false, error: "kv_read_failed" }, 500);
  }

  try {
    return json({ ok: true, lead: { id: key, ...(metadata || {}), ...JSON.parse(raw) } });
  } catch {
    return json({ ok: false, error: "corrupt_value" }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (request.headers.get("x-admin-key") !== ADMIN_KEY) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  const key = keyParam(request.url);
  if (!key) return json({ ok: false, error: "invalid_key" }, 400);

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
