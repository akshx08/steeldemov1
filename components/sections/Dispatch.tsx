import { BRAND, DISPATCH, OPS } from "@/lib/site";

export default function Dispatch() {
  return (
    <div className="w-full max-w-[1380px]">
      <p className="label mb-6 flex items-center gap-3 text-ash">
        <span className="h-px w-9 bg-signal" />
        {DISPATCH.eyebrow}
      </p>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <h2 className="display text-[11.5vw] leading-[0.94] text-white md:text-[8.4vw] lg:text-[6vw]">
            {DISPATCH.head.split("\n").map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h2>
          <p className="mt-7 max-w-[46ch] text-[15px] leading-relaxed text-ash">
            {DISPATCH.body}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#top" className="btn btn--solid">
              {DISPATCH.ctaSecondary}
            </a>
            <a href="#lift" className="btn">
              Replay the unload
            </a>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8 lg:self-center">
          <div className="glass ticks">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="label text-white">{OPS.eyebrow}</span>
              <span className="spec text-mute">{BRAND.wordmark}</span>
            </div>
            <p className="px-5 py-5 text-[14px] leading-relaxed text-ash">{OPS.body}</p>
            <div className="border-t border-line2 px-5 py-4">
              <p className="label mb-2 text-mute">Status</p>
              <p className="spec text-signalHi">CONCEPT BUILD · NO LIVE SERVICE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
