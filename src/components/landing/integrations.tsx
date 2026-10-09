"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Database,
  Facebook,
  Instagram,
  Megaphone,
  MessageCircle,
  Search,
  ShoppingCart,
  Sparkle,
  Store,
} from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { DropiFace, HotmartFlame, MastershopBolt } from "./brand-marks";

/* Plataformas destacadas — solo el elemento gráfico de la marca, flotando. */
const BRANDS = [
  {
    name: "Hotmart",
    tagline: "Infoproductos",
    Mark: HotmartFlame,
    glow: "bg-[#ff4e23]",
    float: 0,
  },
  {
    name: "Mastershop",
    tagline: "eCommerce rentable",
    Mark: MastershopBolt,
    glow: "bg-[#00d64b]",
    float: 0.9,
  },
  {
    name: "Dropi",
    tagline: "Dropshipping y logística",
    Mark: DropiFace,
    glow: "bg-[#ff6a00]",
    float: 1.7,
  },
];

const NICHES = [
  "E-commerce",
  "Dropshipping",
  "Infoproductos",
  "Negocios locales",
  "Servicios físicos y virtuales",
  "Todo nicho",
];

const INTEGRATIONS = [
  { label: "Meta Ads", icon: Megaphone },
  { label: "WhatsApp API", icon: MessageCircle },
  { label: "Instagram", icon: Instagram },
  { label: "Facebook", icon: Facebook },
  { label: "Google", icon: Search },
  { label: "E-commerce", icon: ShoppingCart },
  { label: "CRM", icon: Database },
  { label: "API de Conversiones de Meta", icon: BarChart3 },
];

/** Insignia flotante de una plataforma: halo de color + chispas + vaivén. */
function FloatingBadge({
  brand,
  index,
}: {
  brand: (typeof BRANDS)[number];
  index: number;
}) {
  const { name, tagline, Mark, glow, float } = brand;
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: 0.1 * index }}
      className="relative flex flex-col items-center"
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: float }}
        className="relative"
      >
        {/* halo mágico */}
        <div
          aria-hidden="true"
          className={`absolute -inset-3.5 rounded-[30px] opacity-25 blur-xl ${glow}`}
        />
        <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-white/12 bg-panel shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Mark className="h-10 w-10" />
        </div>
        {/* chispas titilando */}
        <motion.span
          aria-hidden="true"
          className="absolute -left-2.5 -top-1.5 text-gold"
          animate={{ opacity: [0.15, 1, 0.15], scale: [0.7, 1.1, 0.7] }}
          transition={{ duration: 1.9, repeat: Infinity, delay: float }}
        >
          <Sparkle className="h-3.5 w-3.5" />
        </motion.span>
        <motion.span
          aria-hidden="true"
          className="absolute -right-2 bottom-3.5 text-gold/80"
          animate={{ opacity: [0.1, 0.9, 0.1], scale: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: float + 0.8 }}
        >
          <Sparkle className="h-2.5 w-2.5" />
        </motion.span>
      </motion.div>
      <p className="font-display mt-3.5 text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
        {name}
      </p>
      <p className="mt-0.5 max-w-[110px] text-center text-[10.5px] leading-tight text-dim">
        {tagline}
      </p>
    </motion.div>
  );
}

export function Integrations() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-md px-4 sm:max-w-2xl">
        <SectionHeading
          kicker="Integraciones"
          title="Se integra con tu ecosistema digital."
          sub="Si ya tienes canales, tiendas o herramientas funcionando, el sistema se conecta con ellas."
        />

        {/* Plataformas del ecosistema — flotan con vida propia */}
        <div className="mt-12 grid grid-cols-3 gap-2 sm:gap-6">
          {BRANDS.map((b, i) => (
            <FloatingBadge key={b.name} brand={b} index={i} />
          ))}
        </div>

        {/* Nichos que atiende */}
        <div className="mt-9 flex flex-wrap justify-center gap-2">
          {NICHES.map((n, i) => (
            <Reveal key={n} delay={0.04 * i}>
              <span
                className={`inline-block rounded-full border px-3.5 py-1.5 text-[11px] font-semibold ${
                  n === "Todo nicho"
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-white/10 bg-white/[0.03] text-ink/75"
                }`}
              >
                {n}
              </span>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {INTEGRATIONS.map((item, i) => (
            <Reveal key={item.label} delay={0.03 * i}>
              <div className="flex h-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/8 bg-panel/50 px-3 py-5 transition-colors duration-300 hover:border-wa/30">
                <item.icon className="h-5 w-5 text-wa/90" />
                <span className="text-center text-[11.5px] font-semibold leading-tight text-ink/85">
                  {item.label}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-[11.5px] leading-relaxed text-dim">
          <Store className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
          ¿Tu plataforma no está en la lista? Si tus clientes te escriben por
          WhatsApp, se puede automatizar.
        </p>
      </div>
    </section>
  );
}
