"use client";

/**
 * Métricas del sitio — pestaña del panel de administración.
 *
 * Agrega en el cliente la metadata de las sesiones (KV `sess:`):
 *  - KPIs de conversión (visitas → quiz → completado → reserva)
 *  - Tráfico por día / hora (recharts)
 *  - Embudo del diagnóstico con abandono por pregunta
 *  - Geolocalización por IP (país / ciudad, vía Cloudflare)
 *  - Fuentes de tráfico (UTM) y referentes
 *  - Dispositivos y navegadores
 *  - Explorador de sesiones con línea de tiempo completa (qué hizo cada
 *    visitante) y borrado de sesiones de prueba.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  BarChart3,
  Loader2,
  MapPin,
  Monitor,
  MousePointerClick,
  RefreshCw,
  Smartphone,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* -------------------------------- tipos --------------------------------- */

interface SessionMeta {
  id: string;
  sid?: string;
  t0?: number;
  last?: number;
  mkt?: string;
  co?: string;
  city?: string;
  reg?: string;
  asn?: string;
  src?: string;
  ref?: string;
  dev?: string;
  br?: string;
  os?: string;
  qo?: number;
  qs?: number;
  qc?: number;
  fa?: string;
  bk?: number;
  dq?: number;
  cal?: number;
  wa?: number;
  sm?: number;
  dur?: number;
  n?: number;
}

interface SessionEvent {
  eid: string;
  e: string;
  t: number;
  d?: Record<string, unknown>;
}

interface SessionFull extends SessionMeta {
  path?: string;
  lang?: string;
  screen?: string;
  utm?: Record<string, string | boolean>;
  events?: SessionEvent[];
}

type Range = "today" | "7d" | "30d" | "all";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wa";
const TZ = "America/Bogota";

/* ----------------------------- formatters -------------------------------- */

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // YYYY-MM-DD
const dayLabelFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
});
const timeFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const hourFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "numeric",
  hourCycle: "h23",
});

function dayKeyOf(ts: number): string {
  return dayKeyFmt.format(new Date(ts));
}

function fmtDur(s?: number): string {
  if (!s || s < 0) return "—";
  const r = Math.round(s);
  if (r < 60) return `${r}s`;
  return `${Math.floor(r / 60)}m ${r % 60}s`;
}

function flagOf(co?: string): string {
  if (!co || co.length !== 2) return "🌐";
  try {
    return String.fromCodePoint(
      ...[...co.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))
    );
  } catch {
    return "🌐";
  }
}

function refDomain(ref?: string | null): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).hostname.replace(/^www\./, "").slice(0, 30);
  } catch {
    return ref.slice(0, 30);
  }
}

function pct(n: number, d: number): string {
  if (!d) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

/* ------------------------- etiquetas de eventos --------------------------- */

const FILTER_LABELS: Record<string, string> = {
  SI_CUENTO: "Sí, cuento con el presupuesto",
  PUEDO_REUNIRLO: "Sí, puedo reunirlo",
  NO_POR_AHORA: "No por ahora",
};

const Q_LABELS = [
  "",
  "Negocio",
  "Mensajes/día",
  "Fuentes",
  "Sistema actual",
  "Automatización",
  "Momento",
  "Decisión",
  "Inversión",
];

function eventText(
  e: SessionEvent
): { text: string; tone: "dim" | "ink" | "wa" | "amber" } {
  const d = e.d ?? {};
  switch (e.e) {
    case "view":
      return {
        text: `Visitó la página${typeof d.path === "string" ? ` (${d.path})` : ""}`,
        tone: "ink",
      };
    case "section":
      return {
        text: `Vió la sección: ${typeof d.s === "string" ? d.s : "—"}`,
        tone: "dim",
      };
    case "click":
      return {
        text: `Clic en: ${typeof d.t === "string" ? d.t : "—"}`,
        tone: "dim",
      };
    case "quiz_open":
      return { text: "Abrió el diagnóstico", tone: "wa" };
    case "quiz_step": {
      const n = typeof d.n === "number" ? d.n : 0;
      return {
        text: `Respondió P${n}${Q_LABELS[n] ? ` · ${Q_LABELS[n]}` : ""}${
          typeof d.a === "string" && d.a ? `: ${d.a}` : ""
        }`,
        tone: "ink",
      };
    }
    case "quiz_filter":
      return {
        text: `Presupuesto: ${FILTER_LABELS[String(d.a)] ?? String(d.a ?? "—")}`,
        tone: "wa",
      };
    case "quiz_disqual":
      return { text: "Descalificado (sin presupuesto)", tone: "amber" };
    case "calendar_view":
      return { text: "Vió el calendario de sesiones", tone: "ink" };
    case "form_view":
      return { text: "Llegó al formulario", tone: "ink" };
    case "quiz_booked":
      return {
        text: `Reservó sesión${typeof d.d === "string" && d.d ? ` (${d.d})` : ""}`,
        tone: "wa",
      };
    case "whatsapp_open":
    case "whatsapp_confirm":
    case "whatsapp_link":
      return { text: "Abrió WhatsApp con el mensaje", tone: "wa" };
    default:
      return { text: e.e, tone: "dim" };
  }
}

const TONE_CLASS: Record<string, string> = {
  dim: "text-dim",
  ink: "text-ink",
  wa: "text-wa",
  amber: "text-amber-300",
};

/* --------------------------- agregación ---------------------------------- */

function aggregate(list: SessionMeta[]) {
  const total = list.length;
  const openers = list.filter((s) => s.qo).length;
  const completers = list.filter((s) => s.qc).length;
  const booked = list.filter((s) => s.bk).length;
  const reached = (k: number) => list.filter((s) => (s.qs ?? 0) >= k).length;
  const stepAvg = openers
    ? list.reduce((a, s) => a + (s.qo ? s.qs ?? 0 : 0), 0) / openers / 8
    : 0;
  const avgDur = total ? list.reduce((a, s) => a + (s.dur ?? 0), 0) / total : 0;
  const avgScroll = total
    ? list.reduce((a, s) => a + (s.sm ?? 0), 0) / total
    : 0;

  const tally = (get: (s: SessionMeta) => string | null | undefined) => {
    const m = new Map<string, number>();
    for (const s of list) {
      const k = get(s);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  return {
    total,
    openers,
    completers,
    booked,
    reached,
    stepAvg,
    avgDur,
    avgScroll,
    countries: tally((s) => s.co || null),
    cities: tally((s) => (s.city ? `${s.city}${s.co ? `, ${s.co}` : ""}` : null)),
    sources: tally((s) => s.src || null),
    referrers: tally((s) => refDomain(s.ref)),
    devices: tally((s) => s.dev || null),
    browsers: tally((s) => s.br || null),
    markets: tally((s) => s.mkt || null),
  };
}

/* --------------------------- subcomponentes ------------------------------- */

function Kpi({
  value,
  label,
  sub,
}: {
  value: string | number;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
      <p className="font-display text-xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-dim">
        {label}
      </p>
      {sub ? <p className="mt-0.5 text-[10px] text-dim/70">{sub}</p> : null}
    </div>
  );
}

function Card({
  title,
  icon,
  note,
  children,
}: {
  title: string;
  icon: ReactNode;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
      <h3 className="flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-[0.12em] text-ink">
        <span className="text-wa">{icon}</span>
        {title}
      </h3>
      {note ? <p className="mt-1 text-[10.5px] text-dim/70">{note}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BarRow({
  label,
  value,
  max,
}: {
  label: ReactNode;
  value: number;
  max: number;
}) {
  const w = max > 0 ? Math.max((value / max) * 100, 2) : 0;
  return (
    <div className="flex items-center gap-3 py-[3px]">
      <div className="w-[104px] shrink-0 truncate text-[11.5px] text-ink/90 sm:w-[124px]">
        {label}
      </div>
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-wa/50 to-wa"
          style={{ width: `${w}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[11px] font-semibold text-dim">
        {value}
      </span>
    </div>
  );
}

function FunnelRow({
  label,
  n,
  base,
  prev,
}: {
  label: string;
  n: number;
  base: number;
  prev: number | null;
}) {
  const w = base > 0 ? Math.max((n / base) * 100, 2) : 0;
  const p = base > 0 ? Math.round((n / base) * 100) : 0;
  const vsPrev = prev !== null && prev > 0 ? Math.round((n / prev) * 100) : null;
  const drop = vsPrev !== null && vsPrev < 100 ? 100 - vsPrev : null;
  return (
    <div className="flex items-center gap-2 py-[3px]">
      <span className="w-[96px] shrink-0 truncate text-right text-[11px] text-dim sm:w-[128px]">
        {label}
      </span>
      <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-md bg-white/[0.05]">
        <div
          className="h-full rounded-md bg-gradient-to-r from-wa/30 to-wa"
          style={{ width: `${w}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-right text-[11.5px] font-bold text-ink">
        {n}
      </span>
      <span className="w-9 shrink-0 text-right text-[10.5px] text-dim">{p}%</span>
      {drop !== null && drop > 0 ? (
        <span className="hidden w-10 shrink-0 text-right text-[10px] font-semibold text-amber-300 sm:inline">
          −{drop}%
        </span>
      ) : (
        <span className="hidden w-10 shrink-0 sm:inline" />
      )}
    </div>
  );
}

function statusOf(s: SessionMeta): { label: string; cls: string } {
  if (s.bk)
    return { label: "Reservó", cls: "border-wa/30 bg-wa/10 text-wa" };
  if (s.dq)
    return {
      label: "Descalif.",
      cls: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    };
  if (s.qc)
    return { label: "Completó", cls: "border-white/15 bg-white/[0.05] text-ink" };
  if (s.qo)
    return {
      label: `P${s.qs ?? 0}/8`,
      cls: "border-white/12 bg-white/[0.04] text-dim",
    };
  return { label: "No abrió", cls: "border-white/10 bg-white/[0.03] text-dim/70" };
}

function MarketChip({ mkt }: { mkt?: string }) {
  if (!mkt) return null;
  const mx = mkt.toUpperCase() === "MX";
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-dim">
      <span aria-hidden="true">{mx ? "🇲🇽" : "🇨🇴"}</span>
      {mx ? "MX" : "CO"}
    </span>
  );
}

/* ------------------------------ vista ------------------------------------ */

const RANGES: [Range, string][] = [
  ["today", "Hoy"],
  ["7d", "7 días"],
  ["30d", "30 días"],
  ["all", "Todo"],
];

export function MetricsView({ adminKey }: { adminKey: string }) {
  const [sessions, setSessions] = useState<SessionMeta[] | null>(null);
  const [loadError, setLoadError] = useState<"auth" | "offline" | null>(null);
  const [range, setRange] = useState<Range>("7d");
  const [detail, setDetail] = useState<SessionMeta | null>(null);
  const [detailData, setDetailData] = useState<SessionFull | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!adminKey) return;
    setSessions(null);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/metrics", {
        headers: { "x-admin-key": adminKey },
      });
      if (res.status === 401) {
        setLoadError("auth");
        return;
      }
      if (!res.ok) throw new Error("request_failed");
      const data = (await res.json()) as {
        ok: boolean;
        sessions?: SessionMeta[];
      };
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch {
      setLoadError("offline");
    }
  }, [adminKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = useCallback(async (s: SessionMeta) => {
    setDetail(s);
    setDetailData(null);
    try {
      const res = await fetch(
        `/api/admin/session?key=${encodeURIComponent(s.id)}`,
        { headers: { "x-admin-key": adminKey } }
      );
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; session?: SessionFull };
      if (data.session) setDetailData(data.session);
    } catch {
      /* detalle no crítico */
    }
  }, [adminKey]);

  const deleteSession = useCallback(
    async (id: string) => {
      if (deleting) return;
      if (
        !window.confirm(
          "¿Eliminar esta sesión del panel? Esta acción no se puede deshacer."
        )
      )
        return;
      setDeleting(true);
      try {
        const res = await fetch(
          `/api/admin/session?key=${encodeURIComponent(id)}`,
          { method: "DELETE", headers: { "x-admin-key": adminKey } }
        );
        if (res.ok) {
          setSessions((l) => (l ? l.filter((x) => x.id !== id) : l));
          setDetail(null);
        }
      } catch {
        /* noop */
      } finally {
        setDeleting(false);
      }
    },
    [adminKey, deleting]
  );

  const filtered = useMemo(() => {
    const list = sessions ?? [];
    if (range === "all") return list;
    if (range === "today") {
      const key = dayKeyFmt.format(new Date());
      return list.filter((s) => dayKeyOf(s.t0 ?? 0) === key);
    }
    const days = range === "7d" ? 7 : 30;
    const cutoff = Date.now() - days * 86_400_000;
    return list.filter((s) => (s.t0 ?? 0) >= cutoff);
  }, [sessions, range]);

  const agg = useMemo(() => aggregate(filtered), [filtered]);

  const chartData = useMemo(() => {
    if (range === "today") {
      const todayKey = dayKeyFmt.format(new Date());
      const hours = Array.from({ length: 24 }, (_, h) => ({
        l: `${h}h`,
        s: 0,
        q: 0,
      }));
      for (const s of filtered) {
        if (dayKeyOf(s.t0 ?? 0) !== todayKey) continue;
        const h = Number(hourFmt.format(new Date(s.t0 ?? 0)));
        if (hours[h]) {
          hours[h].s += 1;
          if (s.qo) hours[h].q += 1;
        }
      }
      return hours.filter((_, i) => i % 2 === 0);
    }
    const days = range === "7d" ? 7 : 30;
    const byDay = new Map<string, { s: number; q: number }>();
    for (const s of filtered) {
      const k = dayKeyOf(s.t0 ?? 0);
      const cur = byDay.get(k) ?? { s: 0, q: 0 };
      cur.s += 1;
      if (s.qo) cur.q += 1;
      byDay.set(k, cur);
    }
    const out: { l: string; s: number; q: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const cur = byDay.get(dayKeyFmt.format(d));
      out.push({ l: dayLabelFmt.format(d), s: cur?.s ?? 0, q: cur?.q ?? 0 });
    }
    return out;
  }, [filtered, range]);

  const funnelRows = useMemo(() => {
    const rows: { label: string; n: number; prev: number | null }[] = [
      { label: "Sesiones", n: agg.total, prev: null },
      { label: "Abrió quiz", n: agg.openers, prev: agg.total },
    ];
    for (let k = 1; k <= 8; k++) {
      rows.push({
        label: `P${k} · ${Q_LABELS[k]}`,
        n: agg.reached(k),
        prev: rows[rows.length - 1].n,
      });
    }
    rows.push({
      label: "Completó",
      n: agg.completers,
      prev: rows[rows.length - 1].n,
    });
    rows.push({ label: "Reservó", n: agg.booked, prev: rows[rows.length - 1].n });
    return rows;
  }, [agg]);

  const recent = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => (b.last ?? b.t0 ?? 0) - (a.last ?? a.t0 ?? 0))
        .slice(0, 40),
    [filtered]
  );

  const detailEvents = useMemo(() => {
    const base = detailData?.t0 ?? detail?.t0 ?? 0;
    const evts = detailData?.events ?? [];
    return evts.map((e) => {
      const off = Math.max(0, Math.round((e.t - base) / 1000));
      const mm = Math.floor(off / 60);
      const ss = String(off % 60).padStart(2, "0");
      return { ...e, off: `+${mm}:${ss}` };
    });
  }, [detailData, detail]);

  /* ------------------------------ render -------------------------------- */

  if (loadError) {
    return (
      <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-center">
        <p className="font-display text-sm font-bold uppercase tracking-[0.1em] text-ink">
          {loadError === "auth" ? "Sesión expirada" : "Servidor no disponible"}
        </p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-dim">
          {loadError === "auth"
            ? "La clave ya no es válida. Cierra y vuelve a ingresar con tu clave."
            : "No se pudieron cargar las métricas. Revisa tu conexión e intenta de nuevo."}
        </p>
        {loadError === "offline" && (
          <button
            type="button"
            onClick={() => void load()}
            className={`mt-4 inline-flex items-center gap-2 rounded-xl border border-white/12 px-4 py-2 text-[12px] font-semibold text-ink hover:bg-white/[0.04] ${FOCUS_RING}`}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Reintentar
          </button>
        )}
      </div>
    );
  }

  if (sessions === null) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-dim">
        <Loader2 className="h-6 w-6 animate-spin text-wa" aria-hidden="true" />
        <p className="text-[13px]">Cargando métricas…</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/12">
      {/* Rango + refresco */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5" role="group" aria-label="Rango de tiempo">
          {RANGES.map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setRange(v)}
              aria-pressed={range === v}
              className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                range === v
                  ? "border-wa/40 bg-wa/10 text-wa"
                  : "border-white/10 text-dim hover:text-ink"
              } ${FOCUS_RING}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-dim">
            {filtered.length} sesión{filtered.length === 1 ? "" : "es"}
          </span>
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Actualizar métricas"
            className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-dim transition-colors hover:text-ink ${FOCUS_RING}`}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-white/8 bg-white/[0.02] p-7 text-center">
          <Users className="mx-auto h-7 w-7 text-dim/50" aria-hidden="true" />
          <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.1em] text-ink">
            Sin sesiones en este período
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-dim">
            {sessions.length > 0
              ? "Hay sesiones registradas fuera del rango seleccionado. Prueba con un rango más amplio."
              : "Cada visita al landing se registrará aquí automáticamente: de dónde llega, qué hace y hasta dónde avanza en el diagnóstico."}
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Kpi value={agg.total} label="Sesiones" />
            <Kpi
              value={agg.openers}
              label="Abrieron quiz"
              sub={pct(agg.openers, agg.total)}
            />
            <Kpi
              value={`${Math.round(agg.stepAvg * 100)}%`}
              label="Avance medio"
              sub="del diagnóstico"
            />
            <Kpi
              value={agg.completers}
              label="Completaron"
              sub={pct(agg.completers, agg.openers)}
            />
            <Kpi
              value={agg.booked}
              label="Reservaron"
              sub={pct(agg.booked, agg.completers)}
            />
            <Kpi
              value={fmtDur(agg.avgDur)}
              label="Duración media"
              sub={`scroll ${Math.round(agg.avgScroll)}%`}
            />
          </div>

          {/* Tráfico por día */}
          <Card
            title={
              range === "today" ? "Tráfico por hora (hoy)" : "Tráfico por día"
            }
            icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
            note="Sesiones iniciadas y quiz abiertos (Hora Colombia)"
          >
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 6, right: 6, left: -26, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="l"
                    tick={{
                      fill: "rgba(255,255,255,0.45)",
                      fontSize: 10,
                    }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    minTickGap={14}
                  />
                  <YAxis
                    tick={{
                      fill: "rgba(255,255,255,0.45)",
                      fontSize: 10,
                    }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0b0f11",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                    cursor={{ stroke: "rgba(255,255,255,0.15)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="s"
                    name="Sesiones"
                    stroke="#00e676"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="q"
                    name="Abrieron quiz"
                    stroke="#ffd166"
                    strokeWidth={1.6}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Embudo */}
          <Card
            title="Embudo del diagnóstico"
            icon={<MousePointerClick className="h-4 w-4" aria-hidden="true" />}
            note="P1–P8 = respondieron esa pregunta · −% = abandono vs paso anterior"
          >
            <div>
              {funnelRows.map((r) => (
                <FunnelRow
                  key={r.label}
                  label={r.label}
                  n={r.n}
                  base={agg.total}
                  prev={r.prev}
                />
              ))}
            </div>
          </Card>

          {/* Geografía */}
          <Card
            title="Ubicación por IP"
            icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            note="Geolocalización aproximada (Cloudflare) · la IP cruda no se guarda"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                  Países
                </p>
                {agg.countries.length === 0 ? (
                  <p className="text-[12px] text-dim/70">—</p>
                ) : (
                  agg.countries.slice(0, 8).map(([k, v]) => (
                    <BarRow
                      key={k}
                      label={
                        <span>
                          <span aria-hidden="true">{flagOf(k)}</span> {k}
                        </span>
                      }
                      value={v}
                      max={agg.countries[0][1]}
                    />
                  ))
                )}
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                  Ciudades
                </p>
                {agg.cities.length === 0 ? (
                  <p className="text-[12px] text-dim/70">—</p>
                ) : (
                  agg.cities.slice(0, 8).map(([k, v]) => (
                    <BarRow
                      key={k}
                      label={k}
                      value={v}
                      max={agg.cities[0][1]}
                    />
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Fuentes */}
          <Card
            title="Fuentes de tráfico"
            icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
            note="Origen UTM de cada sesión y desde qué página venían"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                  Origen (campaña)
                </p>
                {agg.sources.length === 0 ? (
                  <p className="text-[12px] text-dim/70">—</p>
                ) : (
                  agg.sources.slice(0, 8).map(([k, v]) => (
                    <BarRow
                      key={k}
                      label={
                        <span className="text-wa/90">{k.slice(0, 26)}</span>
                      }
                      value={v}
                      max={agg.sources[0][1]}
                    />
                  ))
                )}
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                  Referentes
                </p>
                {agg.referrers.length === 0 ? (
                  <p className="text-[12px] text-dim/70">—</p>
                ) : (
                  agg.referrers.slice(0, 8).map(([k, v]) => (
                    <BarRow
                      key={k}
                      label={k}
                      value={v}
                      max={agg.referrers[0][1]}
                    />
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Dispositivos */}
          <Card
            title="Dispositivos y navegadores"
            icon={<Monitor className="h-4 w-4" aria-hidden="true" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                  Dispositivos
                </p>
                {agg.devices.map(([k, v]) => (
                  <BarRow
                    key={k}
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        {k === "mobile" ? (
                          <Smartphone className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <Monitor className="h-3 w-3" aria-hidden="true" />
                        )}
                        {k}
                      </span>
                    }
                    value={v}
                    max={agg.devices[0][1]}
                  />
                ))}
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                  Navegadores
                </p>
                {agg.browsers.length === 0 ? (
                  <p className="text-[12px] text-dim/70">—</p>
                ) : (
                  agg.browsers.slice(0, 8).map(([k, v]) => (
                    <BarRow
                      key={k}
                      label={k}
                      value={v}
                      max={agg.browsers[0][1]}
                    />
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Sesiones recientes */}
          <Card
            title="Sesiones recientes"
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            note="Toca una sesión para ver todo lo que hizo ese visitante"
          >
            <div className="flex max-h-[430px] flex-col gap-2 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/12">
              {recent.map((s) => {
                const st = statusOf(s);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void openDetail(s)}
                    className={`w-full rounded-2xl border border-white/8 bg-white/[0.025] p-3 text-left transition-colors hover:border-white/14 ${FOCUS_RING}`}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span aria-hidden="true" className="text-[14px]">
                        {flagOf(s.co)}
                      </span>
                      <span className="truncate text-[12.5px] font-semibold text-ink">
                        {s.city || s.co || "Ubicación desconocida"}
                      </span>
                      <MarketChip mkt={s.mkt} />
                      <span className="text-[10.5px] text-dim">
                        {timeFmt.format(new Date(s.last ?? s.t0 ?? 0))}
                      </span>
                      <span
                        className={`ml-auto inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-dim">
                      {s.src || "Directo / orgánico"}
                      {s.dev ? ` · ${s.dev}` : ""}
                      {s.br ? ` · ${s.br}` : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={`h-full rounded-full ${
                            s.qc ? "bg-wa" : "bg-wa/60"
                          }`}
                          style={{ width: `${((s.qs ?? 0) / 8) * 100}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[10px] text-dim">
                        P{s.qs ?? 0}/8 · {fmtDur(s.dur)} · scroll {s.sm ?? 0}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* Detalle de sesión */}
      {detail && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Detalle de sesión"
        >
          <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0a0e10] p-5 shadow-2xl sm:rounded-3xl [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/12">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                  <span aria-hidden="true">{flagOf(detail.co)}</span>
                  {detail.city || detail.co || "Ubicación desconocida"}
                </p>
                <p className="mt-0.5 text-[11px] text-dim">
                  {timeFmt.format(new Date(detail.last ?? detail.t0 ?? 0))}
                  {detail.reg ? ` · ${detail.reg}` : ""}
                  {detail.asn ? ` · ${detail.asn}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                aria-label="Cerrar detalle"
                className={`-mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-dim transition-colors hover:text-ink ${FOCUS_RING}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {!detailData ? (
              <div className="flex items-center gap-2 py-6 text-[12px] text-dim">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Cargando línea de tiempo…
              </div>
            ) : (
              <>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-dim">
                      Dispositivo
                    </dt>
                    <dd className="mt-0.5 text-[12px] text-ink">
                      {detailData.dev || "—"}
                      {detailData.br ? ` · ${detailData.br}` : ""}
                      {detailData.os ? ` · ${detailData.os}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-dim">
                      Pantalla
                    </dt>
                    <dd className="mt-0.5 text-[12px] text-ink">
                      {detailData.screen || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-dim">
                      Referente
                    </dt>
                    <dd className="mt-0.5 truncate text-[12px] text-ink">
                      {refDomain(detailData.ref) || "Directo"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-dim">
                      Idioma
                    </dt>
                    <dd className="mt-0.5 text-[12px] text-ink">
                      {detailData.lang || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-dim">
                      Duración
                    </dt>
                    <dd className="mt-0.5 text-[12px] text-ink">
                      {fmtDur(detailData.dur)} · scroll {detailData.sm ?? 0}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-dim">
                      Eventos
                    </dt>
                    <dd className="mt-0.5 text-[12px] text-ink">
                      {detailEvents.length}
                    </dd>
                  </div>
                  {detailData.src ? (
                    <div className="col-span-2">
                      <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-dim">
                        Origen (UTM)
                      </dt>
                      <dd className="mt-0.5 break-words text-[12px] text-wa">
                        {detailData.src}
                      </dd>
                    </div>
                  ) : null}
                  {detailData.utm ? (
                    <div className="col-span-2">
                      <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-dim">
                        Parámetros
                      </dt>
                      <dd className="mt-0.5 break-words text-[11.5px] text-dim">
                        {Object.entries(detailData.utm)
                          .map(([k, v]) => `${k}=${String(v)}`)
                          .join(" · ")}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                  Línea de tiempo
                </p>
                <ol className="mt-2 flex flex-col">
                  {detailEvents.map((e) => {
                    const { text, tone } = eventText(e);
                    return (
                      <li
                        key={e.eid}
                        className="flex items-baseline gap-2.5 py-[3px]"
                      >
                        <span className="w-10 shrink-0 font-mono text-[9.5px] text-dim/70">
                          {e.off}
                        </span>
                        <span
                          className={`min-w-0 flex-1 text-[11.5px] leading-snug ${TONE_CLASS[tone]}`}
                        >
                          {text}
                        </span>
                      </li>
                    );
                  })}
                  {detailEvents.length === 0 && (
                    <li className="py-2 text-[12px] text-dim/70">
                      Sin eventos registrados.
                    </li>
                  )}
                </ol>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void deleteSession(detail.id)}
                    disabled={deleting}
                    className={`inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50 ${FOCUS_RING}`}
                  >
                    {deleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    )}
                    Eliminar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Espacio para el detalle flotante (evita scroll muerto) */}
      <div aria-hidden="true" className="h-2" />
    </div>
  );
}
