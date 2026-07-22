import { BRAND, NAV } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-void/88 backdrop-blur-xl">
      <div className="mx-auto max-w-[1380px] px-6 py-12 md:px-12 lg:px-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-disp text-[17px] font-semibold tracking-[0.3em] text-white">
              {BRAND.wordmark}
            </p>
            <p className="mt-3 max-w-[42ch] text-[13.5px] leading-relaxed text-ash">
              {BRAND.tagline} A concept piece — a demonstration of freight software that treats
              cargo as an object rather than a row. Every figure on this page is invented for the
              build.
            </p>
          </div>

          <nav className="md:col-span-3">
            <p className="label mb-4 text-mute">Index</p>
            <ul className="space-y-2">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    className="spec text-ash transition-colors duration-300 ease-house hover:text-signalHi"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <p className="label mb-4 text-mute">Build</p>
            <ul className="space-y-2">
              <li className="spec text-ash">Three.js · procedural</li>
              <li className="spec text-ash">GSAP ScrollTrigger</li>
              <li className="spec text-ash">Lenis · lerp 0.09</li>
              <li className="spec text-ash">62 000 points, 4 targets</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="spec text-mute">{BRAND.descriptor}</p>
          <p className="spec text-mute">24.6 t → 1 048 576 pts → 412 nodes</p>
        </div>
      </div>
    </footer>
  );
}
