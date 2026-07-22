"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const format = (v: number, suffix: string) =>
  Math.round(v).toLocaleString("en-US") + suffix;

/**
 * A number that counts up once, when it first crosses into view.
 *
 * The final value is what gets SERVER-RENDERED, and the animation is purely an
 * enhancement layered on top. Every other arrangement has a failure mode that
 * puts a wrong figure on screen and presents it as fact:
 *
 *   - starting at 0 in the markup → reads "0" with JS disabled, and reads "0"
 *     forever if the IntersectionObserver never fires
 *   - driving the tween from rAF alone → a frame-starved tab (backgrounded,
 *     throttled, or busy) stalls it part-way, so a 412-node network reports 68
 *
 * So: correct value first, then animate away from it and back. The worst case
 * is no animation, never a wrong number.
 */
export default function Counter({
  to,
  suffix = "",
  duration = 1.15,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;

    let raf = 0;
    let timer = 0;
    let start = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      el.textContent = format(to, suffix);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const tick = (t: number) => {
          if (done) return;
          if (!start) start = t;
          const p = Math.min(1, (t - start) / (duration * 1000));
          el.textContent = format(to * (1 - Math.pow(1 - p, 3)), suffix);
          if (p < 1) raf = requestAnimationFrame(tick);
          else done = true;
        };
        el.textContent = format(0, suffix);
        raf = requestAnimationFrame(tick);
        // a timer cannot be frame-starved, so the real value always lands
        timer = window.setTimeout(finish, duration * 1000 + 400);
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [to, suffix, duration]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {format(to, suffix)}
    </span>
  );
}
