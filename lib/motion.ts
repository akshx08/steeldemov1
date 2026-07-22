// House motion values — HOUSE-STYLE.md.

export const EASE_HOUSE = [0.22, 1, 0.36, 1] as const;
export const EASE_DRAWER = [0.4, 0, 0.2, 1] as const;

export const VIEW = { once: true, margin: "-15%" } as const;

export const LERP = 0.09;
export const MOBILE = 768;
export const DPR_CAP = 2;

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

/** 0→1 inside [a,b], flat outside */
export const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

export const smooth = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};

export const easeOut = (t: number, k = 2.4) => 1 - Math.pow(1 - clamp(t), k);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * One source of truth for the reduced-motion decision.
 *
 * `?reduced=1` forces the same path as the OS setting. The accessibility route
 * through a site like this touches four components and is the one path nobody
 * can see without changing a system preference — which means in practice it
 * ships unverified. This makes it a URL away, the same way `?native=1` makes
 * the no-Lenis path checkable.
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("reduced") === "1") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
