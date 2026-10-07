"use client";

import { CtaButton } from "./cta-button";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-[34rem] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,230,118,0.1),transparent)] blur-2xl"
      />
      <div className="relative mx-auto max-w-md px-4 text-center">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-wa">
            El siguiente paso
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="font-display mx-auto mt-3 max-w-md text-balance text-[27px] font-bold uppercase leading-[1.1] tracking-tight text-ink sm:text-4xl">
            Deja de perder ventas que ya te están escribiendo.
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-5 max-w-sm text-pretty text-[15px] leading-relaxed text-dim">
            El diagnóstico toma menos de 2 minutos. Si tu negocio es candidato,
            reservas tu sesión directamente conmigo.
          </p>
        </Reveal>
        <Reveal delay={0.18} className="mt-9">
          <div className="mx-auto max-w-xs">
            <CtaButton href="#diagnostico" size="lg">
              Quiero analizar mi negocio
            </CtaButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
