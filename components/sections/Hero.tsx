import { BRAND, HERO } from "@/lib/site";

/**
 * Reveals are CSS, not Framer Motion — a tween that has not ticked leaves the
 * headline parked below its mask, and the hero is the one thing on this site
 * that must never render empty.
 */
export default function Hero() {
  return (
    <div className="w-full max-w-[1380px]">
      <p
        className="label label-lg fadeup mb-8 flex items-center gap-3 text-ash"
        style={{ animationDelay: "0.25s" }}
      >
        <span className="h-px w-9 bg-signal" />
        {HERO.eyebrow}
      </p>

      {/* the longest line ("CUT TO YOUR") sets the ceiling on a 375px screen */}
      <h1 className="display display-hero text-[12vw] leading-[0.9] text-white sm:text-[10.5vw] lg:text-[8vw]">
        {HERO.head.map((line, i) => (
          <span key={line} className="block overflow-hidden pb-[0.06em]">
            <span className="rise" style={{ animationDelay: `${0.35 + i * 0.09}s` }}>
              {line}
            </span>
          </span>
        ))}
      </h1>

      <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12">
        <p
          className="lead fadeup max-w-[56ch] text-ash md:col-span-7 lg:col-span-5"
          style={{ animationDelay: "0.8s" }}
        >
          {HERO.sub}
        </p>

        <p
          className="fadeup label flex items-center gap-3 text-signalHi md:hidden"
          style={{ animationDelay: "1.05s" }}
        >
          <span className="h-px w-6 bg-signal" />
          {HERO.cue}
        </p>

        <div
          className="fadeup hidden items-end md:col-span-5 md:flex md:justify-end lg:col-span-7"
          style={{ animationDelay: "1.05s" }}
        >
          <div className="glass ticks px-5 py-4">
            <div className="label mb-2 text-mute">{BRAND.tagline}</div>
            <div className="flex items-center gap-3">
              <span className="font-disp text-lg font-light text-white">{HERO.cue}</span>
              <span className="relative block h-8 w-px overflow-hidden bg-line">
                <span
                  className="absolute inset-x-0 top-0 h-3 bg-signal"
                  style={{ animation: "sweep 2.4s cubic-bezier(0.4,0,0.2,1) infinite" }}
                />
              </span>
            </div>
            <div className="spec mt-2 text-mute">{BRAND.descriptor}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
