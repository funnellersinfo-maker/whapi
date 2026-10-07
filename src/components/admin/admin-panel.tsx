"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, MouseEvent as ReactMouseEvent } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizData } from "@/lib/types";

/* ---------------------------------- types --------------------------------- */

interface AdminLead {
  id: string;
  status: string;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  country: string | null;
  sessionDate: string | null;
  sessionTime: string | null;
  waMessage: string | null;
  quiz: QuizData | null;
  createdAt: string;
  updatedAt: string;
}

type Tab = "leads" | "calendar";

/* ------------------------- constants & formatters ------------------------- */

const ADMIN_KEY_STORAGE = "whapi-admin-key";
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"] as const;
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa/50";

const bogotaDayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const bogotaDayNumFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "numeric",
});
const bogotaMonthShortFmt = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  month: "short",
});
const bogotaTimeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Bogota",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const utcWeekdayShortFmt = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  timeZone: "UTC",
});
const utcMonthShortFmt = new Intl.DateTimeFormat("es-CO", {
  month: "short",
  timeZone: "UTC",
});
const utcMonthLongFmt = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  timeZone: "UTC",
});
const utcSessionLongFmt = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/* --------------------------------- helpers -------------------------------- */

const pad2 = (n: number): string => String(n).padStart(2, "0");

function bogotaKey(date: Date): string {
  return bogotaDayFmt.format(date);
}

function todayBogotaKey(): string {
  return bogotaDayFmt.format(new Date());
}

function fromDayKey(key: string): Date {
  // UTC-noon anchor: the calendar day is stable regardless of local timezone.
  return new Date(`${key}T12:00:00Z`);
}

function isoDayKey(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "sáb, 10 oct · 10:30 AM" */
function formatSessionShort(iso: string, time: string | null): string {
  const d = fromDayKey(iso);
  const base = `${utcWeekdayShortFmt.format(d).replace(/\./g, "")}, ${d.getUTCDate()} ${utcMonthShortFmt.format(d).replace(/\./g, "")}`;
  return time ? `${base} · ${time}` : base;
}

/** "Sábado, 10 de octubre" */
function formatLongDate(key: string): string {
  return capitalizeFirst(utcSessionLongFmt.format(fromDayKey(key)));
}

/** "Octubre 2026" */
function monthTitleOf(y: number, m: number): string {
  const name = utcMonthLongFmt.format(new Date(Date.UTC(y, m, 1)));
  return `${capitalizeFirst(name)} ${y}`;
}

/** "7 oct · 5:21 PM" (Bogotá) */
function formatCreated(iso: string): string {
  const d = new Date(iso);
  return `${bogotaDayNumFmt.format(d)} ${bogotaMonthShortFmt.format(d).replace(/\./g, "")} · ${bogotaTimeFmt.format(d)}`;
}

/** Accent-insensitive, case-insensitive normalization for search. */
function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function waHref(whatsapp: string): string {
  let digits = whatsapp.replace(/\D/g, "");
  if (!digits.startsWith("57")) digits = `57${digits}`;
  return `https://wa.me/${digits}`;
}

/** Minutes since midnight for "10:30 AM" style strings (for sorting). */
function parseTimeMinutes(t: string | null): number {
  if (!t) return 24 * 60;
  const m = /^(\d{1,2}):(\d{2})\s*(A\.?\s?M\.?|P\.?\s?M\.?)/i.exec(t.trim());
  if (!m) return 24 * 60;
  let h = Number.parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase().startsWith("P")) h += 12;
  return h * 60 + Number.parseInt(m[2], 10);
}

function budgetLabel(v: string | undefined): string {
  if (v === "SI_CUENTO") return "Confirmado";
  if (v === "PUEDO_REUNIRLO") return "Puede reunirlo";
  if (v === "NO_POR_AHORA") return "No por ahora";
  return "—";
}

/* ------------------------------ subcomponents ------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "QUALIFIED"
      ? "border-wa/40 bg-wa/10 text-wa-bright"
      : status === "DISQUALIFIED"
        ? "border-gold/40 bg-gold/10 text-gold"
        : "border-white/10 bg-white/[0.05] text-dim";
  const label =
    status === "QUALIFIED"
      ? "Calificado"
      : status === "DISQUALIFIED"
        ? "Descartado"
        : "En progreso";
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        cls,
      )}
    >
      {label}
    </span>
  );
}

function KpiCard({
  value,
  label,
  valueClass,
}: {
  value: string | number;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-panel/60 p-4">
      <p className={cn("font-display text-2xl font-bold text-ink", valueClass)}>
        {value}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-dim">{label}</p>
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] py-1 pl-3 pr-1.5 text-[11px] font-medium text-ink/80">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Quitar filtro: ${label}`}
        className={cn(
          "flex h-4.5 w-4.5 items-center justify-center rounded-full text-dim transition-colors hover:bg-white/10 hover:text-ink",
          FOCUS_RING,
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-2xl border border-white/8 bg-panel/60"
        />
      ))}
    </div>
  );
}

function ExpandedDetails({
  lead,
  onDelete,
  deleting,
}: {
  lead: AdminLead;
  onDelete: (lead: AdminLead) => void;
  deleting: boolean;
}) {
  const q = lead.quiz;
  const rows: Array<[string, string]> = q
    ? ([
        ["Negocio", q.businessType || "—"],
        ["Mensajes por día", q.dailyMessages || "—"],
        [
          "Fuentes de tráfico",
          q.trafficSources && q.trafficSources.length > 0
            ? q.trafficSources.join(", ")
            : "—",
        ],
        ["Sistema actual", q.currentSystem || "—"],
        [
          "Automatización previa",
          q.automationPrev
            ? q.automationTool
              ? `${q.automationPrev} (${q.automationTool})`
              : q.automationPrev
            : "—",
        ],
        ["Momento para implementar", q.implementationTiming || "—"],
        ["Decisión", q.decisionMaker || "—"],
        ["Capacidad de inversión", q.investmentCapacity || "—"],
        ["Presupuesto mínimo", budgetLabel(q.budgetConfirmed)],
        ...(lead.email ? ([["Email", lead.email]] as Array<[string, string]>) : []),
        ...(lead.country ? ([["País", lead.country]] as Array<[string, string]>) : []),
      ] satisfies Array<[string, string]>)
    : [["Diagnóstico", "Sin respuestas guardadas"]];

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-dim">
              {label}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-ink/90">{value}</p>
          </div>
        ))}
      </div>

      {lead.waMessage ? (
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-dim">
            Mensaje de WhatsApp
          </p>
          <pre className="mt-1.5 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/8 bg-black/30 p-3 font-sans text-[12px] leading-relaxed text-ink/85">
            {lead.waMessage}
          </pre>
        </div>
      ) : null}

      <div className="mt-5">
        <button
          type="button"
          disabled={deleting}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(lead);
          }}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-full border border-[#ff7d6e]/35 bg-[#ff7d6e]/[0.07] px-4 text-[12px] font-bold uppercase tracking-[0.05em] text-[#ffa79b] transition-colors hover:bg-[#ff7d6e]/[0.14] disabled:opacity-50",
            FOCUS_RING,
          )}
        >
          {deleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          {deleting ? "Eliminando…" : "Eliminar registro"}
        </button>
      </div>
    </div>
  );
}

function WaLink({
  whatsapp,
  onNavigate,
}: {
  whatsapp: string;
  onNavigate?: (e: ReactMouseEvent) => void;
}) {
  return (
    <a
      href={waHref(whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className="font-medium text-wa transition-colors hover:text-wa-bright hover:underline"
    >
      {whatsapp}
    </a>
  );
}

/* ------------------------------ main component ----------------------------- */

export function AdminGear() {
  const [unlocked, setUnlocked] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [gateError, setGateError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [tab, setTab] = useState<Tab>("leads");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedNotice, setDeletedNotice] = useState<string | null>(null);

  const todayKey = useMemo(() => todayBogotaKey(), []);
  const [viewMonth, setViewMonth] = useState(() => ({
    y: Number(todayBogotaKey().slice(0, 4)),
    m: Number(todayBogotaKey().slice(5, 7)) - 1,
  }));
  const [calSelected, setCalSelected] = useState<string | null>(null);
  const calInitRef = useRef(false);
  const deletedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------------------------------ data loading ---------------------------- */

  const fetchLeads = useCallback(
    async (keyOverride?: string) => {
      const key = keyOverride ?? adminKey ?? sessionStorage.getItem(ADMIN_KEY_STORAGE);
      if (!key) return;
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch("/api/admin/leads", {
          headers: { "x-admin-key": key },
        });
        if (res.status === 401) {
          sessionStorage.removeItem(ADMIN_KEY_STORAGE);
          setUnlocked(false);
          setPanelOpen(false);
          setGateOpen(true);
          setGateError(true);
          return;
        }
        if (!res.ok) throw new Error("request_failed");
        const data = (await res.json()) as { ok: boolean; leads?: AdminLead[] };
        const list = Array.isArray(data.leads) ? data.leads : [];
        setLeads(list);

        // Initial calendar selection: earliest upcoming booked day (or today).
        if (!calInitRef.current) {
          calInitRef.current = true;
          const upcoming = list
            .map((l) => l.sessionDate)
            .filter((d): d is string => !!d && d >= todayKey)
            .sort();
          const sel = upcoming.length > 0 ? upcoming[0] : todayKey;
          setCalSelected(sel);
          setViewMonth({
            y: Number(sel.slice(0, 4)),
            m: Number(sel.slice(5, 7)) - 1,
          });
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    },
    [adminKey, todayKey],
  );

  // Silent verification of a persisted key on mount.
  useEffect(() => {
    let cancelled = false;
    const stored = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (!stored) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/leads?limit=1", {
          headers: { "x-admin-key": stored },
        });
        if (res.ok) {
          if (!cancelled) {
            setAdminKey(stored);
            setUnlocked(true);
          }
        } else {
          sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        }
      } catch {
        /* stay locked, stay silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lock body scroll while any overlay is open.
  useEffect(() => {
    if (!gateOpen && !panelOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [gateOpen, panelOpen]);

  // Escape closes the open overlay.
  useEffect(() => {
    if (!gateOpen && !panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanelOpen(false);
        setGateOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gateOpen, panelOpen]);

  // Clear the transient "deleted" timer on unmount.
  useEffect(() => {
    return () => {
      if (deletedTimerRef.current) clearTimeout(deletedTimerRef.current);
    };
  }, []);

  /* --------------------------------- actions ------------------------------ */

  const closeGate = useCallback(() => {
    setGateOpen(false);
    setGateError(false);
    setPassword("");
  }, []);

  const onGearClick = () => {
    if (unlocked) {
      setPanelOpen(true);
      if (leads.length === 0 && !loading && !loadError) void fetchLeads();
    } else {
      setGateOpen(true);
    }
  };

  const onGateSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (verifying) return;
    const key = password.trim();
    setVerifying(true);
    setGateError(false);
    try {
      const res = await fetch("/api/admin/leads?limit=1", {
        headers: { "x-admin-key": key },
      });
      if (res.ok) {
        sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
        setAdminKey(key);
        setUnlocked(true);
        closeGate();
        setPanelOpen(true);
        void fetchLeads(key);
      } else {
        setGateError(true);
      }
    } catch {
      setGateError(true);
    } finally {
      setVerifying(false);
    }
  };

  const showDeletedNotice = (name: string) => {
    setDeletedNotice(name);
    if (deletedTimerRef.current) clearTimeout(deletedTimerRef.current);
    deletedTimerRef.current = setTimeout(() => setDeletedNotice(null), 2600);
  };

  const onDelete = async (lead: AdminLead) => {
    if (!window.confirm("¿Eliminar este lead definitivamente?")) return;
    const key = adminKey ?? sessionStorage.getItem(ADMIN_KEY_STORAGE);
    if (!key) return;
    setDeletingId(lead.id);
    try {
      const res = await fetch(
        `/api/admin/leads?id=${encodeURIComponent(lead.id)}`,
        { method: "DELETE", headers: { "x-admin-key": key } },
      );
      if (!res.ok) throw new Error("delete_failed");
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
      setExpandedId((prev) => (prev === lead.id ? null : prev));
      showDeletedNotice(lead.name ?? "");
    } catch {
      /* keep the row; nothing to recover to */
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  /* ------------------------------- derived data ---------------------------- */

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) if (l.country) set.add(l.country);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [leads]);

  const kpis = useMemo(() => {
    const qualified = leads.filter((l) => l.status === "QUALIFIED").length;
    const disqualified = leads.filter((l) => l.status === "DISQUALIFIED").length;
    const denom = qualified + disqualified;
    return {
      total: leads.length,
      qualified,
      disqualified,
      inProgress: leads.filter((l) => l.status === "IN_PROGRESS").length,
      booked: leads.filter((l) => l.sessionDate).length,
      rate: denom > 0 ? `${Math.round((qualified / denom) * 100)}%` : "—",
    };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = normalizeText(query.trim());
    return leads.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      if (countryFilter && (l.country ?? "") !== countryFilter) return false;
      if (fromDate || toDate) {
        const created = bogotaKey(new Date(l.createdAt));
        if (fromDate && created < fromDate) return false;
        if (toDate && created > toDate) return false;
      }
      if (q) {
        const hay = normalizeText(
          `${l.name ?? ""} ${l.whatsapp ?? ""} ${l.email ?? ""}`,
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, query, statusFilter, countryFilter, fromDate, toDate]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, AdminLead[]>();
    for (const l of leads) {
      if (!l.sessionDate) continue;
      const arr = map.get(l.sessionDate);
      if (arr) arr.push(l);
      else map.set(l.sessionDate, [l]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => parseTimeMinutes(a.sessionTime) - parseTimeMinutes(b.sessionTime));
    }
    return map;
  }, [leads]);

  const monthGrid = useMemo(() => {
    const first = new Date(Date.UTC(viewMonth.y, viewMonth.m, 1));
    const leading = (first.getUTCDay() + 6) % 7; // Monday first
    const daysInMonth = new Date(Date.UTC(viewMonth.y, viewMonth.m + 1, 0)).getUTCDate();
    const cells: Array<{ key: string; day: number }> = [];
    for (let i = 0; i < leading; i++) cells.push({ key: `pad-${i}`, day: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ key: isoDayKey(viewMonth.y, viewMonth.m, d), day: d });
    }
    while (cells.length % 7 !== 0) cells.push({ key: `pad-end-${cells.length}`, day: 0 });
    return cells;
  }, [viewMonth]);

  const shiftMonth = (delta: number) => {
    setViewMonth((m) => {
      let y = m.y;
      let mo = m.m + delta;
      if (mo < 0) {
        mo = 11;
        y -= 1;
      } else if (mo > 11) {
        mo = 0;
        y += 1;
      }
      return { y, m: mo };
    });
  };

  const goToday = () => {
    const t = todayBogotaKey();
    setViewMonth({ y: Number(t.slice(0, 4)), m: Number(t.slice(5, 7)) - 1 });
  };

  const selectedDayBookings = useMemo(
    () => (calSelected ? (bookingsByDay.get(calSelected) ?? []) : []),
    [bookingsByDay, calSelected],
  );

  const hasActiveFilters =
    query.trim() !== "" ||
    statusFilter !== "" ||
    countryFilter !== "" ||
    fromDate !== "" ||
    toDate !== "";

  /* --------------------------------- render ------------------------------- */

  const selectCls =
    "h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[13px] text-ink outline-none transition-colors [color-scheme:dark] hover:border-white/25 focus:border-wa/60";

  const renderLeadsTab = () => {
    if (loading && leads.length === 0) return <SkeletonList />;
    if (loadError && leads.length === 0) {
      return (
        <div className="py-16 text-center">
          <p className="text-[13.5px] text-dim">
            No se pudieron cargar los registros.
          </p>
          <button
            type="button"
            onClick={() => void fetchLeads()}
            className={cn(
              "mt-4 inline-flex h-10 items-center rounded-full border border-white/15 px-5 text-[12px] font-bold uppercase tracking-wide text-ink transition-colors hover:border-wa/50 hover:text-wa",
              FOCUS_RING,
            )}
          >
            Reintentar
          </button>
        </div>
      );
    }

    return (
      <div>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim/60" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nombre, WhatsApp o email…"
              aria-label="Buscar leads"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 text-[13px] text-ink outline-none transition-colors placeholder:text-dim/60 focus:border-wa/60"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
            className={selectCls}
          >
            <option value="">Todas</option>
            <option value="QUALIFIED">Calificado</option>
            <option value="IN_PROGRESS">En progreso</option>
            <option value="DISQUALIFIED">Descartado</option>
          </select>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            aria-label="Filtrar por país"
            className={selectCls}
          >
            <option value="">Todos los países</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="Desde"
              className={cn(selectCls, "w-[135px]")}
            />
            <span className="text-[11px] text-dim/70">→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="Hasta"
              className={cn(selectCls, "w-[135px]")}
            />
          </div>
        </div>

        {/* Results count + active filter chips */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="text-[12px] text-dim">
            <span className="font-semibold text-ink">{filteredLeads.length}</span>{" "}
            {filteredLeads.length === 1 ? "lead" : "leads"}
          </p>
          {query.trim() !== "" && (
            <FilterChip
              label={`Búsqueda: “${query.trim()}”`}
              onClear={() => setQuery("")}
            />
          )}
          {statusFilter !== "" && (
            <FilterChip
              label={`Estado: ${
                statusFilter === "QUALIFIED"
                  ? "Calificado"
                  : statusFilter === "IN_PROGRESS"
                    ? "En progreso"
                    : "Descartado"
              }`}
              onClear={() => setStatusFilter("")}
            />
          )}
          {countryFilter !== "" && (
            <FilterChip
              label={`País: ${countryFilter}`}
              onClear={() => setCountryFilter("")}
            />
          )}
          {fromDate !== "" && (
            <FilterChip label={`Desde: ${fromDate}`} onClear={() => setFromDate("")} />
          )}
          {toDate !== "" && (
            <FilterChip label={`Hasta: ${toDate}`} onClear={() => setToDate("")} />
          )}
        </div>

        {/* Empty state */}
        {filteredLeads.length === 0 ? (
          <p className="py-14 text-center text-[13px] text-dim">
            No hay leads que coincidan con los filtros.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-white/8 md:block">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/8">
                    {[
                      "Nombre",
                      "WhatsApp",
                      "Negocio",
                      "País",
                      "Estado",
                      "Sesión",
                      "Creado",
                      "",
                    ].map((h, i) => (
                      <th
                        key={h || i}
                        scope="col"
                        className="whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-dim"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((l) => (
                    <Fragment key={l.id}>
                      <tr
                        onClick={() => toggleExpand(l.id)}
                        className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-3 py-3">
                          <div className="max-w-[200px] truncate text-[13.5px] font-semibold text-ink">
                            {l.name ?? "—"}
                          </div>
                          {l.email ? (
                            <div className="max-w-[200px] truncate text-[11px] text-dim">
                              {l.email}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-[13px] whitespace-nowrap">
                          {l.whatsapp ? (
                            <WaLink
                              whatsapp={l.whatsapp}
                              onNavigate={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="text-dim">—</span>
                          )}
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-3 text-[13px] text-ink/85">
                          {l.quiz?.businessType || "—"}
                        </td>
                        <td className="px-3 py-3 text-[13px] text-ink/85">
                          {l.country ?? "—"}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="px-3 py-3 text-[12.5px] whitespace-nowrap text-dim">
                          {l.sessionDate
                            ? formatSessionShort(l.sessionDate, l.sessionTime)
                            : "—"}
                        </td>
                        <td className="px-3 py-3 text-[12.5px] whitespace-nowrap text-dim">
                          {formatCreated(l.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            aria-label={
                              expandedId === l.id
                                ? "Ocultar detalles"
                                : "Ver detalles del lead"
                            }
                            aria-expanded={expandedId === l.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(l.id);
                            }}
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded-full text-dim transition-colors hover:bg-white/10 hover:text-ink",
                              FOCUS_RING,
                            )}
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                expandedId === l.id && "rotate-180",
                              )}
                            />
                          </button>
                        </td>
                      </tr>
                      {expandedId === l.id && (
                        <tr>
                          <td
                            colSpan={8}
                            className="border-b border-white/8 bg-panel-2/40 px-4 py-5"
                          >
                            <ExpandedDetails
                              lead={l}
                              onDelete={onDelete}
                              deleting={deletingId === l.id}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="mt-4 space-y-3 md:hidden">
              {filteredLeads.map((l) => (
                <article
                  key={l.id}
                  className="rounded-2xl border border-white/8 bg-panel/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-bold text-ink">
                        {l.name ?? "—"}
                      </p>
                      {l.email ? (
                        <p className="truncate text-[11.5px] text-dim">{l.email}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label={
                        expandedId === l.id
                          ? "Ocultar detalles"
                          : "Ver detalles del lead"
                      }
                      aria-expanded={expandedId === l.id}
                      onClick={() => toggleExpand(l.id)}
                      className={cn(
                        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-dim transition-colors hover:bg-white/10 hover:text-ink",
                        FOCUS_RING,
                      )}
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          expandedId === l.id && "rotate-180",
                        )}
                      />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-dim">
                        WhatsApp
                      </p>
                      <p className="mt-0.5 text-[12.5px]">
                        {l.whatsapp ? <WaLink whatsapp={l.whatsapp} /> : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-dim">
                        Negocio
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-ink/85">
                        {l.quiz?.businessType || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-dim">
                        País
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-ink/85">
                        {l.country ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-dim">
                        Estado
                      </p>
                      <p className="mt-0.5">
                        <StatusBadge status={l.status} />
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-dim">
                        Sesión
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-ink/85">
                        {l.sessionDate
                          ? formatSessionShort(l.sessionDate, l.sessionTime)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-dim">
                        Creado
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-ink/85">
                        {formatCreated(l.createdAt)}
                      </p>
                    </div>
                  </div>
                  {expandedId === l.id && (
                    <div className="mt-4 border-t border-white/8 pt-4">
                      <ExpandedDetails
                        lead={l}
                        onDelete={onDelete}
                        deleting={deletingId === l.id}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCalendarTab = () => {
    if (loading && leads.length === 0) return <SkeletonList />;
    return (
      <section aria-label="Calendario de sesiones">
        {/* Month navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Mes anterior"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-dim transition-colors hover:border-white/25 hover:text-ink",
                FOCUS_RING,
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-display min-w-[150px] text-center text-[15px] font-bold text-ink">
              {monthTitleOf(viewMonth.y, viewMonth.m)}
            </p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Mes siguiente"
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-dim transition-colors hover:border-white/25 hover:text-ink",
                FOCUS_RING,
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            className={cn(
              "inline-flex h-9 items-center rounded-full border border-white/10 px-4 text-[12px] font-semibold text-dim transition-colors hover:border-white/25 hover:text-ink",
              FOCUS_RING,
            )}
          >
            Hoy
          </button>
        </div>

        {/* Month grid */}
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-dim"
            >
              {wd}
            </div>
          ))}
          {monthGrid.map((cell) => {
            if (cell.day === 0) {
              return (
                <div
                  key={cell.key}
                  aria-hidden="true"
                  className="aspect-square rounded-xl"
                />
              );
            }
            const count = bookingsByDay.get(cell.key)?.length ?? 0;
            const selected = calSelected === cell.key;
            const isToday = cell.key === todayKey;
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setCalSelected(cell.key)}
                aria-pressed={selected}
                aria-label={formatLongDate(cell.key)}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-xl border transition-all duration-150",
                  selected
                    ? "border-wa/60 bg-wa/10"
                    : isToday
                      ? "border-white/20 bg-white/[0.015] hover:border-white/30"
                      : "border-white/8 bg-white/[0.015] hover:border-white/25",
                  FOCUS_RING,
                )}
              >
                <span
                  className={cn(
                    "text-[13px]",
                    selected ? "text-ink" : "text-ink/75",
                  )}
                >
                  {cell.day}
                </span>
                {count > 0 && (
                  <span className="absolute bottom-1.5 left-1/2 flex h-4 min-w-4 -translate-x-1/2 items-center justify-center rounded-full bg-wa px-1 text-[10px] font-bold text-[#03150c]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day sessions */}
        {calSelected && (
          <div className="mt-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-[15px] font-bold text-ink">
                {formatLongDate(calSelected)}
              </p>
              <p className="text-[12px] text-dim">
                {selectedDayBookings.length}{" "}
                {selectedDayBookings.length === 1 ? "sesión" : "sesiones"}
              </p>
            </div>
            {selectedDayBookings.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-dim">
                Sin sesiones este día.
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {selectedDayBookings.map((l) => (
                  <article
                    key={l.id}
                    className="flex items-center gap-3.5 rounded-2xl border border-white/8 bg-panel/60 p-4"
                  >
                    <span className="font-display shrink-0 rounded-lg border border-wa/25 bg-wa/10 px-2.5 py-1.5 text-[13px] font-bold whitespace-nowrap text-wa-bright">
                      {l.sessionTime ?? "—"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-ink">
                        {l.name ?? "Sin nombre"}
                      </p>
                      {l.whatsapp ? (
                        <p className="text-[13px]">
                          <WaLink whatsapp={l.whatsapp} />
                        </p>
                      ) : null}
                      {l.quiz?.businessType ? (
                        <p className="truncate text-[12px] text-dim">
                          {l.quiz.businessType}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge status={l.status} />
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <>
      {/* The gear ("tuerca") — placed and centered by the parent footer */}
      <button
        type="button"
        onClick={onGearClick}
        aria-label="Acceso administrador"
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-full text-dim/50 transition-colors hover:bg-white/[0.05] hover:text-ink",
          FOCUS_RING,
        )}
      >
        <Settings className="h-[18px] w-[18px]" />
      </button>

      {/* Gate modal */}
      {gateOpen && !unlocked && (
        <div
          className="animate-in fade-in-0 fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur"
          onClick={closeGate}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Acceso restringido"
            onClick={(e) => e.stopPropagation()}
            className="animate-in fade-in-0 zoom-in-95 relative w-full max-w-sm rounded-3xl border border-white/10 bg-panel p-7"
          >
            <button
              type="button"
              onClick={closeGate}
              aria-label="Cerrar"
              className={cn(
                "absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-dim transition-colors hover:bg-white/[0.06] hover:text-ink",
                FOCUS_RING,
              )}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-wa/25 bg-wa/10">
              <Lock className="h-5 w-5 text-wa" />
            </div>
            <h2 className="font-display mt-5 text-[19px] font-bold uppercase leading-tight tracking-[0.04em] text-ink">
              Acceso restringido
            </h2>
            <p className="mt-1.5 text-[12.5px] text-dim">
              Panel privado de administración
            </p>

            <form onSubmit={onGateSubmit} className="mt-6">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (gateError) setGateError(false);
                }}
                placeholder="Clave de acceso"
                aria-label="Clave de acceso"
                autoComplete="off"
                autoFocus
                className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-dim/60 focus:border-wa/60"
              />
              {gateError && (
                <p className="mt-3 rounded-xl border border-[#ff7d6e]/30 bg-[#ff7d6e]/[0.08] px-3.5 py-2.5 text-[12.5px] leading-snug text-[#ffa79b]">
                  Clave incorrecta. Inténtalo de nuevo.
                </p>
              )}
              <button
                type="submit"
                disabled={verifying}
                className={cn(
                  "mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-wa-bright text-[12.5px] font-bold uppercase tracking-[0.08em] text-[#03150c] transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-60",
                  FOCUS_RING,
                )}
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando…
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin panel */}
      {panelOpen && unlocked && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel de administración"
          className="animate-in fade-in-0 fixed inset-0 z-[200] overflow-y-auto bg-[#050708]/[0.985] backdrop-blur-sm"
        >
          <header className="sticky top-0 z-10 border-b border-white/8 bg-[#050708]/95 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-wa/25 bg-wa/10">
                  <Settings className="h-4 w-4 text-wa" />
                </div>
                <div className="min-w-0">
                  <p className="font-display truncate text-[13px] font-bold uppercase tracking-[0.08em] text-ink">
                    WHAPI — Panel de administración
                  </p>
                  <p className="text-[11px] text-dim">
                    Registros de leads · Sesiones agendadas
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void fetchLeads()}
                  disabled={loading}
                  aria-label="Actualizar datos"
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-dim transition-colors hover:border-white/25 hover:text-ink disabled:opacity-50",
                    FOCUS_RING,
                  )}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", loading && "animate-spin")}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Cerrar panel"
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-dim transition-colors hover:border-white/25 hover:text-ink",
                    FOCUS_RING,
                  )}
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6">
            {/* Transient delete feedback */}
            {deletedNotice !== null && (
              <div
                aria-live="polite"
                className="animate-in fade-in-0 mb-4 inline-flex items-center gap-2 rounded-full border border-wa/30 bg-wa/10 px-3.5 py-1.5 text-[12px] font-semibold text-wa-bright"
              >
                <Check className="h-3.5 w-3.5" />
                Lead eliminado{deletedNotice ? `: ${deletedNotice}` : ""}
              </div>
            )}

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              <KpiCard value={kpis.total} label="Total leads" />
              <KpiCard
                value={kpis.qualified}
                label="Calificados"
                valueClass="text-wa-bright"
              />
              <KpiCard
                value={kpis.inProgress}
                label="En progreso"
                valueClass="text-dim"
              />
              <KpiCard
                value={kpis.disqualified}
                label="Descartados"
                valueClass="text-gold"
              />
              <KpiCard value={kpis.booked} label="Sesiones agendadas" />
              <div className="col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-panel/60 p-4 sm:col-span-3 lg:col-span-5">
                <div>
                  <p className="font-display text-[15px] font-bold text-ink">
                    Tasa de calificación
                  </p>
                  <p className="mt-0.5 text-[10.5px] uppercase tracking-wider text-dim">
                    calificados vs descartados
                  </p>
                </div>
                <p className="font-display text-2xl font-bold text-wa-bright">
                  {kpis.rate}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6">
              <div
                role="tablist"
                aria-label="Vistas del panel"
                className="inline-flex gap-1.5"
              >
                {(
                  [
                    ["leads", "Leads"],
                    ["calendar", "Calendario"],
                  ] as Array<[Tab, string]>
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={tab === value}
                    onClick={() => setTab(value)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-colors",
                      tab === value
                        ? "border-wa/40 bg-wa/15 text-wa"
                        : "border-white/10 text-dim hover:border-white/25 hover:text-ink",
                      FOCUS_RING,
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="mt-5">
              {tab === "leads" ? renderLeadsTab() : renderCalendarTab()}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
