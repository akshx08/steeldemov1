"use client";

import { useEffect, useRef } from "react";
import { ACTS, ACT_WINDOWS } from "@/lib/site";
import { scrollProgress, world } from "@/lib/store";

/**
 * The state ladder and the unit readout — the spine of the interface.
 *
 * The readout does the argument of the whole page in one number: it starts as
 * a MASS, becomes a LENGTH as the coil unrolls, a STRIP COUNT as it is slit,
 * and ends as a DESTINATION count once the strips lay down as the map. The same
 * object, measured in different units, as it stops being cargo and becomes a place.
 *
 * Written straight to the DOM inside one rAF loop — no React state per frame.
 */

type Reading = { value: string; unit: string };

function reading(idx: number, t: number): Reading {
  const n = (v: number) => Math.round(v).toLocaleString("en-US").replace(/,/g, " ");
  switch (ACTS[idx]?.id) {
    case "manifest":
    case "lift":
      return { value: "24.6", unit: "tonnes" };
    case "uncoil":
      // length of steel unrolling
      return { value: n(t * 312), unit: "m unrolled" };
    case "slit":
      // strips falling away under the knives
      return { value: n(t * 46), unit: "strips cut" };
    case "india":
      // destinations lighting up as the map assembles
      return { value: n(t * 28), unit: "destinations" };
    default:
      return { value: "READY", unit: "for dispatch" };
  }
}

export default function Readout() {
  const valRef = useRef<HTMLSpanElement>(null);
  const unitRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let lastIdx = -1;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      /* `world.progress` is written only by the WebGL loop. If the renderer
         failed to construct, that loop never runs and reading it blind would
         freeze the HUD at 0% for the whole page. */
      const p = world.ready ? world.progress : scrollProgress();

      let idx = 0;
      for (let i = 0; i < ACT_WINDOWS.length; i++) if (p >= ACT_WINDOWS[i][0]) idx = i;
      const [a, b] = ACT_WINDOWS[idx];
      const t = Math.min(1, Math.max(0, (p - a) / (b - a)));

      const rd = reading(idx, t);
      if (valRef.current) valRef.current.textContent = rd.value;
      if (unitRef.current) unitRef.current.textContent = rd.unit;
      if (pctRef.current) pctRef.current.textContent = (p * 100).toFixed(1).padStart(4, "0");
      if (needleRef.current) needleRef.current.style.transform = `translateY(${p * 100}%)`;

      if (idx !== lastIdx) {
        lastIdx = idx;
        if (stateRef.current) stateRef.current.textContent = ACTS[idx].state;
        rowRefs.current.forEach((el, i) => {
          if (el) el.dataset.on = i === idx ? "1" : "0";
        });
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* the state ladder */}
      <div className="pointer-events-none fixed left-0 top-0 z-40 hidden h-[100svh] w-[188px] flex-col justify-center pl-7 lg:flex">
        <div className="flex gap-5">
          <div className="relative w-px bg-line">
            <div
              ref={needleRef}
              className="absolute left-1/2 top-0 h-6 w-[3px] -translate-x-1/2 bg-signal"
              style={{ boxShadow: "0 0 16px rgb(var(--signal) / 0.95)" }}
            />
          </div>
          <ul className="flex flex-col gap-[19px]">
            {ACTS.map((s, i) => (
              <li
                key={s.id}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                data-on="0"
                className="group flex items-baseline gap-3 transition-opacity duration-500 ease-house data-[on='0']:opacity-30 data-[on='1']:opacity-100"
              >
                <span className="label w-[74px] shrink-0 text-white transition-colors duration-500 ease-house group-data-[on='1']:text-signalHi">
                  {s.state}
                </span>
                <span className="spec text-mute">{s.readout}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* the unit readout */}
      <div className="pointer-events-none fixed bottom-6 left-6 z-40 lg:bottom-8 lg:left-8">
        <div className="glass ticks px-4 py-3 lg:px-5 lg:py-4">
          <div className="label mb-1.5 text-mute">Unit LD-0001</div>
          <span
            ref={valRef}
            className="block font-disp text-3xl font-light leading-none tracking-tight text-white lg:text-4xl"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            24.6
          </span>
          <span ref={unitRef} className="spec mt-1.5 block text-signalHi">
            tonnes
          </span>
          <div className="mt-2.5 flex items-center gap-2 border-t border-line2 pt-2.5">
            <span ref={stateRef} className="label text-white">
              LOADED
            </span>
            <span className="h-px w-4 bg-line" />
            <span className="spec text-mute">
              <span ref={pctRef}>00.0</span>%
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
