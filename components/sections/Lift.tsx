import { LIFT } from "@/lib/site";
import Heading from "./Heading";

export default function Lift() {
  return (
    <div className="grid w-full max-w-[1380px] gap-12 lg:grid-cols-12 lg:gap-16">
      <Heading
        eyebrow={LIFT.eyebrow}
        head={LIFT.head}
        body={LIFT.body}
        size="lg"
        className="lg:col-span-6"
      />

      <div className="lg:col-span-5 lg:col-start-8 lg:self-center">
        <div className="glass ticks">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="label text-white">Manifest</span>
            <span className="spec text-mute">live</span>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-line2">
            {LIFT.specs.map((s) => (
              <div key={s.k} className="bg-void/25 px-5 py-4">
                <dt className="label mb-2 text-mute">{s.k}</dt>
                <dd className="spec text-[13px] text-white">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
