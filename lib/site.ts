/**
 * N.R. Trading Co. — flat steel, cut to your drawing.
 *
 * FACT DISCIPLINE — read before editing.
 * Every figure here is either taken verbatim from N.R. Trading Co.'s own
 * material or arithmetically derived from it (the gauge envelope is the min and
 * max of the product table). Nothing is invented.
 *
 * Deliberately ABSENT because it was never supplied: tonnage, warehouse area,
 * headcount, client count, cities served, revenue, awards, growth timeline.
 * The film is told with the specifications the company actually controls — the
 * India map is "where the steel is needed", never a fabricated destination
 * count; the one number on it is the six real source mills.
 */

export const BRAND = {
  name: "N.R. Trading Co.",
  wordmark: "N.R. TRADING",
  since: 2005,
  tagline: "Flat steel, held to the micron.",
  descriptor: "Since 2005 · Flat steel",
};

export const CONTACT = {
  phone: "+91 98711 50620",
  phoneHref: "tel:+919871150620",
  wa: "https://wa.me/919871150620",
  waLabel: "WhatsApp",
  email: "sachingrg441@gmail.com",
  hours: "Mon – Sat · 09:30 – 19:00 IST",
};

/* ------------------------------------------------------------------ */
/* The film — one coil, processed. Six states, one continuous take.    */
/* ------------------------------------------------------------------ */

export type Act = {
  id: string;
  /** HUD state name */
  state: string;
  /** HUD sub-readout — a verified spec */
  readout: string;
  vh: number;
};

export const ACTS: Act[] = [
  { id: "manifest", state: "LOADED", readout: "IS 2062", vh: 150 },
  { id: "lift", state: "LIFT", readout: "1.6–25 mm", vh: 150 },
  { id: "uncoil", state: "UNROLL", readout: "6 000 mm", vh: 200 },
  { id: "slit", state: "SLIT", readout: "25 mm", vh: 150 },
  { id: "india", state: "REACH", readout: "6 mills", vh: 210 },
  { id: "dispatch", state: "DISPATCH", readout: "24 hr", vh: 150 },
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

export const MORPH = {
  uncoil: actWindow("uncoil"),
  slit: actWindow("slit"),
  india: actWindow("india"),
};

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

export const HERO = {
  eyebrow: "N.R. Trading · since 2005",
  head: ["FLAT STEEL,", "CUT TO YOUR", "DRAWING."],
  sub: "N.R. Trading buys flat steel off India's largest mills — hot rolled, cold rolled, galvanised, galvalume and colour coated — and delivers it slit and cut to your drawing, with the mill's own certificate and a firm price inside one working day.",
  cue: "See it processed",
};

export const LIFT = {
  eyebrow: "01 — The coil",
  head: "It arrives\nas a coil.",
  body: "Every order starts as one of eight flat products, bought against its standard off a primary mill — not a warehouse, not a middleman. Gauge, width and heat number are known before it leaves the gate.",
  specs: [
    { k: "Product", v: "HR Coil" },
    { k: "Standard", v: "IS 2062" },
    { k: "Gauge", v: "1.6 – 25.0 mm" },
    { k: "Bought from", v: "6 primary mills" },
    { k: "Certificate", v: "mill's own, per heat" },
    { k: "The book", v: "8 flat products" },
  ],
};

export const UNCOIL = {
  eyebrow: "02 — Unroll",
  head: "A coil is\na sheet,\nwound.",
  body: "The coil is one continuous sheet, rolled for the crane. Unwound, it goes to length — cut to your drawing, up to six metres, and measured against the number rather than against habit.",
  points: [
    { k: "Cut to length", v: "≤ 6 000 mm" },
    { k: "Standard", v: "IS 2062" },
    { k: "Tolerance", v: "measured to drawing" },
  ],
};

export const SLIT = {
  eyebrow: "03 — Slit",
  head: "Then it's\nslit to\nwidth.",
  body: "The sheet is slit into strips, each sized for the press it is going to — down to twenty-five millimetres, edge deburred, and every strip checked against the drawing before it ships.",
  points: [
    { k: "Slit to", v: "≥ 25 mm" },
    { k: "Cut to length", v: "≤ 6 000 mm" },
    { k: "Papers", v: "ahead of the truck" },
  ],
};

export const REACH = {
  eyebrow: "04 — Reach",
  head: "Wherever\nIndia builds\nwith steel.",
  body: "Bought off six of India's primary mills — Tata, JSW, SAIL, Jindal, AM/NS and POSCO — slit and cut to your drawing, and sent where the steel is needed. One coil in; flat product out, on its way across the country.",
  stat: { v: 6, k: "Source mills", note: "India's primary producers" },
  note: "The map is where the steel goes — not a number we invent.",
};

export const DISPATCH = {
  eyebrow: "05 — Dispatch",
  head: "Send the\ndrawing.",
  body: "Grade, gauge, width, quantity and where it has to be. A firm price comes back inside one working day, with the mill's own certificate riding on every load.",
  note: "There is no form here on purpose — a specification is faster to read than a form is to fill.",
};

/* ------------------------------------------------------------------ */
/* Reference data — the book, the mills, the standing terms            */
/* ------------------------------------------------------------------ */

export const PRODUCTS = [
  { no: "01", name: "HR Coil", full: "Hot Rolled Coil", std: "IS 2062", range: "1.6 – 25.0 mm" },
  { no: "02", name: "CR Coil", full: "Cold Rolled Coil", std: "IS 513", range: "0.30 – 3.00 mm" },
  { no: "03", name: "GP Sheet & Coil", full: "Galvanised Plain", std: "IS 277 · Z90–Z275", range: "0.18 – 3.00 mm" },
  { no: "04", name: "GL Sheet & Coil", full: "Galvalume", std: "AZ70 – AZ150", range: "0.25 – 1.60 mm" },
  { no: "05", name: "PPGI", full: "Pre-Painted Galvanised Iron", std: "RMP · SMP · PVDF", range: "0.25 – 1.20 mm" },
  { no: "06", name: "PPGL", full: "Pre-Painted Galvalume", std: "Coated galvalume", range: "0.25 – 1.20 mm" },
  { no: "07", name: "Colour Coated", full: "To any RAL on order", std: "Any RAL", range: "Coil · sheet" },
  { no: "08", name: "Processed", full: "Slit · cut to length", std: "CTL · slitting", range: "To drawing" },
] as const;

export const MILLS = [
  { name: "Tata Steel", note: "HR · CR · GP" },
  { name: "JSW Steel", note: "Coated · Colour" },
  { name: "SAIL", note: "HR · Structural" },
  { name: "Jindal Steel", note: "HR · Plate" },
  { name: "AM/NS India", note: "GL · PPGL" },
  { name: "POSCO", note: "CR · Precision" },
] as const;

export const TERMS = [
  { no: "I", head: "A price in 24 hours", body: "A number you can plan around — not a mood, not a call-back." },
  { no: "II", head: "The mill's own certificate", body: "Original test certificates ride with every load, traceable to the heat." },
  { no: "III", head: "Papers beat the truck", body: "Invoice, e-way bill, LR and certificates land before the driver calls." },
  { no: "IV", head: "Tolerance is measured", body: "Slitting and cut-to-length checked against the drawing, not against habit." },
];

export const NAV = [
  { id: "lift", label: "Coil" },
  { id: "uncoil", label: "Process" },
  { id: "slit", label: "Slit" },
  { id: "india", label: "Reach" },
  { id: "dispatch", label: "Contact" },
];
