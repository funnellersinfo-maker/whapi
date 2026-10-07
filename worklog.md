---

Task ID: 2-a
Agent: full-stack-developer
Task: Backend del quiz funnel (Prisma Lead model, API /api/lead, tracking/whatsapp/conversions libs)

Work Log:
- Inspected project state: worklog.md did not exist yet (this is the first entry); confirmed .env has DATABASE_URL=file:/home/z/my-project/db/custom.db, src/lib/db.ts exists with global PrismaClient singleton, and src/app/api/ contained only the default hello-world route.
- Replaced the User/Post demo models in prisma/schema.prisma with the Lead model (id cuid, visitorId unique, status default IN_PROGRESS, name/whatsapp/email/sessionDate/sessionTime/waMessage/quiz optional strings, createdAt/updatedAt).
- Ran `bun run db:push` — succeeded in 11ms; Prisma Client v6.19.2 regenerated automatically.
- Created src/lib/types.ts with BudgetConfirmed, QuizData, BookingData, LeadApiRequest shared types (no client/server-only code).
- Created src/lib/tracking.ts (client-safe): TRACKING constant (NEXT_PUBLIC_META_PIXEL_ID / NEXT_PUBLIC_WHATSAPP_NUMBER with 573112441018 fallback), global Window.fbq declaration, idempotent initPixel() that injects the standard Meta Pixel base code (fbq stub + fbevents.js script element, init + PageView) only when a pixel id exists, plus SSR-safe trackStandard() and trackCustom() wrappers.
- Created src/lib/whatsapp.ts (server-side): buildLeadMessage() producing the exact label/value WhatsApp format with emojis and blank line between blocks, Spanish session date via Intl.DateTimeFormat('es-CO', { weekday, day, month, timeZone: 'America/Bogota' }) (parsed at noon UTC so the calendar day is stable in Bogotá), em dash before sessionTime, "CONFIRMADO" budget block, "LEAD CALIFICADO" status block; buildWaUrl() returning https://wa.me/{number}?text={encoded}.
- Created src/lib/conversions.ts (server-side Meta Conversions API): reads META_CAPI_PIXEL_ID / META_CAPI_ACCESS_TOKEN, returns { sent:false, reason:'not_configured' } with a single informational console.log when not configured, otherwise POSTs to https://graph.facebook.com/v19.0/{pixelId}/events with the required event payload (event_name, event_time, crypto.randomUUID() event_id, action_source 'website', event_source_url, custom_data); never throws (try/catch → reason 'request_failed').
- Created src/app/api/lead/route.ts (runtime nodejs) implementing POST /api/lead with the full contract: visitorId validation (non-empty, trimmed, <=100 chars → 400 invalid_visitor), action 'progress' (upsert, quiz only), 'disqualified' (quiz required, upsert status DISQUALIFIED, fire-and-forget 'disqualified_lead' CAPI event), 'booked' (quiz+booking required; name >=2 chars; whatsapp digits-only with 57-prefix strip then /^3\d{9}$/ and storage formatted as '+57 3XX XXX XXXX'; optional email regex; sessionDate YYYY-MM-DD and non-empty sessionTime; waMessage built from formatted data; upsert status QUALIFIED; fire-and-forget 'Schedule' + 'appointment_booked'; returns waUrl), unknown action → 400 invalid_action, and a global try/catch → 500 server_error.
- Linted ONLY my owned files with `bunx eslint src/lib/types.ts src/lib/tracking.ts src/lib/whatsapp.ts src/lib/conversions.ts src/app/api/lead/route.ts` → exit code 0, zero errors/warnings.
- Smoke tested against the RUNNING dev server (port 3000) with curl: progress → {"ok":true} (HTTP 200, upsert created IN_PROGRESS row), booked → {"ok":true,"waUrl":"https://wa.me/573112441018?text=..."} with a byte-for-byte verified decoded message (EXACT_MATCH: true, no trailing whitespace/newline). Also verified error paths: invalid_visitor, invalid_quiz, invalid_booking, invalid_name, invalid_whatsapp, invalid_email, invalid_session, invalid_action all return the correct 400 payloads; disqualified action returned {"ok":true}.
- Verified DB rows via Prisma (QUALIFIED lead with name 'Juan Pérez', whatsapp '+57 311 244 1018', email, session fields, waMessage; DISQUALIFIED lead stored) and then cleaned all test rows with db.lead.deleteMany({}).
- Checked dev.log: all /api/lead requests 200/400 as expected, upserts firing ON CONFLICT DO UPDATE, CAPI events correctly logging 'not configured' (env vars absent) with no thrown errors.

Stage Summary:
- Files owned/created: prisma/schema.prisma (Lead model), src/lib/types.ts, src/lib/tracking.ts, src/lib/whatsapp.ts, src/lib/conversions.ts, src/app/api/lead/route.ts. No other files touched (frontend agent owns landing files).
- db push: SUCCESS (11ms, client regenerated, Lead table live in SQLite at db/custom.db).
- Lint: PASS (exit 0 on all six owned files).
- API contract: POST /api/lead { visitorId, action: 'progress' | 'disqualified' | 'booked', quiz?, booking? } → { ok: true } | { ok: true, waUrl } | 400 { ok:false, error: invalid_visitor | invalid_quiz | invalid_booking | invalid_name | invalid_whatsapp | invalid_email | invalid_session | invalid_action } | 500 { ok:false, error: server_error }. 'booked' additionally persists name, formatted '+57 3XX XXX XXXX' whatsapp, email, sessionDate/sessionTime, waMessage and fires Schedule + appointment_booked CAPI events fire-and-forget.
- Test results: progress 200, booked 200 with waUrl to 573112441018, decoded WhatsApp message matches the required format EXACTLY (verified byte-for-byte, includes 'miércoles, 10 de diciembre — 10:30 AM (Hora Colombia)'), all validation error paths correct, DB cleaned after tests.
- Frontend integration notes: use TRACKING/trackStandard/trackCustom from '@/lib/tracking' on the client; POST to '/api/lead' and window.open(waUrl) the returned waUrl for the booked action. Optional env vars for production tracking: NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_WHATSAPP_NUMBER, META_CAPI_PIXEL_ID, META_CAPI_ACCESS_TOKEN (all optional — everything degrades gracefully).

---

Task ID: 2-b
Agent: Z.ai Code (main agent)
Task: Frontend completo de la landing de ultra alta conversión (mobile-first, cinematográfica) + integración end-to-end

Work Log:
- Analicé la imagen de referencia con VLM (composición, texto, posiciones verticales exactas de cada elemento) e hice recortes quirúrgicos con sharp: hero (0–618px, problema+headline sin el CTA horneado) y visual de IA (705–1140px, para la sección de solución). Cada recorte se verificó con VLM (sin texto cortado, sin badges).
- Generé assets optimizados en /public/img: hero.avif (54KB), hero.webp, variantes 480w, ia-seccion.avif (47KB), og.jpg (1200x630) y placeholders blur base64.
- Task 2-a ejecutada en paralelo por subagent full-stack-developer (backend completo verificado arriba).
- Design system: globals.css con tokens (#050708 carbon, #25D366 wa, #00E676 wa-bright, #D8B25C gold, panels #101516/#171C1D), utilidades (glow-wa, glow-gold, text-glow-wa, animaciones hint-bob/float-y/pulse-dot), scrollbar custom verde, grain cinematográfico fijo, prefers-reduced-motion respetado.
- layout.tsx: fuentes Geist + Space Grotesk (display), metadata en español con OG image, lang="es-CO", viewport themeColor.
- src/lib/quiz-data.ts (8 preguntas exactas del brief + opciones), src/lib/calendar-utils.ts (días Bogotá UTC-anchored, sin domingos, 6 horarios, formatSessionDate es-CO).
- Componentes en src/components/landing/: bokeh (canvas partículas doradas/verdes sutiles navideñas), reveal, cta-button, section-heading, phone-frame, hero (imagen integrada con seam glow verde + CTA funcional + microcopy + hint animado), problem (chat en PhoneFrame + chips Visto→Sin seguimiento→Cliente perdido + punchline), solution (chips de capacidades + imagen IA con glow), quiz (máquina de estados: intro → 8 preguntas → filtro → analyzing → disqualified|calendar → form → success), system (16 capacidades en 3 grupos), whatsapp-official (chat animado Consulta→Cierre + 3 puntos), integrations (solo las 10 del brief), differentiator, no-monthly ($0/mes con transparencia), about (Julián Alejandro, monograma JA, quote), scarcity (gold, sin countdown falso), for-whom (2 tarjetas), faq (14 preguntas), final-cta, footer (mt-auto sticky), sticky-cta (aparece tras hero, se oculta durante quiz y tras finalizar), landing (ensamblado, footer sticky bottom con flex-col + mt-auto).
- Quiz UX: tarjetas grandes seleccionables con check verde animado y auto-avance 480ms, barra de progreso "DIAGNÓSTICO DE TU NEGOCIO — 10%..100%", Q1 con input libre + chips con filtro, Q3 multi-select (opción "sin tráfico" exclusiva), Q5 input condicional de herramienta, Q7 nota condicional para decisiones compartidas, Q8 filtro de inversión, pantalla filtro con copy exacto del brief, analyzing con checks secuenciales, calendario horizontal snap + slots + "Hora Colombia (GMT-5)", form con validación y formato 3XX XXX XXXX, success con confirmación por WhatsApp.
- Tracking integrado: initPixel+ViewContent al montar, quiz_started, quiz_completed, qualified_lead, disqualified_lead, calendar_viewed, appointment_booked, whatsapp_sent (custom) + Lead, Schedule, Contact, CompleteRegistration (standard). Sin IDs inventados: todo vía NEXT_PUBLIC_META_PIXEL_ID / NEXT_PUBLIC_WHATSAPP_NUMBER.
- Persistencia: cada respuesta hace POST progress (visitorId en localStorage), disqualified y booked persisten el quiz completo.
- BUG CRÍTICO ENCONTRADO Y CORREGIDO: el redirect de wa.me corrompía los emojis del mensaje (U+FFFD). Cambié buildWaUrl para enlazar directo a api.whatsapp.com/send (verificado: URL llega con %F0%9F%9A%80 intacto, mensaje decodificado perfecto con todos los emojis).
- Fixes de verificación: import Reveal faltante, avatar del PhoneFrame → icono, capitalize CSS de fechas (ortografía española "8 de octubre"), sticky CTA con backdrop-blur y padding inferior del footer, devIndicators desactivado.
- Verificación end-to-end con agent-browser (390px): CTA hero→quiz, flujo completo de 8 preguntas, camino negativo (No por ahora → pantalla elegante sin calendario, lead DISQUALIFIED en DB), camino positivo (filtro→analyzing→calendario→form→reserva→success), WhatsApp se abre automáticamente con mensaje estructurado perfecto, DB con lead QUALIFIED completo. FAQ interactivo, sticky CTA visible/oculto correcto, 360px sin overflow, desktop 1440px sin scroll horizontal ni defectos (12 screenshots verificados con VLM).
- Lint final: PASS (0 errores). DB de pruebas limpiada (0 leads). Dev server funcionando sin errores en dev.log.

Stage Summary:
- Landing 100% operativa en / (única ruta visible): DOLOR → IDENTIFICACIÓN → CURIOSIDAD → SOLUCIÓN → DIAGNÓSTICO → FILTRO → CALIFICACIÓN → CALENDARIO → WHATSAPP implementado completo.
- Leads calificados reservan sesión (nombre + WhatsApp obligatorio, email opcional) y el mensaje estructurado llega a +57 311 244 1018 con emojis Unicode estándar intactos vía api.whatsapp.com directo.
- Leads no calificados NO pueden reservar: pantalla elegante + CTA secundario a la sección del sistema.
- Variables configurables sin IDs inventados: NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_WHATSAPP_NUMBER, META_CAPI_PIXEL_ID, META_CAPI_ACCESS_TOKEN.
- Performance: hero AVIF 54KB con blur placeholder y fetchPriority high, lazy loading bajo el fold, animaciones ligeras, sin scroll horizontal en 360/390/1440px.

---

Task ID: 2
Agent: full-stack-developer
Task: Panel privado de administración (API /api/admin/leads + componente AdminGear con tuerca, gate de clave, tabla de leads y calendario)

Work Log:
- Leí worklog.md y el estado del proyecto: funnel completo en / (tarea 2-a backend, 2-b frontend), Lead model en SQLite con columna `country` ya agregada al schema y a la DB, dev server corriendo en :3000, 2 leads reales de prueba en DB (Julián QUALIFIED 2026-10-10 10:30 AM + 1 DISQUALIFIED).
- Creé src/app/api/admin/leads/route.ts (runtime nodejs): auth por header `x-admin-key` === process.env.ADMIN_KEY ?? 'WHAPI2027' para AMBOS métodos (401 {ok:false,error:'unauthorized'} si falla). GET con query opcional `limit` (1–1000, default 500, clamp + fallback a 500 si no es numérico), leads ordenados por createdAt DESC, quiz parseado de JSON string a objeto (tolerante a null/inválido → null), serialización exacta: id, status, name, whatsapp, email, country, sessionDate, sessionTime, waMessage, quiz, createdAt/updatedAt ISO. DELETE con query `id` (400 invalid_id si falta → try/catch → 500 server_error).
- DECISIÓN TÉCNICA IMPORTANTE: el dev server arrancó a las 19:56 pero el client de Prisma fue regenerado a las 22:15 (cuando se agregó `country`), así que el PrismaClient en memoria del proceso NO conoce la columna country → `db.lead.findMany()` devolvía leads SIN la clave country (undefined → omitida del JSON). Como no puedo reiniciar el dev server, implementé el GET con `db.$queryRaw<RawLeadRow[]>` (SELECT explícito de todas las columnas incluyendo country, LIMIT parametrizado) — verificado: funciona con el client en memoria viejo Y con el nuevo; createdAt/updatedAt llegan como Date y se normalizan con .toISOString(). Tras cualquier reinicio futuro del dev server, el raw query sigue siendo 100% equivalente.
- Creé src/components/admin/admin-panel.tsx ("use client") con el named export `AdminGear` (self-contained, sin tocar footer/landing/page — el agente principal lo integra):
  - Tuerca: botón redondo ghost h-9 w-9 con Settings (lucide), text-dim/50 hover:text-ink, aria-label="Acceso administrador", inline-flex (el padre lo centra).
  - Gate modal (z-[200], bg-black/80 backdrop-blur): icono Lock en cuadrado wa-tinted, "Acceso restringido" (font-display bold uppercase), "Panel privado de administración", input password h-12 estilo landing (focus:border-wa/60), error "Clave incorrecta. Inténtalo de nuevo." en tonos #ff7d6e, botón full-width h-12 rounded-full bg-wa-bright text-[#03150c] con spinner, X arriba a la derecha, click en backdrop cierra. Al submit: GET /api/admin/leads?limit=1 con la clave ingresada → 200 = unlocked + persistencia en sessionStorage('whapi-admin-key') + carga de datos + abre panel; 401 = error.
  - Verificación silenciosa al montar: si existe clave en sessionStorage, GET limit=1 → si es válida unlocked=true (el siguiente click en la tuerca va directo al panel); si no, se limpia.
  - Panel full-screen (fixed inset-0 z-[200] bg-[#050708]/[0.985] backdrop-blur-sm overflow-y-auto): header sticky con engranaje wa-tinted + "WHAPI — Panel de administración" + sub "Registros de leads · Sesiones agendadas" + botones RefreshCw (gira mientras carga) y X; bloqueo de scroll del body (overflow=hidden + restore) y cierre con Escape.
  - KPIs (grid-cols-2 sm:grid-cols-3 lg:grid-cols-5): Total leads, Calificados (verde wa), En progreso (dim), Descartados (gold), Sesiones agendadas (sessionDate ≠ null) + tarjeta ancha "Tasa de calificación" = QUALIFIED/(QUALIFIED+DISQUALIFIED) con sub "calificados vs descartados" ('—' si denominador 0).
  - Tabs Leads/Calendario (pills, activo: bg-wa/15 text-wa border-wa/40).
  - Leads: filtros (búsqueda con normalización NFD sin acentos case-insensitive sobre nombre/whatsapp/email, select de estado, select de países únicos de los datos, rango desde/hasta sobre fecha Bogotá de createdAt) + chips de filtros activos con X para limpiar + contador; tabla en md+ (Nombre+email, WhatsApp como link wa.me con strip de no-dígitos + prefijo 57, Negocio, País, badge de estado, Sesión "sáb, 10 oct · 10:30 AM" con ancla UTC mediodía, Creado "7 oct · 5:21 PM" Bogotá, chevron expandible) y tarjetas apiladas en mobile; vista expandida con TODAS las respuestas del quiz (incluye automationTool entre paréntesis, budgetConfirmed → Confirmado/Puede reunirlo/No por ahora), email + país si existen, waMessage completo en pre scrollable y botón "Eliminar registro" (Trash2, confirm de window, DELETE con clave, feedback inline transitorio "Lead eliminado" 2.6s). Estado vacío "No hay leads que coincidan con los filtros."
  - Calendario tipo Calendly: navegación ‹ › + "Octubre 2026" (es-CO, capitalize manual) + botón Hoy libre a cualquier mes; grid 7 columnas L M X J V S D (lunes primero), celdas aspect-square con punto verde wa + contador de sesiones, día seleccionado border-wa/60 bg-wa/10, hoy con borde sutil, días de otros meses invisibles; día inicial = reserva futura más próxima (o hoy, mes sincronizado a ese día); lista de sesiones del día seleccionado (chip de hora wa-tinted + nombre + link WhatsApp + negocio + badge) ordenadas cronológicamente (parser propio de "10:30 AM"), vacío "Sin sesiones este día."; todas las fechas construidas con ancla T12:00:00Z y comparadas por string ISO YYYY-MM-DD.
  - Accesibilidad: aria-labels en todos los botones iconográficos, aria-expanded en expandibles, role=dialog/tablist/tab/aria-selected, aria-live en el aviso de eliminación, focus-visible ring wa en todos los interactivos. Sin azules/indigos: solo paleta wa/gold/carbon + #ff7d6e para errores.
- Lint: `bunx eslint src/app/api/admin/leads/route.ts src/components/admin/admin-panel.tsx` → EXIT 0, cero errores. `bunx tsc --noEmit` → cero errores en mis archivos (los 6 errores que reporta el proyecto son preexistentes de otros archivos: examples/, skills/, api/lead/route.ts y quiz.tsx, no tocados por mí).
- Curl sobre el dev server corriendo: GET sin clave → 401; con x-admin-key: WRONG → 401; con WHAPI2027 → 200 {ok:true,leads:[...]} con 2 leads (country incluido, quiz parseado, createdAt DESC correcto: DISQUALIFIED 21:57 antes de QUALIFIED 21:54); limit=1 → 1 lead; DELETE sin id → 400 invalid_id; DELETE sin clave → 401; DELETE con clave equivocada → 401.
- Test completo del ciclo de vida: creé lead desechable por la API pública (visitorId admin-agent-test-1, action progress) → 200; lo borré con DELETE /api/admin/leads?id=... → 200 {ok:true}; segundo DELETE del mismo id → 500 server_error (comportamiento esperado del try/catch); lista final → exactamente los 2 leads originales intactos (verificado también directo en SQLite).
- dev.log limpio: solo requests con los códigos esperados (200/400/401/500 según el caso), sin errores de compilación de mis archivos; GET / sigue en 200.

Stage Summary:
- Archivos creados (ÚNICOS modificados): src/app/api/admin/leads/route.ts y src/components/admin/admin-panel.tsx. Export nombrado: `AdminGear` (src/components/admin/admin-panel.tsx). Ningún otro archivo tocado.
- API: GET/DELETE /api/admin/leads con auth x-admin-key (ADMIN_KEY env con fallback 'WHAPI2027'). GET → {ok:true,leads:[{id,status,name,whatsapp,email,country,sessionDate,sessionTime,waMessage,quiz,createdAt,updatedAt}]} (limit 1–1000 default 500, createdAt DESC). DELETE ?id= → {ok:true} | 400 invalid_id | 500 server_error | 401 sin clave válida.
- Integración pendiente (agente principal): importar `AdminGear` desde "@/components/admin/admin-panel" y renderizarla en el footer (centrada, p. ej. dentro de un div flex justify-center tras el copyright). Contraseña: WHAPI2027 (o env ADMIN_KEY).
- Nota para el agente principal: el PrismaClient en memoria del dev server actual no conoce la columna `country` (client regenerado después del arranque); por eso el GET usa $queryRaw con SELECT explícito — el endpoint ya devuelve country correctamente SIN necesidad de reiniciar el dev server. El funnel público /api/lead (client viejo en memoria) seguirá guardando country=null hasta el próximo reinicio del server; con el reinicio, todo queda alineado automáticamente.
- Verificación: lint 0 errores, tsc 0 errores en mis archivos, curl 401/401/200 + ciclo create/DELETE verificado, DB con exactamente los 2 leads originales de prueba intactos.

---
Task ID: 3
Agent: Z.ai Code (main agent)
Task: Correcciones solicitadas por Julián + panel admin + auditoría de conversión

Work Log:
- Esquema Prisma: añadido campo `country` a Lead + `bun run db:push` (cliente regenerado). Dev server reiniciado para recargar el cliente Prisma.
- Foto personal: analizada con VLM (bbox facial), recorte moderado 680×680 con sharp (rostro ~36% del encuadre, no muy cercano), export AVIF 28KB + WebP 39KB + JPEG fallback, verificado con VLM (rostro completo, encuadre moderado, sin pixelado). Integrada en about.tsx como círculo HD 128px con ring verde, glow y punto de estado.
- about.tsx: chip "Especialización reciente en IA aplicada" → chip dorado destacado "Certificación Meta Partner" con BadgeCheck.
- integrations.tsx: "Droppy" → "Dropi".
- system.tsx: "Trabaja múltiples canales" → "Trabaja en tiempo real" (grupo Convierte; evita malentendido de que responde Instagram/Messenger).
- Formulario de reserva: nuevo campo obligatorio "¿A qué se dedica tu negocio?" (select con las 16 opciones de Q1, preseleccionado si el quiz coincide); nombre/WhatsApp/email intactos; error invalid_business; booking.businessType sincronizado en quiz guardado (valor autoritativo del formulario).
- Captura de país: quiz envía tz + navigator.languages; lib/geo.ts (TZ→país + fallback por región de idioma); /api/lead persiste country en progress/disqualified/booked.
- whatsapp.ts: línea 🏢 Negocio usa booking.businessType (formulario) con fallback al quiz.
- Pantalla de descarte: botón adicional "Sígueme en Instagram" → https://www.instagram.com/julian_alejandro_morales/ (target _blank).
- Pantalla de éxito: enlace "Agregar a mi calendario" (Google Calendar, 30 min, tz America/Bogota) vía googleCalendarUrl() en calendar-utils.ts.
- Footer: tuerca AdminGear (aria-label "Acceso administrador") centrada bajo el copyright.
- Borradas reservas de prueba de la DB (Julián 10-oct 10:30 AM QUALIFIED + test DISQUALIFIED).
- Panel admin (Task ID 2, subagente full-stack-developer): /api/admin/leads GET/DELETE con x-admin-key WHAPI2027 (env ADMIN_KEY opcional) + admin-panel.tsx (gate, KPIs, tabla/cards, filtros, respuestas quiz, waMessage, delete, calendario estilo Calendly). Integrado en footer.
- Verificación end-to-end con agent-browser (390/360/1440px): funnel completo positivo (quiz 8 preguntas → filtro → calendario → formulario con select → reserva → WhatsApp con mensaje estructurado, emojis intactos, "Negocio: Turismo" del formulario), camino negativo (pantalla elegante + Instagram), panel admin (clave incorrecta → error; WHAPI2027 → KPIs, búsqueda, expansión, delete con confirm, calendario con día seleccionable), country="Colombia" con tz America/Bogota vía curl. Sin overflow horizontal. Lint 0 errores. DB final: 0 leads (limpia).
- Nota: warning de hidratación en dev por radix Accordion (FAQ) — preexistente, benigno, no aparece en producción.

Stage Summary:
- Todas las correcciones del usuario implementadas y verificadas en navegador: DROPI, "Trabaja en tiempo real", foto HD moderada con Certificación Meta Partner, select de negocio en formulario, país capturado, Instagram en descarte, reservas de prueba borradas.
- Panel admin privado 100% funcional: tuerca al final del sitio → clave WHAPI2027 → leads + respuestas + calendario + filtros (nombre, estado, país, fechas) + totales + eliminación.
- Auditoría de conversión aplicada: Google Calendar en success (reduce no-shows), retención por Instagram en descarte, badge Meta Partner como señal de confianza, preselección de negocio (menos fricción).
- Variables: NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_WHATSAPP_NUMBER, META_CAPI_PIXEL_ID, META_CAPI_ACCESS_TOKEN, ADMIN_KEY (opcional, default WHAPI2027).
