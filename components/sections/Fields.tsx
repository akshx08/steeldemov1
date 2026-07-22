import { FIELD } from "@/lib/site";
import Heading from "./Heading";

export default function Fields() {
  return (
    <div className="grid w-full max-w-[1380px] gap-12 lg:grid-cols-12 lg:gap-16">
      <Heading
        eyebrow={FIELD.eyebrow}
        head={FIELD.head}
        body={FIELD.body}
        size="lg"
        className="lg:col-span-5"
      />

      {/* eight rows, one per band in the field behind — same order, same count */}
      <ol className="glass ticks self-center lg:col-span-6 lg:col-start-7">
        {FIELD.fields.map((f, i) => (
          <li
            key={f.k}
            className="flex items-center gap-4 border-b border-line2 px-5 py-3 last:border-b-0"
          >
            <span className="spec w-5 shrink-0 text-mute">{String(i + 1).padStart(2, "0")}</span>
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{
                background: i === 3 ? "rgb(var(--signal))" : "#BFD4E8",
                boxShadow: `0 0 12px ${i === 3 ? "rgb(var(--signal) / .9)" : "rgba(191,212,232,.55)"}`,
              }}
              aria-hidden
            />
            <span className="label flex-1 text-white">{f.k}</span>
            <span className="spec hidden flex-1 text-ash sm:block">{f.v}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
