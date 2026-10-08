"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CtaButton } from "./cta-button";

const HERO_BLUR =
  "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAiACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAUDBAECBgf/xAAkEAACAgIBBAMAAwAAAAAAAAABAgADBBEFEyExUQYSIhZBYf/EABcBAQEBAQAAAAAAAAAAAAAAAAIBAAP/xAAbEQEBAQEAAwEAAAAAAAAAAAABABECAxIhMf/aAAwDAQACEQMRAD8AR5lLVW/s7Mw+PbkVK4G9SJsjqHdh2ZZXk+jWiovYHvADkvm0JxnW1VcaMdfxm2+lXrbyIt6753IVuq9tzv8ADX6UIv8AkZDovP8AkeJs43QtGyYTovkXTtzlSw9gIQdOTeS5GnFe7I6K+YxTgHLFS8rcdkKM8WOfqPcd3Z6Aj6WAg+TLufseugco8Pi7KCCrj8xzVyFykKNHX9ygMyhl11QJoMzHxwQLAZvYi+QZZ8gyrLM/vCV8mxMvOO20vuEj0XQ1Pkvm2zrzCEsGxs+zBifcISUgQhCaV//Z";

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

        {/* Vignette suave para profundidad (reducida: imagen más brillante) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_62%_at_50%_0%,transparent_72%,rgba(5,7,8,0.26)_100%)]"
        />
        {/* Fundido inferior: la imagen se difumina y empata con el fondo de la página */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[8.6%] bg-[linear-gradient(to_bottom,rgba(5,7,8,0)_0%,rgba(5,7,8,0.22)_26%,rgba(5,7,8,0.52)_52%,rgba(5,7,8,0.82)_78%,#050708_100%)]"
        />
      </div>

      <h1 className="sr-only">
        ¿Te escriben por WhatsApp, pero no vendes? No te faltan mensajes: te
        falta un sistema.
      </h1>

      {/* Punchline: antes horneada en la imagen, ahora texto real que resalta */}
      <div className="relative z-[6] mx-auto -mt-[4.6vw] w-full max-w-2xl px-4 pb-1 text-center">
        <motion.p
          aria-hidden="true"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(17px,3.1vw,25px)] font-bold uppercase leading-[1.16] tracking-[0.06em] text-ink"
        >
          <span className="block">No te faltan mensajes.</span>
          <span className="mt-[0.36em] block text-wa [text-shadow:0_0_24px_rgba(37,211,102,0.45)]">
            Te falta un sistema.
          </span>
        </motion.p>
      </div>

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
