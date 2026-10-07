"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CtaButton } from "./cta-button";

const HERO_BLUR =
  "data:image/jpeg;base64,/9j/2wBDABUOEBIQDRUSERIYFhUZHzQiHx0dH0AuMCY0TENQT0tDSUhUXnlmVFlyWkhJaY9qcnyAh4iHUWWUn5ODnXmEh4L/2wBDARYYGB8cHz4iIj6CVklWgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoL/wAARCAAVABgDASIAAhEBAxEB/8QAGgABAAIDAQAAAAAAAAAAAAAAAAIDAQQFBv/EACQQAAIBBAICAQUAAAAAAAAAAAABAgMABBESIRNRYRQxgZHR/8QAFwEAAwEAAAAAAAAAAAAAAAAAAAEDAv/EABoRAAIDAQEAAAAAAAAAAAAAAAABAhEhQWH/2gAMAwEAAhEDEQA/APPBFe4IVzo2cs3qrLW0Rr22hLhxIATr67qFnx810sjIwAjOpyCcn8V07HjXsZRO0sR8Z+5Vv580khszyvBwWlr5oJXdywUIwBpU+euZ/pYdgFO+es+vkUolfBL04dreSQIQoRg572XJ/dbachKiBdYyAOsrSlZaRGcVZQ11LcNmzTTEeWAC4BpSlFIrHFh//2Q==";

export function Hero() {
  return (
    <header className="relative">
      {/* Key visual: problem + hook (from the campaign creative) */}
      <div className="relative w-full overflow-hidden bg-carbon">
        <motion.div
          initial={{ opacity: 0, scale: 1.035 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full"
          style={{
            backgroundImage: `url("${HERO_BLUR}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <picture>
            <source
              type="image/avif"
              srcSet="/img/hero-sm.avif 480w, /img/hero.avif 720w"
            />
            <source
              type="image/webp"
              srcSet="/img/hero-sm.webp 480w, /img/hero.webp 720w"
            />
            <img
              src="/img/hero.webp"
              alt="Dueño de negocio abrumado por consultas de WhatsApp sin atender, junto a conversaciones que se pierden"
              width={720}
              height={618}
              fetchPriority="high"
              decoding="async"
              className="block h-auto w-full"
              style={{ aspectRatio: "720 / 618" }}
            />
          </picture>
        </motion.div>

        {/* Vignette for depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_62%_at_50%_0%,transparent_62%,rgba(5,7,8,0.5)_100%)]"
        />
        {/* Light seam between the visual and the page */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent_4%,rgba(37,211,102,0.35)_50%,transparent_96%)]"
        />
      </div>

      <h1 className="sr-only">
        ¿Te escriben por WhatsApp, pero no vendes? No te faltan mensajes: te
        falta un sistema.
      </h1>

      {/* Soft transition: green glow + shadow carrying the eye into the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative mx-auto -mt-6 h-28 w-full max-w-2xl bg-[radial-gradient(58%_100%_at_50%_100%,rgba(37,211,102,0.16),transparent_74%)] blur-xl"
      />

      <div className="relative z-10 mx-auto -mt-8 w-full max-w-md px-4 pb-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <CtaButton href="#diagnostico" size="lg">
            Quiero ver cómo funciona
          </CtaButton>
          <p className="mt-3.5 text-[13.5px] leading-snug text-dim">
            Descubre cómo convertir tus chats en ventas automáticas.
          </p>
          <a
            href="#diagnostico"
            className="mt-7 inline-flex flex-col items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink/60 transition-colors hover:text-wa"
          >
            <span className="animate-hint-bob flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04]">
              <ChevronDown className="h-4 w-4" />
            </span>
            Descubre si este sistema es para tu negocio
          </a>
        </motion.div>
      </div>
    </header>
  );
}
