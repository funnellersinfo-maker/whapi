"use client";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Scarcity() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-md px-4 sm:max-w-xl">
        <Reveal>
          <div className="glow-gold relative overflow-hidden rounded-3xl border border-gold/25 bg-[linear-gradient(180deg,rgba(216,178,92,0.07),rgba(16,21,22,0.5))] p-7 sm:p-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(216,178,92,0.14),transparent)] blur-2xl"
            />
            <div className="relative text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">
                Cupos limitados
              </p>
              <h2 className="font-display mt-3 text-balance text-[24px] font-bold uppercase leading-[1.12] tracking-tight text-ink sm:text-3xl">
                No abrimos sesiones ilimitadas.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-pretty text-[14px] leading-relaxed text-dim">
                Las implementaciones requieren análisis, configuración y
                personalización. Por eso trabajamos con cupos limitados.
              </p>
              <p className="mx-auto mt-3.5 max-w-md text-pretty text-[14px] leading-relaxed text-dim">
                Además, estamos entrando en una de las épocas comerciales más
                importantes del año.
              </p>
              <p className="font-display mx-auto mt-7 max-w-md text-balance text-[15.5px] font-semibold uppercase leading-snug text-ink">
                Mientras más pronto reserves, más pronto tu negocio deja de
                perder ventas.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
