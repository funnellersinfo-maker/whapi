"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Loader2,
  Lock,
  MessageCircle,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

/* ------------------------------- tipos ---------------------------------- */

interface LeadMeta {
  id: string;
  status: string;
  name?: string | null;
  whatsapp?: string | null;
  sessionDate?: string | null;
  sessionTime?: string | null;
  origin?: string | null;
  createdAt: string;
}

interface LeadFull extends LeadMeta {
  email?: string | null;
  businessType?: string | null;
  quiz?: Record<string, unknown> | null;
  userAgent?: string | null;
  updatedAt?: string;
}

const ADMIN_KEY_STORAGE = "whapi-admin-key";
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wa";

/* ---------------------------- formatters -------------------------------- */

const bogotaFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function fmtCreated(iso: string): string {
  try {
    return bogotaFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}

function fmtSession(iso: string | null | undefined, time: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00Z`);
  const day = new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(d);
  return time ? `${day} · ${time}` : day;
}

function waHref(whatsapp: string | null | undefined): string | null {
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, "");
  return digits.length >= 10 ? `https://api.whatsapp.com/send/?phone=${digits}` : null;
}

const QUIZ_LABELS: Record<string, string> = {
  businessType: "Negocio",
  dailyMessages: "Mensajes diarios",
  trafficSources: "Fuentes de tráfico",
  currentSystem: "Sistema actual",
  automationPrev: "Automatización previa",
  automationTool: "Herramienta",
  implementationTiming: "Momento para implementar",
  decisionMaker: "Decisión",
  investmentCapacity: "Capacidad de inversión",
  budgetConfirmed: "Presupuesto",
};

function fmtQuizValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

/* --------------------------- subcomponentes ------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const booked = status === "booked";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em] ${
        booked
          ? "border-wa/30 bg-wa/10 text-wa"
          : "border-amber-400/30 bg-amber-400/10 text-amber-300"
      }`}
    >
      {booked ? "Reservado" : "Descalificado"}
    </span>
  );
}

function KpiCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
      <p className="font-display text-xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-dim">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------ gear ------------------------------------- */

export function AdminGear() {
  const [gateOpen, setGateOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [gateError, setGateError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_KEY_STORAGE)) {
      setUnlocked(true);
      setPanelOpen(true);
    }
  }, []);

  const verify = useCallback(async () => {
    const key = password.trim();
    if (!key || verifying) return;
    setVerifying(true);
    setGateError(false);
    try {
      const res = await fetch("/api/admin/leads", { headers: { "x-admin-key": key } });
      if (res.ok) {
        sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
        setUnlocked(true);
        setGateOpen(false);
        setPanelOpen(true);
      } else {
        setGateError(true);
      }
    } catch {
      setGateError(true);
    } finally {
      setVerifying(false);
    }
  }, [password, verifying]);

  const onGearClick = () => {
    if (unlocked) setPanelOpen(true);
    else {
      setPassword("");
      setGateError(false);
      setGateOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onGearClick}
        aria-label="Panel de administración"
        title="Panel de administración"
        className={`mx-auto mt-4 flex h-8 w-8 items-center justify-center rounded-full text-dim/40 transition-colors hover:bg-white/[0.04] hover:text-wa ${FOCUS_RING}`}
      >
        <Lock className="h-3 w-3" aria-hidden="true" />
      </button>

      {/* Gate de acceso */}
      {gateOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Acceso al panel"
        >
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#0a0e10] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-wa/25 bg-wa/10">
                <Lock className="h-4 w-4 text-wa" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setGateOpen(false)}
                aria-label="Cerrar"
                className={`-mt-1 -mr-1 flex h-8 w-8 items-center justify-center rounded-full text-dim transition-colors hover:text-ink ${FOCUS_RING}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <h2 className="mt-4 font-display text-base font-bold uppercase tracking-[0.08em] text-ink">
              Panel de leads
            </h2>
            <p className="mt-1 text-[12px] leading-snug text-dim">
              Ingresa tu clave de administrador para ver los diagnósticos recibidos.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void verify();
              }}
              className="mt-5"
            >
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setGateError(false);
                }}
                placeholder="Clave de administrador"
                autoComplete="current-password"
                aria-label="Clave de administrador"
                autoFocus
                className={`w-full rounded-xl border bg-black/40 px-4 py-3 text-sm text-ink placeholder:text-dim/50 ${
                  gateError ? "border-red-500/60" : "border-white/12"
                } ${FOCUS_RING}`}
              />
              {gateError && (
                <p className="mt-2 text-[11.5px] text-red-400">
                  Clave incorrecta o servidor no disponible. Inténtalo de nuevo.
                </p>
              )}
              <button
                type="submit"
                disabled={!password.trim() || verifying}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-wa px-4 py-3 text-[13px] font-bold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Panel */}
      {unlocked && panelOpen && <AdminPanel onClose={() => setPanelOpen(false)} />}
    </>
  );
}

/* ------------------------------ panel ------------------------------------ */

function AdminPanel({ onClose }: { onClose: () => void }) {
  const [leads, setLeads] = useState<LeadMeta[] | null>(null);
  const [loadError, setLoadError] = useState<"auth" | "offline" | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "booked" | "descalificado">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, LeadFull>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const key = useMemo(() => sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? "", []);

  const fetchLeads = useCallback(async () => {
    if (!key) return;
    setLeads(null);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/leads", { headers: { "x-admin-key": key } });
      if (res.status === 401) {
        setLoadError("auth");
        return;
      }
      if (!res.ok) throw new Error("request_failed");
      const data = (await res.json()) as { ok: boolean; leads?: LeadMeta[] };
      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch {
      setLoadError("offline");
    }
  }, [key]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const loadDetail = useCallback(
    async (id: string) => {
      if (details[id]) return;
      try {
        const res = await fetch(`/api/admin/lead?key=${encodeURIComponent(id)}`, {
          headers: { "x-admin-key": key },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { ok: boolean; lead?: LeadFull };
        if (data.lead) setDetails((d) => ({ ...d, [id]: data.lead as LeadFull }));
      } catch {
        /* detalle no crítico */
      }
    },
    [details, key]
  );

  const del = useCallback(
    async (id: string) => {
      if (deletingId) return;
      if (!window.confirm("¿Eliminar este lead del panel? Esta acción no se puede deshacer.")) return;
      setDeletingId(id);
      try {
        const res = await fetch(`/api/admin/lead?key=${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { "x-admin-key": key },
        });
        if (res.ok) {
          setLeads((l) => (l ? l.filter((x) => x.id !== id) : l));
          setExpandedId((e) => (e === id ? null : e));
        }
      } catch {
        /* noop */
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, key]
  );

  const filtered = useMemo(() => {
    const list = leads ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return [l.name, l.whatsapp, l.origin, l.sessionDate]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [leads, query, statusFilter]);

  const kpis = useMemo(() => {
    const list = leads ?? [];
    const booked = list.filter((l) => l.status === "booked");
    const todayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
    }).format(new Date());
    const today = booked.filter((l) => (l.createdAt || "").slice(0, 10) === todayKey).length;
    const week = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    const upcoming = booked.filter(
      (l) => l.sessionDate && l.sessionDate >= todayKey && l.sessionDate <= week
    ).length;
    return { total: list.length, booked: booked.length, today, upcoming };
  }, [leads]);

  const toggleExpand = (id: string) => {
    setExpandedId((e) => (e === id ? null : id));
    void loadDetail(id);
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#06090a]"
      role="dialog"
      aria-modal="true"
      aria-label="Panel de leads"
    >
      {/* Header */}
      <div className="border-b border-white/8 bg-[#080b0d] px-4 py-3.5 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Panel de leads
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-dim">
              Diagnósticos recibidos · se conservan 90 días
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void fetchLeads()}
              aria-label="Actualizar lista"
              disabled={leads === null}
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-dim transition-colors hover:text-ink disabled:opacity-40 ${FOCUS_RING}`}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={logout}
              aria-label="Cerrar sesión y salir"
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-dim transition-colors hover:text-ink ${FOCUS_RING}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-hidden px-4 py-4 sm:px-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <KpiCard value={kpis.total} label="Total" />
          <KpiCard value={kpis.booked} label="Reservados" />
          <KpiCard value={kpis.today} label="Hoy" />
          <KpiCard value={kpis.upcoming} label="Sesiones 7d" />
        </div>

        {/* Filtros */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim/60"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono, origen…"
              aria-label="Buscar leads"
              className={`w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-[13px] text-ink placeholder:text-dim/50 ${FOCUS_RING}`}
            />
          </div>
          <div className="flex gap-1.5" role="group" aria-label="Filtrar por estado">
            {(
              [
                ["all", "Todos"],
                ["booked", "Reservados"],
                ["descalificado", "Descalif."],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                aria-pressed={statusFilter === value}
                className={`rounded-xl border px-3 py-2 text-[11.5px] font-semibold transition-colors ${
                  statusFilter === value
                    ? "border-wa/40 bg-wa/10 text-wa"
                    : "border-white/10 text-dim hover:text-ink"
                } ${FOCUS_RING}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="mt-4 max-h-[calc(100vh-320px)] overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/12">
          {leads === null && !loadError && (
            <div className="flex flex-col items-center gap-3 py-14 text-dim">
              <Loader2 className="h-6 w-6 animate-spin text-wa" aria-hidden="true" />
              <p className="text-[13px]">Cargando leads…</p>
            </div>
          )}

          {loadError && (
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-center">
              <p className="font-display text-sm font-bold uppercase tracking-[0.1em] text-ink">
                {loadError === "auth" ? "Sesión expirada" : "Servidor no disponible"}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-dim">
                {loadError === "auth"
                  ? "La clave ya no es válida. Cierra y vuelve a ingresar con tu clave."
                  : "No se pudo conectar con el servidor de leads. Revisa tu conexión e intenta de nuevo."}
              </p>
              {loadError === "offline" && (
                <button
                  type="button"
                  onClick={() => void fetchLeads()}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-[12px] font-semibold text-ink hover:bg-white/[0.04]"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Reintentar
                </button>
              )}
            </div>
          )}

          {leads !== null && filtered.length === 0 && (
            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-white/8 bg-white/[0.02] p-7 text-center">
              <MessageCircle className="mx-auto h-7 w-7 text-dim/50" aria-hidden="true" />
              <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.1em] text-ink">
                {leads.length === 0 ? "Aún no hay leads" : "Sin resultados"}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-dim">
                {leads.length === 0
                  ? "Cada diagnóstico completado en el landing aparecerá aquí automáticamente, junto con el mensaje que llega a WhatsApp."
                  : "Prueba con otro término de búsqueda o cambia el filtro de estado."}
              </p>
            </div>
          )}

          <ul className="flex flex-col gap-2">
            {filtered.map((l) => {
              const full = details[l.id];
              const wa = waHref(l.whatsapp ?? full?.whatsapp);
              const expanded = expandedId === l.id;
              return (
                <li
                  key={l.id}
                  className="rounded-2xl border border-white/8 bg-white/[0.025] transition-colors hover:border-white/14"
                >
                  <div className="flex items-center gap-3 p-3.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand(l.id)}
                      aria-expanded={expanded}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[13.5px] font-semibold text-ink">
                            {l.name || "Sin nombre"}
                          </p>
                          <StatusBadge status={l.status} />
                        </div>
                        <p className="mt-1 truncate text-[11.5px] text-dim">
                          {[l.whatsapp, l.origin].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      {l.status === "booked" && (
                        <span className="hidden items-center gap-1 text-[11px] text-dim sm:flex">
                          <CalendarDays className="h-3 w-3" aria-hidden="true" />
                          {fmtSession(l.sessionDate, l.sessionTime)}
                        </span>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-dim transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir chat de WhatsApp de ${l.name || "lead"}`}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-wa/30 bg-wa/10 text-wa transition-colors hover:bg-wa/20 ${FOCUS_RING}`}
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>

                  {expanded && (
                    <div className="border-t border-white/8 px-3.5 py-3">
                      {!full ? (
                        <div className="flex items-center gap-2 py-2 text-[12px] text-dim">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          Cargando detalle…
                        </div>
                      ) : (
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                              Recibido
                            </dt>
                            <dd className="mt-0.5 text-[12.5px] text-ink">
                              {fmtCreated(full.createdAt)}
                            </dd>
                          </div>
                          {full.email && (
                            <div>
                              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                                Email
                              </dt>
                              <dd className="mt-0.5 truncate text-[12.5px] text-ink">
                                {full.email}
                              </dd>
                            </div>
                          )}
                          {Object.entries(QUIZ_LABELS).map(([field, label]) => {
                            const v = full.quiz
                              ? (full.quiz as Record<string, unknown>)[field]
                              : undefined;
                            if (v === undefined) return null;
                            return (
                              <div key={field}>
                                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                                  {label}
                                </dt>
                                <dd className="mt-0.5 text-[12.5px] text-ink">
                                  {fmtQuizValue(v)}
                                </dd>
                              </div>
                            );
                          })}
                          {full.origin && (
                            <div className="sm:col-span-2">
                              <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                                Origen (UTM)
                              </dt>
                              <dd className="mt-0.5 break-words text-[12.5px] text-wa">
                                {full.origin}
                              </dd>
                            </div>
                          )}
                        </dl>
                      )}
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => void del(l.id)}
                          disabled={deletingId === l.id}
                          className={`inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50 ${FOCUS_RING}`}
                        >
                          {deletingId === l.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                          )}
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
