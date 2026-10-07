"use client";

import { About } from "./about";
import { Bokeh } from "./bokeh";
import { Differentiator } from "./differentiator";
import { Faq } from "./faq";
import { FinalCta } from "./final-cta";
import { Footer } from "./footer";
import { ForWhom } from "./for-whom";
import { Hero } from "./hero";
import { Integrations } from "./integrations";
import { NoMonthly } from "./no-monthly";
import { Problem } from "./problem";
import { Quiz } from "./quiz";
import { Scarcity } from "./scarcity";
import { Solution } from "./solution";
import { StickyCta } from "./sticky-cta";
import { System } from "./system";
import { WhatsAppOfficial } from "./whatsapp-official";

export function Landing() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background">
      <Bokeh />
      <div className="grain" aria-hidden="true" />
      <Hero />
      <main className="relative z-10 flex-1">
        <Problem />
        <Solution />
        <Quiz />
        <System />
        <WhatsAppOfficial />
        <Integrations />
        <Differentiator />
        <NoMonthly />
        <About />
        <Scarcity />
        <ForWhom />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}
