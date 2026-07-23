import { ReactNode } from "react";

/** Eyebrow + display headline + optional body. Every act opens with this. */
export default function Heading({
  eyebrow,
  head,
  body,
  size = "md",
  children,
  className = "",
}: {
  eyebrow: string;
  /** newlines become line breaks — the copy controls its own ragging */
  head: string;
  body?: string;
  size?: "md" | "lg";
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="label label-lg mb-6 flex items-center gap-3 text-ash">
        <span className="h-px w-9 bg-signal" />
        {eyebrow}
      </p>
      <h2
        className={`display display-hero text-white ${
          size === "lg"
            ? "text-[8.6vw] leading-[0.92] md:text-[6vw] lg:text-[4.7vw]"
            : "text-[7.6vw] leading-[0.94] md:text-[4.6vw] lg:text-[3.5vw]"
        }`}
      >
        {head.split("\n").map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </h2>
      {body && <p className="lead mt-7 max-w-[52ch] text-ash">{body}</p>}
      {children}
    </div>
  );
}
