"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeAlert,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Instagram,
  Loader2,
  MessageCircle,
  MoonStar,
  ShieldCheck,
} from "lucide-react";
import {
  BUSINESS_SUGGESTIONS,
  FILTER_OPTIONS,
  NO_TRAFFIC_OPTION,
  QUESTIONS,
} from "@/lib/quiz-data";
import {
  SESSION_SLOTS,
  formatSessionDate,
  getUpcomingDays,
  googleCalendarUrl,
} from "@/lib/calendar-utils";
import { initPixel, trackCustom, trackStandard } from "@/lib/tracking";
import { captureUtm } from "@/lib/utm";
import { buildLeadMessage, buildWaUrl } from "@/lib/whatsapp";
import type { BudgetConfirmed, BookingData, QuizData } from "@/lib/types";
import { CtaButton } from "./cta-button";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

type Step =
  | { kind: "intro" }
  | { kind: "question"; index: number }
  | { kind: "filter" }
  | { kind: "analyzing" }
  | { kind: "disqualified" }
  | { kind: "calendar" }
  | { kind: "form" }
  | { kind: "success"; waUrl: string };

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: 26 * dir }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -26 * dir }),
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_name: "Escribe tu nombre para continuar.",
  invalid_whatsapp: "Escribe un número de WhatsApp válido (10 dígitos, empieza por 3).",
  invalid_email: "Revisa tu email o déjalo vacío.",
  invalid_business: "Selecciona a qué se dedica tu negocio.",
  invalid_session: "Selecciona la fecha y hora de tu sesión.",
};

function progressOf(step: Step): number {
  switch (step.kind) {
    case "intro":
      return 0;
    case "question":
      return (step.index + 1) * 10;
    case "filter":
      return 90;
    default:
      return 100;
  }
}

function OptionCard({
  label,
  selected,
  locked,
  onClick,
}: {
  label: string;
  selected: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={locked}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-[15px] text-left transition-all duration-200",
        selected
          ? "border-wa/70 bg-wa/[0.09] shadow-[0_0_28px_-8px_rgba(0,230,118,0.5)]"
          : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]"
      )}
    >
      <span
        className={cn(
          "text-[14.5px] font-medium leading-snug",
          selected ? "text-ink" : "text-ink/85"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
          selected ? "border-wa bg-wa text-[#03150c]" : "border-white/15 text-transparent"
        )}
      >
        <motion.span
          initial={false}
          animate={selected ? { scale: 1 } : { scale: 0.3 }}
          transition={{ type: "spring", stiffness: 500, damping: 26 }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
        </motion.span>
      </span>
    </motion.button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.1em] text-dim">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Quiz() {
  const [step, setStep] = useState<Step>({ kind: "intro" });
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizData>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [businessText, setBusinessText] = useState("");
  const [toolText, setToolText] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [form, setForm] = useState({ name: "", whatsapp: "", email: "" });
  const [businessSel, setBusinessSel] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [waSent, setWaSent] = useState(false);

  const timers = useRef<number[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const calendarViewed = useRef(false);

  const days = useMemo(() => getUpcomingDays(21), []);

  useEffect(() => {
    captureUtm();
    initPixel();
    trackStandard("ViewContent", { content_name: "landing_quiz_view" });
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const scrollToCard = useCallback(() => {
    requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  }, []);

  const go = useCallback(
    (next: Step) => {
      setDir(1);
      setPending(null);
      setStep(next);
      scrollToCard();
    },
    [scrollToCard]
  );

  const back = useCallback(() => {
    setDir(-1);
    setPending(null);
    if (step.kind === "question" && step.index > 0) {
      setStep({ kind: "question", index: step.index - 1 });
    } else if (step.kind === "filter") {
      setStep({ kind: "question", index: QUESTIONS.length - 1 });
    } else if (step.kind === "form") {
      setStep({ kind: "calendar" });
    }
    scrollToCard();
  }, [step, scrollToCard]);

  const advanceFrom = useCallback(
    (index: number) => {
      if (index + 1 >= QUESTIONS.length) {
        trackCustom("quiz_completed");
        setStep({ kind: "filter" });
      } else {
        setStep({ kind: "question", index: index + 1 });
      }
      setDir(1);
      setPending(null);
      scrollToCard();
    },
    [scrollToCard]
  );

  const onSingle = useCallback(
    (field: string, value: string) => {
      if (pending || step.kind !== "question") return;
      setPending(value);
      const updated = { ...answers, [field]: value } as Partial<QuizData>;
      setAnswers(updated);

      if (field === "automationPrev") {
        if (value !== "No, sería la primera vez") return; // reveal optional input
      } else if (field === "decisionMaker") {
        if (value !== "Yo tomo la decisión") return; // reveal note
      }
      schedule(() => advanceFrom(step.index), 480);
    },
    [advanceFrom, answers, pending, schedule, step]
  );

  const onContinueQuestion = useCallback(() => {
    if (step.kind !== "question") return;
    const q = QUESTIONS[step.index];
    if (q.id === "businessType") {
      const value = businessText.trim();
      if (value.length < 2) return;
      setAnswers({ ...answers, businessType: value });
    } else if (q.id === "trafficSources") {
      if (multi.length === 0) return;
      setAnswers({ ...answers, trafficSources: multi });
    } else if (q.id === "automationPrev") {
      setAnswers({ ...answers, automationTool: toolText.trim() || undefined });
    }
    advanceFrom(step.index);
  }, [advanceFrom, answers, businessText, multi, step, toolText]);

  const toggleMulti = useCallback((opt: string) => {
    setMulti((prev) => {
      if (opt === NO_TRAFFIC_OPTION) {
        return prev.includes(opt) ? [] : [opt];
      }
      const base = prev.filter((x) => x !== NO_TRAFFIC_OPTION);
      return base.includes(opt) ? base.filter((x) => x !== opt) : [...base, opt];
    });
  }, []);

  const onFilter = useCallback(
    (value: BudgetConfirmed) => {
      if (pending) return;
      setPending(value);
      const updated = { ...answers, budgetConfirmed: value };
      setAnswers(updated);
      if (value === "NO_POR_AHORA") {
        trackCustom("disqualified_lead");
        try {
          window.dispatchEvent(new Event("landing:quiz-completed"));
        } catch {
          /* noop */
        }
        schedule(() => go({ kind: "disqualified" }), 650);
      } else {
        trackCustom("qualified_lead");
        trackStandard("CompleteRegistration");
        schedule(() => go({ kind: "analyzing" }), 650);
      }
    },
    [answers, go, pending, schedule]
  );

  useEffect(() => {
    if (step.kind === "analyzing") {
      const t = window.setTimeout(() => {
        setStep({ kind: "calendar" });
        scrollToCard();
      }, 2750);
      timers.current.push(t);
      return () => window.clearTimeout(t);
    }
    if (step.kind === "calendar" && !calendarViewed.current) {
      calendarViewed.current = true;
      trackCustom("calendar_viewed");
    }
  }, [step, scrollToCard]);

  const formatWa = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 10);
    const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean);
    return parts.join(" ");
  };

  const onBook = useCallback(() => {
    setFormError("");
    const name = form.name.trim();
    const digits = form.whatsapp.replace(/\D/g, "");
    const email = form.email.trim();
    if (name.length < 2) {
      setFormError(ERROR_MESSAGES.invalid_name);
      return;
    }
    if (!/^3\d{9}$/.test(digits)) {
      setFormError(ERROR_MESSAGES.invalid_whatsapp);
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError(ERROR_MESSAGES.invalid_email);
      return;
    }
    if (!businessSel) {
      setFormError(ERROR_MESSAGES.invalid_business);
      return;
    }
    if (!sessionDate || !sessionTime) {
      setFormError(ERROR_MESSAGES.invalid_session);
      return;
    }
    setSubmitting(true);
    const booking: BookingData = {
      name,
      whatsapp: `+57 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`,
      email,
      businessType: businessSel,
      sessionDate,
      sessionTime,
    };
    const waUrl = buildWaUrl(buildLeadMessage(answers as QuizData, booking));
    trackCustom("appointment_booked");
    // "Cliente potencial" (Lead) — dispara en el momento exacto en que la
    // reserva se confirma y se abre WhatsApp con el mensaje estructurado.
    trackStandard("Lead", {
      content_name: "sesion_diagnostico_whatsapp",
    });
    trackStandard("Schedule", { content_name: "sesion_diagnostico" });
    try {
      window.dispatchEvent(new Event("landing:booking-complete"));
    } catch {
      /* noop */
    }
    setStep({ kind: "success", waUrl });
    scrollToCard();
    try {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch {
      /* popup blocked: user has the button */
    }
    setSubmitting(false);
  }, [answers, businessSel, form, scrollToCard, sessionDate, sessionTime]);

  const onConfirmWhatsapp = useCallback(() => {
    if (step.kind !== "success") return;
    if (!waSent) {
      setWaSent(true);
      trackCustom("whatsapp_sent");
      trackStandard("Contact");
    }
    window.open(step.waUrl, "_blank", "noopener,noreferrer");
  }, [step, waSent]);

  const pct = progressOf(step);

  const wrap = (key: string, children: ReactNode) => (
    <motion.div
      key={key}
      custom={dir}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );

  const suggestions = useMemo(() => {
    const q = (businessText ?? "").trim().toLowerCase();
    const norm = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    if (!q) return BUSINESS_SUGGESTIONS.slice(0, 8);
    return BUSINESS_SUGGESTIONS.filter((s) => norm(s).includes(norm(q))).slice(0, 8);
  }, [businessText]);

  const renderStep = (): ReactNode => {
    switch (step.kind) {
      case "intro":
        return wrap(
          "intro",
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-wa/25 bg-wa/10">
              <Clock className="h-6 w-6 text-wa" />
            </div>
            <h3 className="font-display mt-5 text-[24px] font-bold uppercase leading-tight text-ink">
              Diagnóstico de tu negocio
            </h3>
            <p className="mt-3 max-w-xs text-[14.5px] leading-relaxed text-dim">
              8 preguntas rápidas para saber si tu negocio es candidato a este
              sistema.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11.5px] text-dim">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <Clock className="h-3.5 w-3.5" /> Menos de 60 segundos
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Sin compromiso
              </span>
            </div>
            <div className="mt-8 w-full">
              <CtaButton
                onClick={() => {
                  trackCustom("quiz_started");
                  go({ kind: "question", index: 0 });
                }}
              >
                Comenzar diagnóstico
              </CtaButton>
            </div>
          </div>
        );

      case "question": {
        const q = QUESTIONS[step.index];
        return wrap(
          `q-${step.index}`,
          <div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-dim transition-colors hover:text-ink"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Atrás
              </button>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-dim">
                Pregunta {step.index + 1} de {QUESTIONS.length}
              </span>
            </div>
            <h3 className="font-display mt-4 text-[20px] font-bold leading-[1.18] text-ink">
              {q.title}
            </h3>
            {q.helper ? (
              <p className="mt-2 text-[13px] leading-relaxed text-dim">{q.helper}</p>
            ) : null}

            {q.kind === "text" ? (
              <div className="mt-5 space-y-4">
                <input
                  value={businessText}
                  onChange={(e) => setBusinessText(e.target.value)}
                  placeholder="Ej: tienda de ropa, barbería, consultora…"
                  maxLength={60}
                  className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-dim/60 focus:border-wa/60"
                />
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBusinessText(s)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[12px] transition-colors",
                        businessText === s
                          ? "border-wa/60 bg-wa/10 text-ink"
                          : "border-white/10 bg-white/[0.03] text-ink/75 hover:border-wa/40 hover:text-ink"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <CtaButton
                  size="md"
                  dimmed={businessText.trim().length < 2}
                  onClick={onContinueQuestion}
                >
                  Continuar
                </CtaButton>
              </div>
            ) : null}

            {q.kind === "single" ? (
              <div className="mt-5 space-y-2.5">
                {q.options?.map((opt) => (
                  <OptionCard
                    key={opt}
                    label={opt}
                    selected={pending === opt || answers[q.id] === opt}
                    locked={pending !== null}
                    onClick={() => onSingle(q.id, opt)}
                  />
                ))}
              </div>
            ) : null}

            {q.kind === "multi" ? (
              <div>
                <div className="mt-5 space-y-2.5">
                  {q.options?.map((opt) => (
                    <OptionCard
                      key={opt}
                      label={opt}
                      selected={multi.includes(opt)}
                      locked={false}
                      onClick={() => toggleMulti(opt)}
                    />
                  ))}
                </div>
                <div className="mt-5">
                  <CtaButton
                    size="md"
                    dimmed={multi.length === 0}
                    onClick={onContinueQuestion}
                  >
                    {multi.length === 0 ? "Selecciona al menos una" : "Continuar"}
                  </CtaButton>
                </div>
              </div>
            ) : null}

            {q.id === "automationPrev" &&
            pending &&
            pending !== "No, sería la primera vez" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mt-5">
                  <Field label="¿Qué herramienta o sistema utilizaste? (opcional)">
                    <input
                      value={toolText}
                      onChange={(e) => setToolText(e.target.value)}
                      placeholder="Ej: chatbot, CRM, automatización…"
                      maxLength={80}
                      className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-dim/60 focus:border-wa/60"
                    />
                  </Field>
                  <div className="mt-4">
                    <CtaButton size="md" onClick={onContinueQuestion}>
                      Continuar
                    </CtaButton>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {q.id === "decisionMaker" && pending && pending !== "Yo tomo la decisión" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mt-5 rounded-2xl border border-wa/25 bg-wa/[0.07] p-4">
                  <p className="text-[13.5px] leading-relaxed text-ink">
                    Perfecto. Para aprovechar realmente la sesión, esa persona
                    también deberá estar presente en la reunión.
                  </p>
                </div>
                <div className="mt-4">
                  <CtaButton size="md" onClick={onContinueQuestion}>
                    Continuar
                  </CtaButton>
                </div>
              </motion.div>
            ) : null}
          </div>
        );
      }

      case "filter":
        return wrap(
          "filter",
          <div>
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-dim transition-colors hover:text-ink"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Atrás
            </button>
            <div className="mt-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10">
                <BadgeAlert className="h-4.5 w-4.5 text-gold" />
              </span>
              <h3 className="font-display text-[18px] font-bold uppercase leading-tight text-gold">
                Importante antes de continuar
              </h3>
            </div>
            <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-ink/85">
              <p>
                La implementación más básica parte desde{" "}
                <strong className="text-ink">$1.300.000 COP</strong>.
              </p>
              <p>
                Tenemos diferentes configuraciones y niveles de implementación
                según las necesidades del negocio.
              </p>
              <p>
                Si después del diagnóstico vemos que podemos ayudarte, en la
                sesión te mostraremos qué tendría sentido implementar y cómo
                sería el proceso.
              </p>
            </div>
            <p className="font-display mt-6 text-[16.5px] font-semibold leading-snug text-ink">
              ¿Cuentas actualmente con este presupuesto o puedes reunirlo para
              implementar el sistema si vemos que es adecuado para tu negocio?
            </p>
            <div className="mt-5 space-y-2.5">
              {FILTER_OPTIONS.map((o) => (
                <OptionCard
                  key={o.value}
                  label={o.label}
                  selected={pending === o.value}
                  locked={pending !== null}
                  onClick={() => onFilter(o.value)}
                />
              ))}
            </div>
          </div>
        );

      case "analyzing":
        return wrap(
          "analyzing",
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-wa/20" />
              <Loader2 className="h-8 w-8 animate-spin text-wa" />
            </div>
            <h3 className="font-display mt-6 text-[20px] font-bold uppercase leading-tight text-ink">
              Analizando tus respuestas
            </h3>
            <div className="mt-6 w-full max-w-xs space-y-2.5 text-left">
              {[
                "Negocio verificado",
                "Conversaciones y tráfico detectados",
                "Oportunidad de automatización identificada",
              ].map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.55, duration: 0.45 }}
                  className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5"
                >
                  <Check className="h-4 w-4 shrink-0 text-wa" strokeWidth={3} />
                  <span className="text-[13px] text-ink/90">{label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "disqualified":
        return wrap(
          "disqualified",
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04]">
              <MoonStar className="h-6 w-6 text-gold" />
            </div>
            <h3 className="font-display mt-5 text-[21px] font-bold uppercase leading-tight text-ink">
              Probablemente todavía no sea el momento adecuado.
            </h3>
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-dim">
              Preferimos ser transparentes contigo: esta sesión está pensada para
              negocios que están listos para implementar una solución si
              encontramos una oportunidad real de mejora.
            </p>
            <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-dim">
              Puedes seguir aprendiendo sobre automatización y volver cuando
              estés listo.
            </p>
            <div className="mt-8 w-full max-w-xs space-y-3">
              <a
                href="#sistema"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-wa/40 bg-wa/[0.06] px-6 text-[12.5px] font-bold uppercase tracking-[0.06em] text-wa transition-all duration-200 hover:bg-wa/[0.12] active:scale-[0.97]"
              >
                Quiero conocer más sobre el sistema
              </a>
              <a
                href="https://www.instagram.com/julian_alejandro_morales/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 text-[12px] font-bold uppercase tracking-[0.06em] text-ink/80 transition-all duration-200 hover:border-white/30 hover:text-ink active:scale-[0.97]"
              >
                <Instagram className="h-4 w-4" />
                Sígueme en Instagram
              </a>
            </div>
          </div>
        );

      case "calendar":
        return wrap(
          "calendar",
          <div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-wa/25 bg-wa/10">
                <CalendarDays className="h-5 w-5 text-wa" />
              </div>
              <h3 className="font-display mt-4 text-[20px] font-bold uppercase leading-tight text-ink">
                Reserva tu sesión de diagnóstico
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-dim">
                La sesión es directamente conmigo, por videollamada. Sin costo,
                sin compromiso.
              </p>
            </div>

            <p className="mt-6 text-[10.5px] font-bold uppercase tracking-[0.22em] text-dim">
              Elige el día
            </p>
            <div className="-mx-1 mt-2.5 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
              {days.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setSessionDate(d.iso)}
                  className={cn(
                    "flex w-[62px] shrink-0 snap-start flex-col items-center rounded-2xl border py-3 transition-all duration-200",
                    sessionDate === d.iso
                      ? "border-wa/70 bg-wa/[0.1] text-ink shadow-[0_0_24px_-8px_rgba(0,230,118,0.5)]"
                      : "border-white/10 bg-white/[0.02] text-ink/70 hover:border-white/25"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {d.weekday}
                  </span>
                  <span className="font-display mt-0.5 text-[19px] font-bold leading-none">
                    {d.dayNum}
                  </span>
                  <span className="mt-1 text-[10px] uppercase text-dim">{d.month}</span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-[10.5px] font-bold uppercase tracking-[0.22em] text-dim">
              Elige la hora
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {SESSION_SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSessionTime(s)}
                  className={cn(
                    "rounded-xl border py-2.5 text-[13px] font-semibold transition-all duration-200",
                    sessionTime === s
                      ? "border-wa/70 bg-wa/[0.1] text-ink shadow-[0_0_22px_-8px_rgba(0,230,118,0.5)]"
                      : "border-white/10 bg-white/[0.02] text-ink/70 hover:border-white/25"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-center text-[11px] text-dim">
              Hora Colombia (GMT-5)
            </p>

            <div className="mt-6">
              <CtaButton
                size="md"
                dimmed={!(sessionDate && sessionTime)}
                onClick={() => {
                  if (sessionDate && sessionTime) {
                    const b =
                      typeof answers.businessType === "string"
                        ? answers.businessType
                        : "";
                    setBusinessSel(BUSINESS_SUGGESTIONS.includes(b) ? b : "");
                    go({ kind: "form" });
                  }
                }}
              >
                Reservar mi sesión
              </CtaButton>
            </div>
          </div>
        );

      case "form":
        return wrap(
          "form",
          <div>
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-dim transition-colors hover:text-ink"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Atrás
            </button>
            <h3 className="font-display mt-4 text-[20px] font-bold leading-tight text-ink">
              Confirma tu sesión
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-dim">
              Tus datos para agendar y enviarte la confirmación.
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-wa/25 bg-wa/[0.06] p-4">
              <CalendarDays className="h-5 w-5 shrink-0 text-wa" />
              <div>
                <p className="text-[13.5px] font-semibold text-ink">
                  {formatSessionDate(sessionDate)}
                </p>
                <p className="text-[12.5px] text-dim">
                  {sessionTime} · Hora Colombia · Videollamada
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              <Field label="Nombre">
                <input
                  name="name"
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Tu nombre"
                  autoComplete="name"
                  maxLength={60}
                  className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-dim/60 focus:border-wa/60"
                />
              </Field>
              <Field label="WhatsApp">
                <div className="flex h-12 items-stretch overflow-hidden rounded-xl border border-white/12 bg-white/[0.04] transition-colors focus-within:border-wa/60">
                  <span className="flex items-center border-r border-white/10 px-3 text-[13px] font-semibold text-dim">
                    +57
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        whatsapp: e.target.value.replace(/\D/g, "").slice(0, 10).replace(/(\d{3})(\d{0,3})(\d{0,4})/, (_m, a, b, c) => [a, b, c].filter(Boolean).join(" ")),
                      }))
                    }
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="3XX XXX XXXX"
                    className="h-full flex-1 bg-transparent px-3 text-[15px] tracking-wide text-ink outline-none placeholder:text-dim/60"
                  />
                </div>
              </Field>
              <Field label="¿A qué se dedica tu negocio?">
                <div className="relative">
                  <select
                    value={businessSel}
                    onChange={(e) => setBusinessSel(e.target.value)}
                    className={cn(
                      "h-12 w-full appearance-none rounded-xl border border-white/12 bg-white/[0.04] px-4 pr-10 text-[15px] outline-none transition-colors focus:border-wa/60",
                      businessSel ? "text-ink" : "text-dim"
                    )}
                  >
                    <option value="" disabled className="bg-panel text-dim">
                      Selecciona una opción
                    </option>
                    {BUSINESS_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} className="bg-panel text-ink">
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
                </div>
              </Field>
              <Field label="Email (opcional)">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="tucorreo@ejemplo.com"
                  autoComplete="email"
                  maxLength={80}
                  className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-[15px] text-ink outline-none transition-colors placeholder:text-dim/60 focus:border-wa/60"
                />
              </Field>
            </div>

            {formError ? (
              <p className="mt-4 rounded-xl border border-[#ff7d6e]/30 bg-[#ff7d6e]/[0.08] px-4 py-3 text-[13px] leading-snug text-[#ffa79b]">
                {formError}
              </p>
            ) : null}

            <div className="mt-6">
              <CtaButton onClick={onBook} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Reservando…
                  </>
                ) : (
                  "Reservar mi sesión"
                )}
              </CtaButton>
            </div>
          </div>
        );

      case "success":
        return wrap(
          "success",
          <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="glow-wa-soft flex h-16 w-16 items-center justify-center rounded-full border border-wa/40 bg-wa/10"
            >
              <Check className="h-7 w-7 text-wa-bright" strokeWidth={3} />
            </motion.div>
            <h3 className="font-display mt-5 text-[21px] font-bold uppercase leading-tight text-ink">
              Listo. Tu sesión quedó reservada.
            </h3>
            <p className="mt-3 text-[14px] text-ink/85">
              <strong className="text-ink">
                {formatSessionDate(sessionDate)}
              </strong>{" "}
              · {sessionTime}
            </p>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-dim">
              Confirma por WhatsApp: se abrirá una conversación con tu resumen
              listo para enviar y recibiré tus datos al instante para coordinar
              la sesión.
            </p>
            <div className="mt-7 w-full">
              <CtaButton onClick={onConfirmWhatsapp}>
                <MessageCircle className="h-5 w-5" />
                Confirmar por WhatsApp
              </CtaButton>
            </div>
            <div className="mt-3 w-full">
              <a
                href={googleCalendarUrl(sessionDate, sessionTime)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 text-[12px] font-bold uppercase tracking-[0.06em] text-ink/80 transition-all duration-200 hover:border-white/30 hover:text-ink active:scale-[0.97]"
              >
                <CalendarPlus className="h-4 w-4" />
                Agregar a mi calendario
              </a>
            </div>
            <p className="mt-4 text-[11.5px] text-dim/80">
              Si no se abrió WhatsApp, toca el botón verde.
            </p>
          </div>
        );
    }
  };

  return (
    <section id="diagnostico" className="relative scroll-mt-4 py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-16 h-96 w-[34rem] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,230,118,0.09),transparent)] blur-2xl"
      />
      <div className="relative mx-auto max-w-md px-4">
        <div className="text-center">
          <Reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-wa">
              Diagnóstico en 60 segundos
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="font-display mt-3 text-balance text-[26px] font-bold uppercase leading-[1.1] tracking-tight text-ink sm:text-4xl">
              Descubre si este sistema es para tu negocio
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-4 max-w-sm text-pretty text-[15px] leading-relaxed text-dim">
              Responde 8 preguntas rápidas sobre tu operación actual.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-9">
          <div
            ref={cardRef}
            className="relative scroll-mt-6 rounded-[1.6rem] border border-white/10 bg-[#0a0e10]/95 p-5 shadow-[0_30px_90px_-40px_rgba(0,230,118,0.35),0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-7"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(0,230,118,0.45),transparent)]"
            />
            {step.kind !== "intro" ? (
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em]">
                  <span className="text-dim">Diagnóstico de tu negocio</span>
                  <span className="text-wa">{pct}%</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-wa to-wa-bright"
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 130, damping: 22 }}
                  />
                </div>
              </div>
            ) : null}

            <div className="relative mt-5 min-h-[420px]">
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                {renderStep()}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
