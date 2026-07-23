import { CONTACT, DISPATCH, PRODUCTS } from "@/lib/site";

export default function Dispatch() {
  return (
    <div className="w-full max-w-[1380px]">
      <p className="label label-lg mb-6 flex items-center gap-3 text-ash">
        <span className="h-px w-9 bg-signal" />
        {DISPATCH.eyebrow}
      </p>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <h2 className="display display-hero text-[16vw] leading-[0.86] text-white md:text-[9vw] lg:text-[6.4vw]">
            {DISPATCH.head.split("\n").map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h2>
          <p className="lead mt-7 max-w-[46ch] text-ash">{DISPATCH.body}</p>
          <p className="spec mt-4 max-w-[46ch] text-mute">{DISPATCH.note}</p>
        </div>

        <div className="lg:col-span-5 lg:col-start-8 lg:self-center">
          <div className="glass ticks">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <span className="label text-white">Enquiry</span>
              <span className="spec text-mute">{CONTACT.hours}</span>
            </div>

            <div className="divide-y divide-line2">
              {[
                { label: CONTACT.waLabel, value: CONTACT.phone, href: CONTACT.wa, ext: true },
                { label: "Call the desk", value: CONTACT.phone, href: CONTACT.phoneHref },
                { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
              ].map((row) => (
                <a
                  key={row.label}
                  href={row.href}
                  {...(row.ext ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="group flex items-center justify-between gap-4 px-6 py-5 transition-colors duration-400 ease-house hover:bg-signal/[0.07]"
                >
                  <span>
                    <span className="label block text-mute">{row.label}</span>
                    <span className="font-disp break-all text-xl font-medium text-white">
                      {row.value}
                    </span>
                  </span>
                  <span className="spec text-signalHi transition-transform duration-400 ease-house group-hover:translate-x-1">
                    →
                  </span>
                </a>
              ))}
            </div>

            <div className="border-t border-line px-6 py-4">
              <p className="label mb-3 text-mute">Include</p>
              <p className="spec leading-relaxed text-ash">
                GRADE · GAUGE · WIDTH · QUANTITY · DELIVERY LOCATION
              </p>
            </div>
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
            {PRODUCTS.map((p) => (
              <li key={p.no} className="spec text-mute">
                {p.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
