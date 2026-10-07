"use client";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function NoMonthly() {
  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[30rem] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,230,118,0.08),transparent)] blur-2xl"
      />
      <div className="relative mx-auto max-w-md px-4 sm:max-w-xl">
        <SectionHeading
          kicker="Transparencia"
          title="No pagas una mensualidad por usar el sistema."
        />

        <Reveal className="mt-9" delay={0.05}>
          <div className="relative overflow-hidden rounded-3xl border border-wa/20 bg-[linear-gradient(180deg,rgba(0,230,118,0.07),rgba(16,21,22,0.4))] p-7 text-center sm:p-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 left-1/2 h-44 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,230,118,0.18),transparent)] blur-2xl"
            />
            <p className="font-display relative text-glow-wa text-[64px] font-bold leading-none text-wa-bright sm:text-7xl">
              $0
            </p>
            <p className="relative mt-2 text-[13px] font-bold uppercase tracking-[0.22em] text-dim">
              Mensualidad obligatoria
            </p>
            <div className="relative mx-auto mt-6 max-w-sm space-y-3.5 text-left">
              <p className="text-[14px] leading-relaxed text-ink/90">
                La implementación se define una vez, según lo que tu negocio
                necesita, y el uso de la infraestructura no genera un pago
                mensual obligatorio.
              </p>
              <p className="text-[13px] leading-relaxed text-dim">
                Y siendo transparentes: si más adelante quieres sumar servicios
                adicionales —campañas, mejoras, contenido—, esos se cotizan por
                separado y siempre lo sabes antes.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
