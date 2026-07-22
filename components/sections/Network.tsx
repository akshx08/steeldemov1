import { NETWORK, OPS } from "@/lib/site";
import Counter from "./Counter";
import Heading from "./Heading";

export default function Network() {
  return (
    <div className="w-full max-w-[1380px]">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Heading
          eyebrow={NETWORK.eyebrow}
          head={NETWORK.head}
          body={NETWORK.body}
          size="lg"
          className="lg:col-span-5"
        />

        <div className="lg:col-span-6 lg:col-start-7 lg:self-center">
          <dl className="glass ticks grid grid-cols-2 gap-px bg-line2 md:grid-cols-4">
            {NETWORK.stats.map((s) => (
              <div key={s.k} className="bg-void/25 px-4 py-3.5 sm:py-5">
                <dd className="font-disp text-[26px] font-light leading-none text-white">
                  {s.display ? (
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{s.display}</span>
                  ) : (
                    <Counter to={s.v ?? 0} suffix={s.suffix ?? ""} />
                  )}
                </dd>
                <dt className="label mt-3 text-signalHi">{s.k}</dt>
                <p className="mt-1.5 text-[12.5px] leading-snug text-mute">{s.note}</p>
              </div>
            ))}
          </dl>

          {/* The act is a pinned 100svh stage, so this column has to FIT a
              phone screen — it cannot scroll away. Below `sm` the modules keep
              their names and drop their descriptions, which is what takes the
              section from 1104px to inside the viewport. */}
          <ul className="mt-4 grid grid-cols-2 gap-px bg-line2 sm:mt-6">
            {OPS.modules.map((m) => (
              <li key={m.no} className="glass bg-void/20 px-4 py-3 sm:px-5 sm:py-5">
                <div className="flex items-baseline gap-2.5 sm:gap-3">
                  <span className="spec text-mute">{m.no}</span>
                  <h3 className="font-disp text-[14px] font-medium text-white sm:text-[16px]">
                    {m.name}
                  </h3>
                </div>
                <p className="mt-2 hidden text-[13px] leading-relaxed text-ash sm:block">
                  {m.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
