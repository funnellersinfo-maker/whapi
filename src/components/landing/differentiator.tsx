"use client";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Differentiator() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-md px-4 sm:max-w-xl">
        <SectionHeading kicker="El diferenciador" title="No es una plataforma white label." />

        <Reveal className="mt-9" delay={0.05}>
          <div className="relative rounded-3xl border border-white/8 bg-panel/60 p-6 sm:p-8">
            <span
              aria-hidden="true"
              className="absolute left-0 top-8 h-[calc(100%-4rem)] w-[3px] rounded-full bg-gradient-to-b from-wa/80 via-wa/30 to-transparent"
            />
            <p className="text-pretty text-[15.5px] leading-relaxed text-ink/90">
              Es un desarrollo propio, diseñado y personalizado alrededor de las
              necesidades específicas de cada negocio, con infraestructura
              técnica y acompañamiento detrás.
            </p>
            <p className="mt-4 text-pretty text-[14px] leading-relaxed text-dim">
              Nada de plantillas genéricas: tu sistema se construye para cómo
              vende tu negocio.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
