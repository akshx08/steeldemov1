/**
 * LODE — the freight operating system.
 *
 * A concept brand, not a real company: every figure here is invented for the
 * piece and is marked as such. Nothing in this file should be lifted into a
 * real client build without being replaced.
 */

export const BRAND = {
  name: "LODE",
  /** a lode is a vein of ore in rock — and the thing on the truck */
  wordmark: "LODE",
  tagline: "The freight operating system.",
  descriptor: "Concept · not a live service",
};

/* ------------------------------------------------------------------ */
/* The film — six states, one continuous take                         */
/* ------------------------------------------------------------------ */

export type Act = {
  id: string;
  /** HUD state name */
  state: string;
  /** HUD sub-readout */
  readout: string;
  vh: number;
};

export const ACTS: Act[] = [
  { id: "manifest", state: "LOADED", readout: "24.6 t", vh: 150 },
  { id: "lift", state: "LIFT", readout: "1.62 m ⌀", vh: 165 },
  { id: "scan", state: "SCAN", readout: "1 048 576 pts", vh: 175 },
  { id: "burst", state: "SHATTER", readout: "no mass", vh: 150 },
  { id: "india", state: "REACH", readout: "28 nodes", vh: 200 },
  { id: "dispatch", state: "DISPATCH", readout: "ready", vh: 150 },
];

export const TOTAL_VH = ACTS.reduce((a, b) => a + b.vh, 0);

export const ACT_WINDOWS: [number, number][] = (() => {
  const out: [number, number][] = [];
  let acc = 0;
  for (const a of ACTS) {
    out.push([acc / TOTAL_VH, (acc + a.vh) / TOTAL_VH]);
    acc += a.vh;
  }
  return out;
})();

export const actWindow = (id: string): [number, number] =>
  ACT_WINDOWS[ACTS.findIndex((a) => a.id === id)] ?? [0, 1];

/** where in the film each morph target takes over — the whole choreography */
export const MORPH = {
  /** points appear on the coil's surface */
  scan: actWindow("scan"),
  /** T0 → T1, the coil shatters */
  shatter: actWindow("burst"),
  /** T1 → T2, the shards reassemble into India */
  india: actWindow("india"),
};

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

export const HERO = {
  eyebrow: "Freight operating system",
  head: ["EVERY TONNE,", "ADDRESSABLE."],
  sub: "A coil leaves a mill as twenty-four tonnes of steel and arrives as a line on an invoice. LODE is what happens in between — the same object, tracked as matter and as data, from the bed of the truck to the row in the ledger.",
  cue: "Scroll to unload",
};

export const LIFT = {
  eyebrow: "01 — The unit",
  head: "Freight is not\na shipment.\nIt is an object.",
  body: "Most systems track a consignment: a number, a weight, a destination. LODE tracks the thing itself. Its gauge, its heat number, its mill certificate, the saddle it sat on, the crane that moved it, the truck it left on.",
  specs: [
    { k: "Unit", v: "LD-0001" },
    { k: "Product", v: "HR coil · IS 2062" },
    { k: "Mass", v: "24.6 t" },
    { k: "Outer ⌀", v: "1 620 mm" },
    { k: "Width", v: "1 250 mm" },
    { k: "Heat", v: "H-44802" },
  ],
};

export const SCAN = {
  eyebrow: "02 — Resolution",
  head: "Then we take\nit apart.",
  body: "Every surface the unit presents becomes a sample point. Geometry, mass distribution, dwell time, handling events, temperature on arrival. A million points per unit, and none of them are a guess.",
  points: [
    { k: "Sample density", v: "1 048 576 pts / unit" },
    { k: "Capture", v: "Gantry LiDAR + bed load cells" },
    { k: "Latency", v: "< 400 ms to index" },
  ],
};

export const SHATTER = {
  eyebrow: "03 — Release",
  head: "Nothing about it\nwas ever\nthe steel.",
  body: "Twenty-four tonnes come apart into the million points that described them. What is left is not cargo — it is the record of where this unit has to be.",
};

export const REACH = {
  eyebrow: "04 — Reach",
  head: "Every unit\nhas a\ndestination.",
  body: "The object resolved to a point is now resolved to a place. The shattered cloud reassembles as the country the steel moves across — every node a delivery, the whole reach held in a single frame.",
  stat: { v: 28, k: "Destinations", note: "live on the map" },
  note: "The map is abstract; the reach is the point.",
};

export const OPS = {
  eyebrow: "The console",
  head: "The console.",
  body: "One surface for the whole reach — from the bed of the truck to the row in the ledger. The interface and the index are the same thing.",
};

export const DISPATCH = {
  eyebrow: "05 — Dispatch",
  head: "Put a unit\non the map.",
  body: "LODE is a concept piece — a demonstration of what freight software could look like if it treated cargo as an object, and every object as a place on the map. There is nothing to sign up for.",
  ctaPrimary: "See the build notes",
  ctaSecondary: "Back to the top",
};

export const NAV = [
  { id: "lift", label: "Unit" },
  { id: "scan", label: "Resolution" },
  { id: "india", label: "Reach" },
  { id: "dispatch", label: "Dispatch" },
];
