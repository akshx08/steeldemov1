"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND, NAV } from "@/lib/site";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const onScroll = () => {
      bar.dataset.lifted = window.scrollY > 40 ? "1" : "0";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        ref={barRef}
        data-lifted="0"
        className="fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-house data-[lifted='1']:border-b data-[lifted='1']:border-line data-[lifted='1']:bg-void/60 data-[lifted='1']:backdrop-blur-xl"
      >
        <div className="flex items-center justify-between px-6 py-5 md:px-10">
          <a href="#top" className="flex items-baseline gap-3">
            <span className="font-disp text-[17px] font-semibold tracking-[0.3em] text-white">
              {BRAND.wordmark}
            </span>
            <span className="spec hidden text-mute sm:inline">{BRAND.descriptor}</span>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="label text-ash transition-colors duration-300 ease-house hover:text-signalHi"
              >
                {n.label}
              </a>
            ))}
          </nav>

          {/* No aria-label: it would override the visible Index/Close text,
              leaving a spoken name that never matches the screen. */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="nav-drawer"
            className="label flex items-center gap-2.5 text-white lg:hidden"
          >
            {open ? "Close" : "Index"}
            <span className="flex h-3 w-4 flex-col justify-between">
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
              <span className="h-px w-full bg-current" />
            </span>
          </button>
        </div>
      </div>

      {/*
        `transition-all` would include `visibility`, which makes the menu's
        ability to OPEN depend on an animation completing. On a page whose
        animation clock is stalled — a backgrounded tab, a throttled one, a
        cheap phone mid-jank — the button would flip to aria-expanded="true"
        while the panel stayed invisible. Visibility is never animated here:
        opening flips it instantly, and closing delays it until after the fade
        so the panel does not snap out.
      */}
      <div
        id="nav-drawer"
        className="fixed inset-0 z-[49] flex flex-col justify-center gap-1 bg-void/95 px-8 backdrop-blur-2xl lg:hidden"
        style={{
          transition: open
            ? "opacity 500ms cubic-bezier(0.4,0,0.2,1), clip-path 500ms cubic-bezier(0.4,0,0.2,1)"
            : "opacity 500ms cubic-bezier(0.4,0,0.2,1), clip-path 500ms cubic-bezier(0.4,0,0.2,1), visibility 0s linear 500ms",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
          /* opacity and clip-path are paint-only — a closed drawer would still
             be in the tab order and read out. `visibility` removes it. */
          visibility: open ? "visible" : "hidden",
        }}
      >
        {NAV.map((n, i) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            onClick={() => setOpen(false)}
            className="display flex items-baseline gap-4 py-2 text-4xl text-white"
          >
            <span className="spec text-mute">{String(i + 1).padStart(2, "0")}</span>
            {n.label}
          </a>
        ))}
        <p className="spec mt-8 text-mute">{BRAND.tagline}</p>
      </div>
    </>
  );
}
