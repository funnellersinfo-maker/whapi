"use client";

import { Check } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const GROUPS = [
  {
    title: "Atiende",
    items: [
      "Responde 24/7",
      "Entiende texto",
      "Entiende audios",
      "Entiende imágenes",
      "Entiende videos",
      "Entiende archivos",
    ],
  },
  {
    title: "Conversa",
    items: [
      "Envía audios",
      "Envía imágenes",
      "Envía documentos",
      "Personaliza conversaciones",
    ],
  },
  {
    title: "Convierte",
    items: [
      "Califica prospectos",
      "Hace seguimiento",
      "Recupera oportunidades",
      "Trabaja múltiples canales",
      "Envía notificaciones y alertas",
      "Funciona desde cualquier dispositivo",
    ],
  },
];

export function System() {
  return (
    <section id="sistema" className="relative scroll-mt-4 py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(216,178,92,0.07),transparent)] blur-2xl"
      />
      <div className="relative mx-auto max-w-md px-4 sm:max-w-2xl">
        <SectionHeading
          kicker="Lo que hace"
          title="No es otro chatbot con botones."
          sub="Es una infraestructura de atención y automatización construida alrededor de tu negocio."
        />

        <div className="mt-10 space-y-4">
          {GROUPS.map((g, gi) => (
            <Reveal key={g.title} delay={0.06 * gi}>
              <div className="rounded-3xl border border-white/8 bg-panel/60 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-wa">
                  {g.title}
                </p>
                <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
                  {g.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-wa/30 bg-wa/10">
                        <Check className="h-3 w-3 text-wa-bright" strokeWidth={3.5} />
                      </span>
                      <span className="text-[13px] leading-snug text-ink/90">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
