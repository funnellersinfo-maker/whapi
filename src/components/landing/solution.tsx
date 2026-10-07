"use client";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const AI_BLUR =
  "data:image/jpeg;base64,/9j/2wBDABUOEBIQDRUSERIYFhUZHzQiHx0dH0AuMCY0TENQT0tDSUhUXnlmVFlyWkhJaY9qcnyAh4iHUWWUn5ODnXmEh4L/2wBDARYYGB8cHz4iIj6CVklWgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoL/wAARCAAPABgDASIAAhEBAxEB/8QAGAAAAgMAAAAAAAAAAAAAAAAAAAMCBAX/xAAjEAACAQMDBAMAAAAAAAAAAAABAgMABBESITETUWGhFEGB/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQP/xAAYEQEBAAMAAAAAAAAAAAAAAAABAAIRMf/aAAwDAQACEQMRAD8AxrW0guCyosihQOSuQfvmq/RjSVgwL47bcU2CcWjZMavkb6huN+9IMqmYs5bSfOSKDlN2ZTTCrwRfHVpJGyWx4GcflFTuL954dEaqp6uMHz7HuihqDf/Z";

const CAPABILITIES = [
  "Responde",
  "Entiende",
  "Califica",
  "Hace seguimiento",
  "Recupera conversaciones",
  "Ayuda a cerrar",
];

export function Solution() {
  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/4 h-80 w-[34rem] max-w-none -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,230,118,0.07),transparent)] blur-2xl"
      />
      <div className="relative mx-auto max-w-md px-4 sm:max-w-xl">
        <SectionHeading
          kicker="La alternativa"
          title="¿Y si WhatsApp pudiera hacer todo eso por ti?"
          sub="Una IA que atiende cada conversación como lo haría tu mejor vendedor: entiende, responde y acompaña hasta el cierre."
        />

        <div className="mx-auto mt-9 grid max-w-md grid-cols-2 gap-2 sm:max-w-lg sm:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c} delay={0.05 * i}>
              <div className="flex h-full items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5">
                <span className="animate-pulse-dot h-2 w-2 shrink-0 rounded-full bg-wa-bright" />
                <span className="text-[12.5px] font-semibold leading-tight text-ink">
                  {c}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10" delay={0.05}>
          <div className="relative mx-auto max-w-[420px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-[radial-gradient(60%_60%_at_50%_42%,rgba(37,211,102,0.16),transparent_75%)] blur-2xl"
            />
            <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.95)]">
              <div
                className="w-full"
                style={{
                  backgroundImage: `url("${AI_BLUR}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <picture>
                  <source
                    type="image/avif"
                    srcSet="/img/ia-seccion-sm.avif 480w, /img/ia-seccion.avif 720w"
                  />
                  <source
                    type="image/webp"
                    srcSet="/img/ia-seccion-sm.webp 480w, /img/ia-seccion.webp 720w"
                  />
                  <img
                    src="/img/ia-seccion.webp"
                    alt="Asistente de IA con audífonos atendiendo las conversaciones de WhatsApp del negocio mientras confirma ventas"
                    width={720}
                    height={435}
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full"
                    style={{ aspectRatio: "720 / 435" }}
                  />
                </picture>
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#050708]/80"
              />
            </div>
            <p className="mt-4 text-center text-[12.5px] text-dim">
              Atención automatizada sobre la API oficial de WhatsApp.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
