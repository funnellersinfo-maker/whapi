# Task 2 — full-stack-developer — Admin panel (API + AdminGear)

## Scope delivered
Exactly 2 files created (nothing else touched except this record and the worklog append):

1. `src/app/api/admin/leads/route.ts` — `export const runtime = 'nodejs'`
   - Auth for BOTH GET and DELETE: header `x-admin-key` must equal `process.env.ADMIN_KEY ?? 'WHAPI2027'`, else 401 `{ok:false,error:'unauthorized'}`.
   - GET: optional `limit` query (1–1000, default 500, clamped; non-numeric → 500). Leads ordered by createdAt DESC. `quiz` JSON string parsed to object (null/invalid → null). Serializes exactly: id, status, name, whatsapp, email, country, sessionDate, sessionTime, waMessage, quiz, createdAt (ISO), updatedAt (ISO).
   - DELETE: query `id`; missing → 400 `{ok:false,error:'invalid_id'}`; success → `{ok:true}`; try/catch → 500 `{ok:false,error:'server_error'}`.
   - Implementation note: uses `db.$queryRaw` with an explicit column list (incl. `country`) because the RUNNING dev server holds a stale in-memory Prisma client (started 19:56, client regenerated 22:15 when `country` was added) — `findMany` omitted the `country` key. Raw SELECT returns country in both stale and fresh states; createdAt/updatedAt arrive as Date and are normalized to ISO.

2. `src/components/admin/admin-panel.tsx` — `"use client"`, named export **`AdminGear`** (self-contained; main agent must render it in the footer, centered by parent).
   - Gear button ("tuerca"): 36px round ghost, lucide `Settings`, `text-dim/50 hover:text-ink`, aria-label="Acceso administrador".
   - Gate modal: Lock icon in wa-tinted square, "Acceso restringido", password input (landing-style, focus:border-wa/60), error "Clave incorrecta. Inténtalo de nuevo." (#ff7d6e tones), full-width h-12 rounded-full bg-wa-bright submit with spinner, X close, backdrop click closes. Verifies via `GET /api/admin/leads?limit=1` with the entered key; on success persists to sessionStorage `whapi-admin-key`, loads data, shows panel.
   - Silent verify on mount from sessionStorage (so next gear click goes straight to panel; invalid keys are purged).
   - Panel overlay (fixed inset-0 z-[200], bg-[#050708]/[0.985], backdrop-blur-sm, overflow-y-auto): body scroll lock + Escape close; sticky header (wa-tinted gear, "WHAPI — Panel de administración", sub "Registros de leads · Sesiones agendadas", RefreshCw spin-while-loading, X close).
   - KPI row: Total leads / Calificados (wa green) / En progreso (dim) / Descartados (gold) / Sesiones agendadas (sessionDate ≠ null) + wide "Tasa de calificación" card (QUALIFIED/(QUALIFIED+DISQUALIFIED), '—' when no closed leads).
   - Tabs Leads | Calendario (pill toggle, active bg-wa/15 text-wa border-wa/40).
   - Leads tab: filters (accent/case-insensitive search on name/whatsapp/email via NFD normalize, status select, unique-country select, desde/hasta date range on Bogotá date of createdAt) + active filter chips + count line; desktop table / mobile stacked cards; WhatsApp shown as wa.me link (digits stripped, 57 prefixed, target _blank); status badges (green/gold/neutral); Sesión "sáb, 10 oct · 10:30 AM" (UTC-noon anchor, es-CO); Creado "7 oct · 5:21 PM" (Bogotá); expandable per-lead view with ALL quiz answers (incl. automationTool in parens and budgetConfirmed labels), email/country, full waMessage in scrollable `<pre>`, and delete button (window.confirm → DELETE → removed from state + transient "Lead eliminado" notice). Empty state text per spec.
   - Calendar tab: month nav ‹ › + "Octubre 2026" (es-CO, manual capitalize) + Hoy; 7-col grid L M X J V S D (Monday-first), aspect-square cells, wa-green count dot, selected border-wa/60 bg-wa/10, today subtly outlined, other-month days invisible; initial selected day = earliest upcoming booked day (or today) with month synced; per-day session cards (time chip, name, wa link, business, status badge) sorted by parsed time; "Sin sesiones este día." empty state. All date math via `new Date(`${iso}T12:00:00Z`)` + ISO-string equality.
   - Loading skeletons, error + Reintentar, a11y (aria-labels, aria-expanded, role=dialog/tablist, aria-live notice, focus-visible rings). No blue/indigo anywhere; Spanish copy.

## Integration (for main agent)
```tsx
import { AdminGear } from "@/components/admin/admin-panel";
// render centered in footer, e.g.:
<div className="mt-6 flex justify-center"><AdminGear /></div>
```
Password: **WHAPI2027** (or `ADMIN_KEY` env).

## Verification results
- `bunx eslint src/app/api/admin/leads/route.ts src/components/admin/admin-panel.tsx` → exit 0, zero errors. `bunx tsc --noEmit` → zero errors in these files (project's 6 remaining tsc errors are pre-existing in other agents' files).
- curl vs running dev server: no key → **401**; `x-admin-key: WRONG` → **401**; `x-admin-key: WHAPI2027` → **200** `{ok:true,leads:[...2 leads...]}` (country key present, quiz parsed, DESC order correct); `?limit=1` → 1 lead; DELETE without id → **400** invalid_id; DELETE without key → **401**; DELETE wrong key → **401**.
- Lifecycle test: created throwaway lead via public POST /api/lead (visitorId `admin-agent-test-1`) → 200; DELETE via admin endpoint → **200 {ok:true}**; repeat DELETE → **500 server_error** (expected); final GET → exactly the 2 original leads (Julián QUALIFIED 2026-10-10 10:30 AM + DISQUALIFIED) — originals untouched.
- dev.log clean; `GET /` still 200.

## Warnings / notes
- The running dev server's in-memory Prisma client predates the `country` column; the public funnel API (/api/lead — owned by task 2-a, untouched) will keep writing country=NULL until the server restarts. My admin GET is immune (raw SELECT). After any restart everything aligns automatically.
- Do NOT touch prisma/schema.prisma or run db:push — already correct.
