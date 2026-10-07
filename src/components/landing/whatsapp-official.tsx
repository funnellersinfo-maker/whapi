"use client";

import { motion } from "framer-motion";
import { Cloud, PhoneOff, ShieldCheck } from "lucide-react";
import { ChatBubble, PhoneFrame } from "./phone-frame";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const CHAT = [
  { from: "client" as const, text: "Hola, ¿cuánto cuesta?", time: "9:41 a. m." },
  {
    from: "ai" as const,
    text: "¡Hola! Con gusto te cuento. ¿Qué opción te interesa?",
    time: "9:41 a. m.",
  },
  { from: "client" as const, text: "El paquete familiar", time: "9:42 a. m." },
  {
    from: "ai" as const,
    text: "Excelente elección. ¿Quieres que te envíe los detalles y la disponibilidad?",
    time: "9:42 a. m.",
  },
  { from: "client" as const, text: "Sí, por favor", time: "9:45 a. m." },
  {
    from: "ai" as const,
    text: "Perfecto, te ayudo a continuar con tu compra.",
    time: "9:45 a. m.",
  },
];

const STAGES = ["Consulta", "Información", "Calificación", "Seguimiento", "Cierre"];

const POINTS = [
  { icon: Cloud, label: "Funciona en la nube, 24/7" },
  { icon: PhoneOff, label: "Sin depender de un celular conectado" },
  { icon: ShieldCheck, label: "Infraestructura sobre la API oficial de WhatsApp" },
];

export function WhatsAppOfficial() {
  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-[30rem] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(37,211,102,0.06),transparent)] blur-2xl"
      />
      <div className="relative mx-auto max-w-md px-4 sm:max-w-xl">
        <SectionHeading
          kicker="Infraestructura oficial"
          title="WhatsApp oficial. Sin trucos."
          sub="Se trabaja con la API oficial de WhatsApp. Tu canal comercial funciona sobre infraestructura profesional, sin depender de que un celular permanezca conectado o con la app abierta."
        />

        <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
          {STAGES.map((s, i) => (
            <Reveal key={s} delay={0.05 * i} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                <span
                  className={
                    i === STAGES.length - 1
                      ? "h-1.5 w-1.5 rounded-full bg-gold"
                      : "h-1.5 w-1.5 rounded-full bg-wa"
                  }
                />
                <span className="text-[11.5px] font-semibold text-ink/85">{s}</span>
              </span>
              {i < STAGES.length - 1 ? (
                <span aria-hidden="true" className="h-px w-3 bg-white/15" />
              ) : null}
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8" delay={0.05}>
          <PhoneFrame title="Tu negocio" subtitle="IA atendiendo">
            {CHAT.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.18 * i, duration: 0.5, ease: "easeOut" }}
              >
                <ChatBubble {...m} />
              </motion.div>
            ))}
          </PhoneFrame>
          <p className="mt-5 text-center text-[12.5px] leading-relaxed text-dim">
            Así evoluciona una conversación: de la primera pregunta hasta el
            momento de cerrar.
          </p>
        </Reveal>

        <div className="mx-auto mt-9 grid max-w-md gap-2.5 sm:grid-cols-3">
          {POINTS.map((p, i) => (
            <Reveal key={p.label} delay={0.05 * i}>
              <div className="flex h-full flex-col items-center gap-2.5 rounded-2xl border border-white/8 bg-panel/50 px-4 py-5 text-center">
                <p.icon className="h-5 w-5 text-wa" />
                <p className="text-[12.5px] leading-snug text-ink/85">{p.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
