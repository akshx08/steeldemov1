import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* near-black, cold. Deliberately not the warm charcoal of the
           industrial builds — this one is a machine, not a foundry. */
        void: "#08090B",
        carbon: "#0E1014",
        graphite: "#161920",
        chrome: "#252A33",
        line: "rgba(226,233,242,0.12)",
        line2: "rgba(226,233,242,0.055)",
        /* type */
        white: "#F4F7FA",
        ash: "#98A0AB",
        mute: "#575E69",
        /* one signal colour, used sparingly — live / active / alert */
        signal: "rgb(var(--signal) / <alpha-value>)",
        signalHi: "rgb(var(--signal-hi) / <alpha-value>)",
        /* the cold light everything metal reflects */
        data: "#BFD4E8",
      },
      fontFamily: {
        disp: ["var(--font-grotesk)", "system-ui", "sans-serif"],
        label: ["var(--font-jost)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        spec: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      transitionTimingFunction: {
        house: "cubic-bezier(0.22,1,0.36,1)",
        drawer: "cubic-bezier(0.4,0,0.2,1)",
      },
      transitionDuration: { 400: "400ms", 600: "600ms", 900: "900ms" },
    },
  },
  plugins: [],
} satisfies Config;
