import { BRAND, CONTACT, MILLS, NAV, PRODUCTS, TERMS } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-void/88 backdrop-blur-xl">
      <div className="mx-auto max-w-[1380px] px-6 py-14 md:px-12 lg:px-16">
        {/* the standing terms — NR's four promises */}
        <div className="grid gap-px bg-line2 sm:grid-cols-2 lg:grid-cols-4">
          {TERMS.map((t) => (
            <div key={t.no} className="bg-void/20 px-5 py-6">
              <div className="flex items-baseline gap-3">
                <span className="spec text-signalHi">{t.no}</span>
                <h3 className="font-disp text-[15px] font-medium leading-tight text-white">
                  {t.head}
                </h3>
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ash">{t.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="font-disp text-[17px] font-semibold tracking-[0.2em] text-white">
              {BRAND.wordmark}
            </p>
            <p className="mt-3 max-w-[34ch] text-[13.5px] leading-relaxed text-ash">
              {BRAND.tagline} Flat steel bought off India&apos;s largest mills since {BRAND.since},
              slit and cut to your drawing.
            </p>
            <div className="mt-5 space-y-1.5">
              <a href={CONTACT.phoneHref} className="spec block text-ash hover:text-signalHi">
                {CONTACT.phone}
              </a>
              <a href={`mailto:${CONTACT.email}`} className="spec block break-all text-ash hover:text-signalHi">
                {CONTACT.email}
              </a>
              <p className="spec text-mute">{CONTACT.hours}</p>
            </div>
          </div>

          <div className="md:col-span-4">
            <p className="label mb-4 text-mute">The book</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {PRODUCTS.map((p) => (
                <li key={p.no} className="spec text-ash">
                  {p.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="label mb-4 text-mute">Mills</p>
            <ul className="space-y-2">
              {MILLS.map((m) => (
                <li key={m.name} className="spec text-ash">
                  {m.name}
                </li>
              ))}
            </ul>
          </div>

          <nav className="md:col-span-2">
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
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="spec text-mute">
            © {BRAND.since}–{new Date().getFullYear()} {BRAND.name}
          </p>
          <p className="spec text-mute">coil → sheet → slit → delivered</p>
        </div>
      </div>
    </footer>
  );
}
