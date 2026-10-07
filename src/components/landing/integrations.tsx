"use client";

import {
  BarChart3,
  Database,
  Facebook,
  Instagram,
  Megaphone,
  MessageCircle,
  Package,
  Search,
  ShoppingCart,
  Store,
} from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const INTEGRATIONS = [
  { label: "Meta Ads", icon: Megaphone },
  { label: "WhatsApp API", icon: MessageCircle },
  { label: "Instagram", icon: Instagram },
  { label: "Facebook", icon: Facebook },
  { label: "Google", icon: Search },
  { label: "E-commerce", icon: ShoppingCart },
  { label: "CRM", icon: Database },
  { label: "Dropi", icon: Package },
  { label: "Mastershop", icon: Store },
  { label: "API de Conversiones de Meta", icon: BarChart3 },
];

export function Integrations() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-md px-4 sm:max-w-2xl">
        <SectionHeading
          kicker="Integraciones"
          title="Se integra con tu ecosistema digital."
          sub="Si ya tienes canales, tiendas o herramientas funcionando, el sistema se conecta con ellas."
        />

        <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
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
      </div>
    </section>
  );
}
