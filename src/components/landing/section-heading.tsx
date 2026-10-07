import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

interface SectionHeadingProps {
  kicker?: string;
  title: ReactNode;
  sub?: string;
  tone?: "wa" | "gold";
  className?: string;
}

export function SectionHeading({
  kicker,
  title,
  sub,
  tone = "wa",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mx-auto max-w-xl text-center", className)}>
      {kicker ? (
        <Reveal>
          <p
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.28em]",
              tone === "wa" ? "text-wa" : "text-gold"
            )}
          >
            {kicker}
          </p>
        </Reveal>
      ) : null}
      <Reveal delay={0.06}>
        <h2 className="font-display mt-3 text-balance text-[26px] font-bold uppercase leading-[1.1] tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      {sub ? (
        <Reveal delay={0.12}>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-dim sm:text-base">
            {sub}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
