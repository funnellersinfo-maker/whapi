"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CtaButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  size?: "lg" | "md";
  dimmed?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export function CtaButton({
  children,
  href,
  onClick,
  size = "lg",
  dimmed,
  disabled,
  className,
  type = "button",
}: CtaButtonProps) {
  const cls = cn(
    "relative inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(180deg,#05f485_0%,#00dd6e_52%,#00c45d_100%)] font-extrabold uppercase tracking-[0.05em] text-[#03150c] select-none",
    "shadow-[0_16px_44px_-12px_rgba(0,230,118,0.7),inset_0_1px_0_rgba(255,255,255,0.4)]",
    "transition-[transform,filter,box-shadow] duration-200 hover:brightness-[1.07]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.97]",
    size === "lg" ? "h-[54px] px-7 text-[14.5px]" : "h-12 px-6 text-[13px]",
    (dimmed || disabled) && "pointer-events-none opacity-40",
    className
  );

  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
