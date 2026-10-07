import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function PhoneFrame({ children, title, subtitle, className }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[340px] rounded-[2.2rem] border border-white/10 bg-[#0b0f10] p-2.5",
        "shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9),0_0_60px_-30px_rgba(37,211,102,0.4)]",
        className
      )}
    >
      <div className="overflow-hidden rounded-[1.7rem] bg-[#0d1214]">
        <div className="flex items-center gap-2.5 border-b border-white/5 bg-[#11171a]/80 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(140deg,#173626,#0d1f16)]">
            <MessageCircle className="h-4 w-4 text-wa" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight text-ink">
              {title}
            </p>
            {subtitle ? (
              <p className="flex items-center gap-1 text-[10.5px] leading-tight text-dim">
                <span className="h-1.5 w-1.5 rounded-full bg-wa-bright" />
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-2.5 px-3 py-4">{children}</div>
      </div>
    </div>
  );
}

interface ChatBubbleProps {
  text: string;
  time: string;
  from: "client" | "ai";
}

export function ChatBubble({ text, time, from }: ChatBubbleProps) {
  if (from === "ai") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-br-md border border-wa/25 bg-wa/[0.13] px-3.5 py-2.5">
          <p className="text-[13px] leading-snug text-ink">{text}</p>
          <p className="mt-1 text-right text-[9.5px] text-dim">{time}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[82%] rounded-2xl rounded-bl-md bg-[#1b2224] px-3.5 py-2.5">
        <p className="text-[13px] leading-snug text-ink/90">{text}</p>
        <p className="mt-1 text-[9.5px] text-dim">{time}</p>
      </div>
    </div>
  );
}
