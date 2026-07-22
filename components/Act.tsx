"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { actWindow } from "@/lib/site";

/**
 * One act: a tall scroll span with a sticky stage of copy inside it.
 *
 * Opacity is driven by the section's own span, not by page height, so acts can
 * be reweighted in site.ts without retuning anything here.
 *
 * NOTE the sticky stage: nothing between it and the viewport may set
 * `overflow-x: hidden`, or it sticks to that element instead and every act
 * after the first renders as blank void. `html { overflow-x: clip }` only.
 */
export default function Act({
  id,
  vh,
  children,
  className = "",
  place = "center",
  /** fraction of the act spent ramping in; the first act uses 0 because it is
      already on screen at scrollY 0 and must not be scrolled into existence */
  entry = 0.18,
}: {
  id: string;
  vh: number;
  children: React.ReactNode;
  className?: string;
  place?: "center" | "left" | "right" | "bottom";
  entry?: number;
}) {
  const secRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sec = secRef.current;
    const stage = stageRef.current;
    if (!sec || !stage) return;

    if (prefersReducedMotion()) {
      stage.style.opacity = "1";
      return;
    }

    /* `?act=0.62` pins the whole page, not just the film: the act that owns
       that progress shows its copy and the rest stay dark. Without this the
       pin renders every beat stacked under the hero headline. */
    const raw = new URLSearchParams(window.location.search).get("act");
    const parsedPin = raw !== null ? parseFloat(raw) : NaN;
    if (Number.isFinite(parsedPin)) {
      const p = Math.min(1, Math.max(0, parsedPin));
      const [a, b] = actWindow(id);
      const on = p >= a && p < b;
      stage.style.opacity = on ? "1" : "0";
      stage.style.visibility = on ? "visible" : "hidden";
      stage.style.transform = "none";
      return;
    }

    let raf = 0;
    let last = 0;
    let o = entry <= 0 ? 1 : 0;
    stage.style.opacity = String(o);

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const snap = t - last > 250;
      last = t;

      const r = sec.getBoundingClientRect();
      const travel = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / travel));

      const inA = entry <= 0 ? 1 : Math.min(1, p / entry);
      const outA = Math.min(1, (1 - p) / 0.2);
      const targetO = Math.max(0, Math.min(inA, outA));

      o = snap ? targetO : o + (targetO - o) * 0.14;
      stage.style.opacity = String(o);
      stage.style.transform = `translate3d(0, ${(0.5 - p) * 24}px, 0)`;
      stage.style.pointerEvents = o > 0.55 ? "auto" : "none";
      /* `pointer-events: none` stops the mouse but not the Tab key or a screen
         reader — a faded act would still take focus. `visibility` removes it
         from both. */
      stage.style.visibility = o > 0.02 ? "visible" : "hidden";
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [entry, id]);

  const placement =
    place === "left"
      ? "items-center justify-start"
      : place === "right"
        ? "items-center justify-end"
        : place === "bottom"
          ? "items-end justify-center pb-24"
          : "items-center justify-center";

  return (
    <section ref={secRef} id={id} style={{ height: `${vh}vh` }} className="relative">
      <div className="sticky top-0 h-[100svh] w-full">
        <div
          ref={stageRef}
          data-stage
          style={{ opacity: 0 }}
          className={`flex h-full w-full px-6 md:px-12 lg:px-16 ${placement} ${className}`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
