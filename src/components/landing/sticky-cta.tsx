"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function StickyCta() {
  const [pastHero, setPastHero] = useState(false);
  const [quizVisible, setQuizVisible] = useState(false);
  const doneRef = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setPastHero(window.scrollY > window.innerHeight * 0.85);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const quizEl = document.getElementById("diagnostico");
    let io: IntersectionObserver | undefined;
    if (quizEl) {
      io = new IntersectionObserver(
        (entries) => {
          setQuizVisible(entries[0]?.isIntersecting ?? false);
        },
        { rootMargin: "-8% 0px -8% 0px" }
      );
      io.observe(quizEl);
    }

    const onDone = () => {
      if (!doneRef.current) {
        doneRef.current = true;
        setDone(true);
      }
    };
    window.addEventListener("landing:booking-complete", onDone);
    window.addEventListener("landing:quiz-completed", onDone);

    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
      window.removeEventListener("landing:booking-complete", onDone);
      window.removeEventListener("landing:quiz-completed", onDone);
    };
  }, []);

  const show = pastHero && !quizVisible && !done;

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-10 backdrop-blur-[4px] [background:linear-gradient(180deg,rgba(5,7,8,0)_0%,rgba(5,7,8,0.92)_42%,#050708_100%)]"
        >
          <a
            href="#diagnostico"
            className="mx-auto flex h-[52px] w-full max-w-md items-center justify-center gap-2 rounded-full bg-[linear-gradient(180deg,#05f485_0%,#00dd6e_52%,#00c45d_100%)] text-[13.5px] font-extrabold uppercase tracking-[0.05em] text-[#03150c] shadow-[0_14px_40px_-10px_rgba(0,230,118,0.7),inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform duration-200 active:scale-[0.97]"
          >
            Quiero ver cómo funciona
          </a>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
