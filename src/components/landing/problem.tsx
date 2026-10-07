"use client";

import { motion } from "framer-motion";
import { CheckCheck, ChevronRight, Clock, XCircle } from "lucide-react";
import { PhoneFrame } from "./phone-frame";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const INBOX = [
  { text: "¿Cuánto cuesta?", time: "10:24 a. m." },
  { text: "Me interesa.", time: "10:31 a. m." },
  { text: "¿Tienes disponibilidad?", time: "11:02 a. m." },
  { text: "¿Cómo compro?", time: "11:47 a. m." },
];

function StateChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  tone: "dim" | "lost";
}) {
  return (
    <span
      className={
        tone === "lost"
          ? "inline-flex items-center gap-1.5 rounded-full border border-[#ff7d6e]/25 bg-[#ff7d6e]/[0.07] px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-[#ffa79b]"
          : "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-dim"
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function Problem() {
  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-10 h-72 w-[38rem] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(37,211,102,0.06),transparent)] blur-2xl"
      />
      <div className="relative mx-auto max-w-md px-4 sm:max-w-xl">
        <SectionHeading
          kicker="El problema real"
          title={
            <>
              El problema no siempre es conseguir más clientes.
            </>
          }
          sub="Muchas empresas ya tienen personas interesadas escribiendo por WhatsApp. El problema es todo lo que ocurre después."
        />

        <Reveal className="mt-10" delay={0.05}>
          <PhoneFrame title="Tu negocio" subtitle="en línea">
            {INBOX.map((m, i) => (
              <motion.div
                key={m.text}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12 * i, duration: 0.55, ease: "easeOut" }}
                className="flex justify-start"
              >
                <div className="max-w-[82%] rounded-2xl rounded-bl-md bg-[#1b2224] px-3.5 py-2.5">
                  <p className="text-[13px] leading-snug text-ink/90">{m.text}</p>
                  <p className="mt-1 text-[9.5px] text-dim">{m.time}</p>
                </div>
              </motion.div>
            ))}
          </PhoneFrame>
        </Reveal>

        <Reveal className="mt-8" delay={0.1}>
          <div className="mx-auto flex max-w-sm flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <StateChip icon={CheckCheck} label="Visto" tone="dim" />
            <ChevronRight className="h-3.5 w-3.5 text-dim/50" />
            <StateChip icon={Clock} label="Sin seguimiento" tone="dim" />
            <ChevronRight className="h-3.5 w-3.5 text-dim/50" />
            <StateChip icon={XCircle} label="Cliente perdido" tone="lost" />
          </div>
        </Reveal>

        <Reveal className="mt-10" delay={0.05}>
          <p className="mx-auto max-w-sm text-balance text-center font-display text-[19px] font-semibold uppercase leading-snug text-ink sm:text-xl">
            Cada conversación que nadie atiende bien puede convertirse en{" "}
            <span className="text-[#ff8a7c]">una venta perdida</span>.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
