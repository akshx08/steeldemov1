import { SLIT } from "@/lib/site";
import Heading from "./Heading";

export default function Slit() {
  return (
    <div className="grid w-full max-w-[1380px] gap-12 lg:grid-cols-12 lg:gap-16">
      <Heading
        eyebrow={SLIT.eyebrow}
        head={SLIT.head}
        body={SLIT.body}
        size="lg"
        className="lg:col-span-5"
      />

      <ul className="lg:col-span-5 lg:col-start-8 lg:self-center">
        {SLIT.points.map((p) => (
          <li
            key={p.k}
            className="flex items-baseline gap-5 border-b border-line2 py-4 last:border-b-0"
          >
            <span className="label w-[132px] shrink-0 text-mute">{p.k}</span>
            <span className="spec flex-1 text-[13px] text-white">{p.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
