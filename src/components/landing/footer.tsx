"use client";

import { useEffect, useState } from "react";
import { AdminGear } from "@/components/admin/admin-panel";
import { MARKETS, detectMarket, type MarketConfig } from "@/lib/market";

export function Footer() {
  const year = new Date().getFullYear();
  // País según el mercado de la URL (Colombia / México). El HTML se
  // prerenderiza con Colombia; al montar se corrige al país real.
  // Lectura única de location al montar: es un sistema externo (la URL),
  // no estado derivado de props.
  const [mk, setMk] = useState<MarketConfig>(MARKETS.CO);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura one-shot de la URL en el montaje
    setMk(MARKETS[detectMarket()]);
  }, []);
  return (
    <footer className="mt-auto border-t border-white/6 bg-[#040607]">
      <div className="mx-auto max-w-md px-4 pb-28 pt-9 text-center sm:max-w-2xl">
        <p className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-ink/75">
          Julián Alejandro
        </p>
        <p className="mt-1.5 text-[12px] text-dim">
          Automatización comercial con IA · {mk.country}
        </p>
        <p className="mt-4 text-[11px] text-dim/60">
          © {year}. Todos los derechos reservados.
        </p>
        <AdminGear />
      </div>
    </footer>
  );
}
