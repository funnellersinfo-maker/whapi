"use client";

import { CalendarDays, MessageCircle, Timer, Video } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const CREDENTIALS = [
  "9+ años en marketing y automatización",
  "Especialización reciente en IA aplicada",
  "Meta Ads",
  "WhatsApp API",
  "Automatización comercial",
  "Generación de clientes",
];

const SESSION_CHIPS = [
  { icon: Video, label: "Sesión 1 a 1" },
  { icon: CalendarDays, label: "Videollamada" },
  { icon: Timer, label: "~30 minutos" },
  { icon: MessageCircle, label: "Sin costo" },
];

export function About() {
  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(216,178,92,0.06),transparent)] blur-2xl"
      />
      <div className="relative mx-auto max-w-md px-4 sm:max-w-xl">
        <SectionHeading kicker="Quién te acompaña" title="Vas a hablar directamente conmigo." />

        <Reveal className="mt-10" delay={0.05}>
          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-panel/60 p-7 sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(37,211,102,0.16),transparent)] blur-2xl"
            />
            <div className="relative flex flex-col items-center text-center">
              <div className="glow-wa-soft relative flex h-20 w-20 items-center justify-center rounded-full border border-wa/30 bg-[linear-gradient(150deg,#122619,#0a1410)]">
                <span className="font-display text-[22px] font-bold tracking-tight text-wa">
                  JA
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-panel bg-wa-bright" />
              </div>
              <p className="font-display mt-4 text-[20px] font-bold uppercase leading-tight text-ink">
                Julián Alejandro
              </p>
              <p className="mt-1 text-[12.5px] text-dim">
                Marketing y automatización comercial con IA
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                {CREDENTIALS.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-ink/80"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mt-7 rounded-2xl border-l-2 border-wa/70 bg-white/[0.02] px-5 py-4">
              <p className="text-pretty text-[14px] leading-relaxed text-ink/90">
                “En esta sesión voy a analizar tu negocio, cómo llegan
                actualmente tus clientes, qué ocurre después de que escriben
                por WhatsApp y dónde se están perdiendo oportunidades.”
              </p>
            </div>

            <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SESSION_CHIPS.map((c) => (
                <div
                  key={c.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.02] px-2 py-3.5"
                >
                  <c.icon className="h-4 w-4 text-wa" />
                  <span className="text-[10.5px] font-semibold uppercase tracking-wide text-ink/75">
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
