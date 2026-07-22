import * as THREE from "three";

/* ------------------------------------------------------------------ */
/* Palette — the render and the CSS share one source of truth.         */
/* ------------------------------------------------------------------ */

export const C = {
  void: 0x08090b,
  carbon: 0x0e1014,
  graphite: 0x161920,
  /* lifted base tones: a "black" object reads correctly around #39404b,
     not #161920 — dark materials plus one key light is not enough. */
  chrome: 0x39404b,
  steel: 0x69727e,
  bright: 0xc9d4e0,
  white: 0xf4f7fa,
  signal: 0xe82127,
  signalHi: 0xff605a,
  data: 0xbfd4e8,
};

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** box with its origin at the base — everything on a chassis sits ON something */
export function box(w: number, h: number, d: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return g;
}

/** an annulus tube — the coil */
export function coilGeo(ri: number, ro: number, w: number, seg = 96) {
  return new THREE.LatheGeometry(
    [
      new THREE.Vector2(ri, -w / 2),
      new THREE.Vector2(ro, -w / 2),
      new THREE.Vector2(ro, w / 2),
      new THREE.Vector2(ri, w / 2),
      new THREE.Vector2(ri, -w / 2),
    ],
    seg
  );
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

export const bodyMat = (opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({
    color: C.chrome,
    metalness: 0.72,
    roughness: 0.38,
    // metals have no diffuse term — without an environment they render black
    envMapIntensity: 1.5,
    transparent: true,
    ...opts,
  });

export const chromeMat = (opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({
    color: 0xd6dee8,
    metalness: 1,
    roughness: 0.11,
    envMapIntensity: 2.1,
    transparent: true,
    ...opts,
  });

export const glowMat = (color = C.signalHi, intensity = 1.7) =>
  new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity),
    transparent: true,
    toneMapped: false,
  });

export const edgeMat = (color = C.data, opacity = 0.55) =>
  new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

/* ------------------------------------------------------------------ */
/* Procedural textures                                                 */
/* ------------------------------------------------------------------ */

/**
 * The studio every chrome surface in this build reflects.
 *
 * A MeshStandardMaterial at metalness 1 has no diffuse term at all — it can
 * only show what is around it. With no environment, the whole truck renders as
 * a black silhouette. This is a photographic studio rather than a shed: one
 * large soft key overhead, a cold fill on the left, a hard rim on the right,
 * and a dark floor. It is never shown as a background.
 */
export function studioEnv(w = 512) {
  const h = w / 2;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;

  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#c8d2de"); // ceiling
  g.addColorStop(0.34, "#4c5560");
  g.addColorStop(0.52, "#171b21"); // horizon
  g.addColorStop(1, "#0a0c0f"); // floor
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);

  // the overhead softbox — this is the long streak highlight down a chrome tank
  x.fillStyle = "rgba(255,255,255,0.92)";
  x.fillRect(w * 0.1, 0, w * 0.55, h * 0.09);

  const blob = (cx: number, cy: number, r: number, col: string, a: number) => {
    const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    x.globalAlpha = a;
    x.fillStyle = rg;
    x.fillRect(cx - r, cy - r, r * 2, r * 2);
    x.globalAlpha = 1;
  };

  blob(w * 0.2, h * 0.3, w * 0.18, "#dce8f6", 0.75); // cold fill, camera left
  blob(w * 0.78, h * 0.27, w * 0.1, "#ffffff", 0.95); // hard rim, camera right
  blob(w * 0.5, h * 0.4, w * 0.26, "#8ea3ba", 0.28); // ambient bounce

  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** soft round sprite — every particle in the build uses this */
export function dotTexture(size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

/* ------------------------------------------------------------------ */
/* Fade plumbing                                                       */
/* ------------------------------------------------------------------ */

export type Fadeable = {
  mat: THREE.Material & { opacity: number; transparent: boolean };
  base: number;
  /** whether the material was authored to write depth at all */
  depthWrite: boolean;
};

export function collectFadeables(root: THREE.Object3D): Fadeable[] {
  const out: Fadeable[] = [];
  const seen = new Set<THREE.Material>();
  root.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    if (!m) return;
    for (const mm of Array.isArray(m) ? m : [m]) {
      const mat = mm as THREE.Material & { opacity: number; transparent: boolean };
      if (seen.has(mat)) continue;
      seen.add(mat);
      mat.transparent = true;
      out.push({ mat, base: mat.opacity ?? 1, depthWrite: mat.depthWrite !== false });
    }
  });
  return out;
}

export function applyAlpha(list: Fadeable[], a: number) {
  for (const f of list) {
    f.mat.opacity = f.base * a;
    /* Never PROMOTE a material authored `depthWrite: false` — additive glows
       and point sprites depend on staying out of the depth buffer. */
    f.mat.depthWrite = f.depthWrite && a > 0.72;
  }
}

export function dispose(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material;
    if (!mat) return;
    (Array.isArray(mat) ? mat : [mat]).forEach((x) => {
      const t = x as THREE.MeshStandardMaterial;
      t.map?.dispose();
      t.dispose();
    });
  });
}
