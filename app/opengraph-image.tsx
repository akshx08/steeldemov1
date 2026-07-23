import { ImageResponse } from "next/og";
import { BRAND, HERO } from "@/lib/site";

export const alt = "N.R. Trading Co. — flat steel, cut to your drawing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card. Generated at build time rather than shipped as a binary, so
 * it stays in sync with lib/site.ts — the headline here is the headline on the
 * page, not a screenshot that will drift the first time the copy changes.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08090B",
          padding: "72px 80px",
          color: "#F4F7FA",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 34,
              height: 2,
              background: "#E82127",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 22, letterSpacing: 8, color: "#98A0AB" }}>
            {BRAND.tagline.toUpperCase()}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 92,
            lineHeight: 0.98,
            letterSpacing: -3,
          }}
        >
          {HERO.head.map((l) => (
            <div key={l} style={{ display: "flex" }}>
              {l}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 48, letterSpacing: 12, fontWeight: 600 }}>
            {BRAND.wordmark}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#575E69", letterSpacing: 2 }}>
            coil → sheet → slit → delivered
          </div>
        </div>
      </div>
    ),
    size
  );
}
