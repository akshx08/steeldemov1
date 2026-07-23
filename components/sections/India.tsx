import { REACH } from "@/lib/site";
import Counter from "./Counter";
import Heading from "./Heading";

/**
 * The reach act. The map IS the visual — it fills the centre-right of the
 * frame in WebGL — so the copy stays a compact column on the left and gets out
 * of its way. On phones the map fills the screen behind the copy, so the body
 * and note drop away there and only the headline + one count-up stat remain,
 * which keeps the map readable instead of tiling paragraphs across it.
 */
export default function India() {
  return (
    <div className="w-full max-w-[1380px]">
      <div className="max-w-[30ch] lg:max-w-[34ch]">
        <Heading eyebrow={REACH.eyebrow} head={REACH.head} size="lg" />

        <p className="mt-7 hidden max-w-[52ch] text-[15px] leading-relaxed text-ash sm:block">
          {REACH.body}
        </p>

        <div className="mt-8 flex items-end gap-5">
          <div>
            <span className="font-disp text-[44px] font-light leading-none text-white">
              <Counter to={REACH.stat.v} />
            </span>
            <span className="label mt-2 block text-signalHi">{REACH.stat.k}</span>
          </div>
          <p className="mb-1 hidden max-w-[22ch] text-[12.5px] leading-snug text-mute sm:block">
            {REACH.note}
          </p>
        </div>
      </div>
    </div>
  );
}
