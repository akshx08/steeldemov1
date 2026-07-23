import * as THREE from "three";
import { C, brushTexture, dotTexture, glowMat } from "./kit";
import { COIL_RI, COIL_RO, COIL_W } from "./truck";

/**
 * The steel that carries the whole second half — as SOLID geometry, not points.
 *
 * One set of ribbons morphs through four states, so there is never a grainy
 * intermediate to watch and the sequence is one continuous move:
 *
 *   COIL   the ribbons wound into the coil          (base position)
 *   SHEET  unrolled flat, facing the camera          (morph target 0)
 *   SLIT   the sheet split into parallel strips      (morph target 1)
 *   INDIA  each strip trimmed to a latitude band     (morph target 2)
 *
 * It is a MeshStandardMaterial with morph attributes rather than a custom
 * shader, so it keeps real PBR + the studio environment reflection the whole
 * way through — the India map is lit brushed steel, not a scatter of dots.
 *
 * THREE sums morph targets as base + Σ inf·(targetᵢ − base). With base = COIL
 * and targets [SHEET, SLIT, INDIA], the influence sets in `setStage` reduce to
 * a clean lerp between whichever two adjacent states we are between.
 */

/* ------------------------------------------------------------------ */
/* India geometry (shared with the map nodes)                          */
/* ------------------------------------------------------------------ */

/* Clockwise outline of the Indian mainland. The far north-east (Arunachal,
   Nagaland) is deliberately capped near lon 89 rather than run out to 96 — at
   the strip resolution here a full NE appendage separated by the Bay of Bengal
   just reads as a spike, and the main-body silhouette is what says "India".
   The widest belly sits around lat 22–23 (Kutch to the Bengal coast), tapering
   to the point at Kanyakumari and to a narrow peak in Kashmir. */
const INDIA: [number, number][] = [
  // north border, west → east
  [75.0, 34.3], [76.4, 33.2], [77.8, 32.6], [79.4, 31.2], [80.9, 30.1],
  [82.4, 28.4], [84.3, 27.6], [86.4, 27.2], [88.2, 26.9], [89.4, 26.1],
  // east edge / Bay of Bengal coast, north → south
  [89.0, 24.4], [88.1, 23.0], [87.1, 21.4], [85.3, 19.7], [83.6, 18.0],
  [82.2, 16.8], [80.9, 15.2], [80.2, 13.4], [79.9, 11.6], [78.9, 9.3],
  [77.5, 8.1], // Kanyakumari — southern point
  // west coast, south → north
  [76.3, 9.7], [75.0, 12.3], [74.0, 14.8], [73.2, 16.9], [72.8, 19.2],
  [72.6, 21.1], [70.6, 20.7], [69.2, 22.2], [68.2, 23.7], [69.9, 24.3],
  [71.5, 25.6], [73.0, 28.0], [74.1, 30.4], [74.4, 32.4],
];

/** unlabelled hub nodes at real-ish distribution centres — abstract, no names */
const HUBS: [number, number][] = [
  [77.2, 28.6], [72.8, 19.1], [88.4, 22.6], [80.3, 13.1], [78.5, 17.4],
  [77.6, 12.97], [72.6, 23.0], [75.8, 26.9], [81.8, 25.4], [85.1, 25.6],
  [83.0, 25.3], [76.3, 9.9], [79.1, 21.1], [77.4, 23.2], [73.9, 18.5],
  [78.0, 30.3], [91.7, 26.1], [83.3, 17.7], [80.9, 26.8], [85.8, 20.3],
  [74.6, 31.6], [70.8, 22.3], [76.6, 30.7], [82.9, 21.5], [86.9, 23.7],
  [78.7, 10.8], [75.4, 15.3], [88.6, 26.7],
];

const LON_C = 82.0;
const LAT_C = 21.2;
const MAP_S = 0.46;
/** world centre of the map (a billboard facing +Z, toward the camera) */
export const MAP_CENTRE = new THREE.Vector3(0, 7.4, -4);
/** where the coil floats once it has lifted off the bed */
export const SHEET_COIL_CENTRE = new THREE.Vector3(0, 5.7, -4.4);

const proj = (lon: number, lat: number): [number, number] => [
  (lon - LON_C) * MAP_S,
  (lat - LAT_C) * MAP_S,
];

const POLY = INDIA.map(([lo, la]) => proj(lo, la));
const Y_LO = Math.min(...POLY.map((p) => p[1]));
const Y_HI = Math.max(...POLY.map((p) => p[1]));

/** local x of the map centre longitude — the main landmass always contains it */
const X_CENTRE = (LON_C - LON_C) * MAP_S; // == 0, but written for intent

/**
 * The x-span of the India outline at a given local y — but the MAIN landmass
 * segment, not min→max. Taking min→max fills every gap: at a latitude that
 * crosses both the peninsula and a separate lobe (or the Bay of Bengal), it
 * would stretch one strip clean across the water. Instead we collect the
 * scanline crossings, pair them into inside-segments, and return the segment
 * that contains the map centre — i.e. the body of the country — so islands and
 * offshoots never widen a strip.
 */
function spanAtY(y: number): [number, number] {
  const xs: number[] = [];
  for (let i = 0, k = POLY.length - 1; i < POLY.length; k = i++) {
    const [xi, yi] = POLY[i];
    const [xk, yk] = POLY[k];
    if (yi > y !== yk > y) xs.push(xi + ((xk - xi) * (y - yi)) / (yk - yi));
  }
  if (xs.length < 2) return [0, 0];
  xs.sort((a, b) => a - b);

  // pair consecutive crossings into inside-segments; keep the one holding the
  // centre, else the widest
  let best: [number, number] | null = null;
  let widest: [number, number] = [xs[0], xs[1]];
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const seg: [number, number] = [xs[i], xs[i + 1]];
    if (seg[1] - seg[0] > widest[1] - widest[0]) widest = seg;
    if (X_CENTRE >= seg[0] && X_CENTRE <= seg[1]) best = seg;
  }
  return best ?? widest;
}

/* ------------------------------------------------------------------ */
/* The ribbons                                                         */
/* ------------------------------------------------------------------ */

export type Steel = {
  mesh: THREE.Mesh;
  setStage: (s: number) => void;
  dispose: () => void;
};

export function steelSheet(mobile = false): Steel {
  const N = mobile ? 34 : 46; // strips
  const SEG = mobile ? 90 : 130; // length segments — enough to bend the spiral
  const TURNS = 9;

  const H = Y_HI - Y_LO; // India's vertical extent, reused as the sheet height
  const SHEET_W = 15; // unrolled length of the sheet
  const cc = SHEET_COIL_CENTRE;
  const mc = MAP_CENTRE;

  const rows = N;
  const cols = SEG + 1;
  const vps = cols * 2; // verts per strip (two edges)
  const vCount = rows * vps;

  const coil = new Float32Array(vCount * 3);
  const coilN = new Float32Array(vCount * 3);
  const sheet = new Float32Array(vCount * 3);
  const slit = new Float32Array(vCount * 3);
  const india = new Float32Array(vCount * 3);
  const flatN = new Float32Array(vCount * 3); // +Z for every flat state

  // per-row India span, precomputed
  const spanLo: number[] = [];
  const spanHi: number[] = [];
  for (let r = 0; r < rows; r++) {
    const yc = Y_LO + ((r + 0.5) / rows) * H;
    const [lo, hi] = spanAtY(yc);
    spanLo[r] = lo;
    spanHi[r] = hi;
  }

  const SLIT_GAP = 0.17; // fraction of a row left open between strips

  let o = 0;
  for (let r = 0; r < rows; r++) {
    // vertical band this strip occupies, in the flat states
    const yTouchLo = Y_LO + (r / rows) * H;
    const yTouchHi = Y_LO + ((r + 1) / rows) * H;
    const ySlitLo = Y_LO + ((r + SLIT_GAP / 2) / rows) * H;
    const ySlitHi = Y_LO + ((r + 1 - SLIT_GAP / 2) / rows) * H;

    const iLo = spanLo[r];
    const iHi = spanHi[r];
    const iCenter = (iLo + iHi) / 2;
    const iWidth = Math.max(iHi - iLo, 0.12); // keep the tip from vanishing

    for (let c = 0; c < cols; c++) {
      const u = c / SEG; // 0 inner end … 1 free/outer end
      for (let side = 0; side < 2; side++) {
        const i3 = o * 3;

        // ---- COIL (base): wound in YZ, axial along X ----
        const th = u * TURNS * Math.PI * 2;
        const rho = COIL_RI + (COIL_RO - COIL_RI) * u;
        const ax = ((r + side) / rows - 0.5) * COIL_W; // touching axial slices
        coil[i3] = cc.x + ax;
        coil[i3 + 1] = cc.y + rho * Math.cos(th);
        coil[i3 + 2] = cc.z + rho * Math.sin(th);
        coilN[i3] = 0;
        coilN[i3 + 1] = Math.cos(th);
        coilN[i3 + 2] = Math.sin(th);

        // ---- SHEET: flat rectangle facing the camera, strips touching ----
        const yTouch = side ? yTouchHi : yTouchLo;
        sheet[i3] = mc.x + (u - 0.5) * SHEET_W;
        sheet[i3 + 1] = mc.y + yTouch;
        sheet[i3 + 2] = mc.z;

        // ---- SLIT: same, but each strip shrinks so gaps open ----
        const ySlit = side ? ySlitHi : ySlitLo;
        slit[i3] = mc.x + (u - 0.5) * SHEET_W;
        slit[i3 + 1] = mc.y + ySlit;
        slit[i3 + 2] = mc.z;

        // ---- INDIA: strip trimmed to its latitude band ----
        india[i3] = mc.x + iCenter + (u - 0.5) * iWidth;
        india[i3 + 1] = mc.y + ySlit;
        india[i3 + 2] = mc.z - 0.02 + (r % 2) * 0.02;

        flatN[i3] = 0;
        flatN[i3 + 1] = 0;
        flatN[i3 + 2] = 1;
        o++;
      }
    }
  }

  // index buffer — two triangles per (col, strip) quad
  const idx: number[] = [];
  for (let r = 0; r < rows; r++) {
    const base = r * vps;
    for (let c = 0; c < SEG; c++) {
      const a = base + c * 2;
      const b = a + 1;
      const d = a + 2;
      const e = a + 3;
      idx.push(a, b, d, b, e, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(coil, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(coilN, 3));
  geo.setIndex(idx);
  geo.morphAttributes.position = [
    new THREE.BufferAttribute(sheet, 3),
    new THREE.BufferAttribute(slit, 3),
    new THREE.BufferAttribute(india, 3),
  ];
  geo.morphAttributes.normal = [
    new THREE.BufferAttribute(flatN, 3),
    new THREE.BufferAttribute(flatN, 3),
    new THREE.BufferAttribute(flatN, 3),
  ];
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 6, -4), 40);

  const brush = brushTexture();
  brush.repeat.set(3, 1);
  // Lower metalness than the coil on purpose: a flat metal billboard facing the
  // camera mirrors whatever is behind the camera, which in the studio is dark —
  // so a high-metal map reads black. More diffuse response lets the fill light
  // actually light it, so the strips read as bright lit steel.
  const mat = new THREE.MeshStandardMaterial({
    color: 0xc8d0d8,
    map: brush,
    metalness: 0.55,
    roughness: 0.44,
    envMapIntensity: 1.4,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.morphTargetInfluences = [0, 0, 0];
  mesh.frustumCulled = false;

  const setStage = (s: number) => {
    const inf = mesh.morphTargetInfluences!;
    const c = Math.min(3, Math.max(0, s));
    if (c <= 1) {
      inf[0] = c;
      inf[1] = 0;
      inf[2] = 0;
    } else if (c <= 2) {
      const f = c - 1;
      inf[0] = 1 - f;
      inf[1] = f;
      inf[2] = 0;
    } else {
      const f = c - 2;
      inf[0] = 0;
      inf[1] = 1 - f;
      inf[2] = f;
    }
  };

  return {
    mesh,
    setStage,
    dispose: () => {
      geo.dispose();
      brush.dispose();
      mat.dispose();
    },
  };
}

/* ------------------------------------------------------------------ */
/* The destination nodes that light up on the finished map             */
/* ------------------------------------------------------------------ */

export type MapNodes = {
  group: THREE.Group;
  update: (reveal: number, time: number) => void;
  dispose: () => void;
};

export function mapNodes(): MapNodes {
  const group = new THREE.Group();
  const dot = dotTexture();

  const cores: THREE.Mesh[] = [];
  const rings: THREE.Mesh[] = [];
  const phase: number[] = [];

  const coreGeo = new THREE.SphereGeometry(0.08, 12, 10);
  const ringGeo = new THREE.RingGeometry(0.12, 0.16, 28);

  HUBS.forEach(([lo, la], i) => {
    const [px, y] = proj(lo, la);
    // pull every hub inside the landmass at its latitude, so a node can never
    // float off the coast when the outline changes shape
    const [slo, shi] = spanAtY(y);
    const x = shi > slo ? Math.min(shi - 0.25, Math.max(slo + 0.25, px)) : px;
    const p = new THREE.Vector3(MAP_CENTRE.x + x, MAP_CENTRE.y + y, MAP_CENTRE.z + 0.08);

    const core = new THREE.Mesh(coreGeo, glowMat(C.signalHi, 2.2));
    core.position.copy(p);
    group.add(core);
    cores.push(core);

    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        color: C.signalHi,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    ring.position.copy(p);
    group.add(ring);
    rings.push(ring);

    // a soft halo so the node reads round, not square
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.62),
      new THREE.MeshBasicMaterial({
        map: dot,
        color: C.signalHi,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    halo.position.copy(p);
    core.userData.halo = halo;
    group.add(halo);

    phase.push((i * 2.399) % (Math.PI * 2));
  });

  const update = (reveal: number, time: number) => {
    const n = cores.length;
    for (let i = 0; i < n; i++) {
      // nodes light up in sequence as the map settles
      const on = Math.min(1, Math.max(0, reveal * n * 1.3 - i));
      const pulse = 0.5 + 0.5 * Math.sin(time * 2.1 + phase[i]);

      const core = cores[i];
      core.scale.setScalar(on * (0.85 + pulse * 0.4));
      (core.material as THREE.MeshBasicMaterial).opacity = on;

      const halo = core.userData.halo as THREE.Mesh;
      halo.scale.setScalar(0.8 + pulse * 0.5);
      (halo.material as THREE.MeshBasicMaterial).opacity = on * (0.3 + pulse * 0.35);

      // the ring expands and fades — a repeating radar ping
      const ping = (time * 0.7 + phase[i]) % 1;
      const ring = rings[i];
      ring.scale.setScalar((0.6 + ping * 2.6) * on);
      (ring.material as THREE.MeshBasicMaterial).opacity = on * (1 - ping) * 0.6;
    }
  };

  return {
    group,
    update,
    dispose: () => {
      coreGeo.dispose();
      ringGeo.dispose();
      dot.dispose();
      group.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mm = m.material as THREE.Material;
        if (mm) mm.dispose();
      });
    },
  };
}
