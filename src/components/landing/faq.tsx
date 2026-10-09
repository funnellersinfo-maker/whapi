"use client";

import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MARKETS, detectMarket } from "@/lib/market";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

function getFaqs(minBudget: string) {
  return [
  {
    q: "¿Necesito tener WhatsApp Business?",
    a: "No es un requisito para empezar. Si ya lo usas, trabajamos sobre él. En la sesión se define qué configuración le conviene a tu negocio.",
  },
  {
    q: "¿Necesito tener WhatsApp API?",
    a: "No tienes que gestionarla tú. La infraestructura oficial se configura como parte de la implementación.",
  },
  {
    q: "¿Funciona si todavía recibo pocos mensajes?",
    a: "Sí. De hecho, es el momento ideal: el sistema crece contigo y desde el principio ninguna conversación queda sin atender.",
  },
  {
    q: "¿La IA puede enviar audios?",
    a: "Sí. Puede responder y enviar audios, imágenes, documentos y videos según lo que la conversación necesite.",
  },
  {
    q: "¿Puede entender imágenes?",
    a: "Sí. Si un cliente envía una foto de un producto, una referencia o una captura, la IA la entiende y responde en contexto.",
  },
  {
    q: "¿Puede entender archivos?",
    a: "Sí. PDF, hojas de cálculo y archivos comunes pueden procesarse dentro de la conversación.",
  },
  {
    q: "¿Puede hacer seguimiento?",
    a: "Sí. Puede retomar conversaciones frías, recordar cotizaciones y recuperar oportunidades que se quedaron en el aire.",
  },
  {
    q: "¿Puedo personalizar la personalidad de la IA?",
    a: "Sí. El tono, el estilo y la forma de hablar se configuran para que suene como tu marca, no como un robot.",
  },
  {
    q: "¿Necesito mantener un celular conectado?",
    a: "No. La infraestructura funciona en la nube sobre la API oficial de WhatsApp. Nada depende de un teléfono encendido.",
  },
  {
    q: "¿Es un chatbot tradicional?",
    a: "No. No es un menú de botones: entiende lenguaje natural, audios, imágenes y mantiene el hilo completo de la conversación.",
  },
  {
    q: "¿Tiene mensualidad?",
    a: "No pagas una mensualidad por usar el sistema. La implementación se define según lo que tu negocio necesita.",
  },
  {
    q: "¿Cuánto cuesta implementarlo?",
    a: `La implementación más básica parte desde ${minBudget}. En la sesión se define exactamente qué configuración tiene sentido para ti.`,
  },
  {
    q: "¿La inversión publicitaria está incluida?",
    a: "No. La pauta en Meta Ads se paga directamente a la plataforma. El sistema puede conectarse con la API de Conversiones de Meta para que esa inversión rinda más.",
  },
  {
    q: "¿La IA reemplaza completamente a mi equipo?",
    a: "No busca reemplazar a nadie, sino quitarle lo repetitivo. Tu equipo se encarga de lo que sí requiere criterio humano; el sistema hace el resto.",
  },
  ];
}

export function Faq() {
  // El presupuesto mínimo se adapta al mercado de la URL (COP / MXN).
  const faqs = useMemo(() => getFaqs(MARKETS[detectMarket()].minBudget), []);
  return (
    <section id="faq" className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-md px-4 sm:max-w-xl">
        <SectionHeading kicker="Preguntas frecuentes" title="Resuelve tus dudas" />

        <Reveal className="mt-10" delay={0.05}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`f-${i}`}
                className="border-b border-white/8"
              >
                <AccordionTrigger className="py-4 text-left text-[14.5px] font-semibold leading-snug text-ink hover:no-underline hover:text-wa [&[data-state=open]>svg]:text-wa [&[data-state=open]]:text-wa">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-[13.5px] leading-relaxed text-dim">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
