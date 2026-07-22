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
/* The film — seven states, one continuous take                       */
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
  { id: "burst", state: "DISPERSE", readout: "no mass", vh: 150 },
  { id: "field", state: "INDEX", readout: "8 fields", vh: 175 },
  { id: "network", state: "ROUTE", readout: "412 nodes", vh: 190 },
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
  /** T0 → T1, the burst */
  burst: actWindow("burst"),
  /** T1 → T2, settling into the data field */
  field: actWindow("field"),
  /** T2 → T3, the field folding into the route network */
  network: actWindow("network"),
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

export const FIELD = {
  eyebrow: "03 — The field",
  head: "Matter becomes\naddressable.",
  body: "Once the object is resolved, it stops being cargo and starts being queryable. Eight fields describe any unit on the network, and every one of them is filterable, sortable, and joinable against every other unit that has ever moved.",
  fields: [
    { k: "IDENTITY", v: "unit, heat, certificate" },
    { k: "GEOMETRY", v: "gauge, width, ⌀, mass" },
    { k: "ORIGIN", v: "mill, rolling date, grade" },
    { k: "CUSTODY", v: "every hand it passed through" },
    { k: "POSITION", v: "yard, rack, bed, gate" },
    { k: "MOTION", v: "vector, ETA, dwell" },
    { k: "CONDITION", v: "edge, coating, moisture" },
    { k: "LEDGER", v: "cost, invoice, terms" },
  ],
};

export const NETWORK = {
  eyebrow: "04 — The network",
  head: "One object.\nFour hundred\nplaces to be.",
  body: "The same resolution applied to every unit, in every yard, on every truck, at once. Routing stops being a scheduling problem and becomes a lookup — the network already knows where the steel is and what it costs to move it.",
  /* `display` opts a stat out of the count-up. "24/7" is an idiom, not a
     quantity — animating it renders nonsense like "3/7" on the way up. */
  stats: [
    { v: 412, k: "Nodes", note: "yards, mills, ports, sidings" },
    { v: 8, k: "Fields", note: "per unit, always populated" },
    { v: 400, suffix: " ms", k: "Index latency", note: "capture to queryable" },
    { display: "24/7", k: "Custody", note: "no unattributed hours" },
  ] as { v?: number; suffix?: string; display?: string; k: string; note: string }[],
};

export const OPS = {
  eyebrow: "05 — Operations",
  head: "The console.",
  body: "One surface for the whole network. Not a dashboard bolted onto a spreadsheet — the interface and the index are the same thing.",
  modules: [
    { no: "01", name: "Manifest", detail: "Every unit on the network, live, filterable down to heat number." },
    { no: "02", name: "Custody", detail: "An unbroken chain from mill gate to customer gate. No gaps to reconcile." },
    { no: "03", name: "Routing", detail: "Vectors solved against real capacity, not against a planning fiction." },
    { no: "04", name: "Ledger", detail: "Cost lands on the unit, not on the month. Margin per coil, not per quarter." },
  ],
};

export const DISPATCH = {
  eyebrow: "06 — Dispatch",
  head: "Put a unit\non the network.",
  body: "LODE is a concept piece — a demonstration of what freight software could look like if it treated cargo as an object rather than a row. There is nothing to sign up for.",
  ctaPrimary: "See the build notes",
  ctaSecondary: "Back to the top",
};

export const NAV = [
  { id: "lift", label: "Unit" },
  { id: "scan", label: "Resolution" },
  { id: "field", label: "Fields" },
  { id: "network", label: "Network" },
  { id: "dispatch", label: "Dispatch" },
];
