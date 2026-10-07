"use client";

import { Check, X } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const FOR_YOU = [
  "Ya tienes un negocio funcionando",
  "Recibes consultas",
  "Tienes WhatsApp como canal comercial",
  "Quieres aumentar la conversión",
  "Estás dispuesto a invertir en implementar el sistema",
  "Quieres automatizar sin perder el factor humano",
];

const NOT_FOR_YOU = [
  "Buscas algo completamente gratis",
  "No tienes intención de implementar",
  "Solo quieres información sin intención comercial",
  "No puedes invertir en la implementación",
  "Todavía no tienes ningún negocio o proyecto que automatizar",
];

export function ForWhom() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-md px-4 sm:max-w-2xl">
        <SectionHeading kicker="Sé honesto contigo" title="¿Es para ti?" />

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Reveal delay={0.05}>
            <div className="h-full rounded-3xl border border-wa/25 bg-wa/[0.05] p-6">
              <p className="font-display text-[15px] font-bold uppercase tracking-wide text-ink">
                Esto es para ti si…
              </p>
              <ul className="mt-5 space-y-3.5">
                {FOR_YOU.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wa/15">
                      <Check className="h-3 w-3 text-wa-bright" strokeWidth={3.5} />
                    </span>
                    <span className="text-[13.5px] leading-snug text-ink/90">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="h-full rounded-3xl border border-white/8 bg-panel/50 p-6">
              <p className="font-display text-[15px] font-bold uppercase tracking-wide text-dim">
                No es para ti si…
              </p>
              <ul className="mt-5 space-y-3.5">
                {NOT_FOR_YOU.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
                      <X className="h-3 w-3 text-dim" strokeWidth={3.5} />
                    </span>
                    <span className="text-[13.5px] leading-snug text-dim">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
