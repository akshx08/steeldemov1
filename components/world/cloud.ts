import * as THREE from "three";
import { C, dotTexture, rng } from "./kit";
import { COIL_RI, COIL_RO, COIL_W } from "./truck";

/**
 * The whole second half of this site is one point cloud with three targets.
 *
 * Rather than swapping objects, every point carries the three positions it will
 * ever occupy and the vertex shader interpolates between them. The coil does
 * not "become" a map by cutting to a different scene — the same 62,000 samples
 * that described its surface are the ones that shatter and reassemble into the
 * country it ships across. That is the argument of the page, made in geometry.
 *
 *   T0  the coil's own surface   (stored in `position`)
 *   T1  the shatter — dispersed  (aT1)
 *   T2  India — where it ships    (aT2)
 *
 * `uStage` runs 0→2 and is driven by scroll. Per-point jitter on the stage
 * value staggers the morph so the cloud arrives like a swarm, not a slab.
 */

export type Cloud = {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  /** hub positions on the map, in world space */
  nodes: THREE.Vector3[];
};

/**
 * India's outline as (lon, lat), one clockwise loop. Deliberately simplified —
 * enough to be unmistakably India (tapering peninsula, the Gujarat/Kutch bump,
 * the north-east) without the noise that a full coastline would scatter into a
 * point cloud. Sri Lanka is added separately below because that teardrop is the
 * single strongest "this is South Asia" cue.
 */
const INDIA: [number, number][] = [
  [74.5, 34.5], [78.0, 32.5], [81.0, 30.2], [84.5, 28.0], [88.2, 27.2],
  [91.5, 27.5], [94.5, 28.2], [96.2, 27.6], [95.2, 26.5], [94.0, 24.2],
  [92.8, 23.5], [91.8, 23.2], [91.0, 23.6], [89.2, 22.0], [87.0, 21.0],
  [85.0, 19.5], [83.5, 17.8], [81.5, 16.2], [80.3, 13.1], [79.8, 11.4],
  [78.8, 9.4], [77.5, 8.1], [76.5, 9.5], [75.0, 12.0], [73.8, 15.4],
  [72.9, 18.5], [72.6, 21.0], [70.0, 20.9], [69.0, 22.5], [68.2, 23.7],
  [70.5, 24.5], [72.5, 27.0], [74.0, 30.0], [74.5, 32.5],
];

/** Sri Lanka, roughly — a small offset teardrop below the tip */
const LANKA: [number, number] = [81.3, 6.9];

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
const MAP_S = 0.46; // world units per degree — India ~13 wide, ~12 tall
/** World centre of the map billboard (faces +Z, toward the camera).
 *  Left at x=0 so the shatter cloud reassembles straight up into it with no
 *  lateral drift; the camera aims LEFT of it (see Stage KEYS) to seat the map
 *  in the right of frame and leave the left third clear for the copy. */
export const MAP_CENTRE = new THREE.Vector3(0, 7.7, -4);

const proj = (lon: number, lat: number): [number, number] => [
  (lon - LON_C) * MAP_S,
  (lat - LAT_C) * MAP_S,
];

/** even-odd ray cast — is (px,py) inside the polygon `poly`? */
function inside(px: number, py: number, poly: [number, number][]) {
  let hit = false;
  for (let i = 0, k = poly.length - 1; i < poly.length; k = i++) {
    const [xi, yi] = poly[i];
    const [xk, yk] = poly[k];
    if (yi > py !== yk > py && px < ((xk - xi) * (py - yi)) / (yk - yi) + xi) hit = !hit;
  }
  return hit;
}

export function pointCloud(count: number, coilCentre: THREE.Vector3): Cloud {
  const r = rng(97);

  const t0 = new Float32Array(count * 3);
  const t1 = new Float32Array(count * 3);
  const t2 = new Float32Array(count * 3);
  const aRand = new Float32Array(count);
  const aSize = new Float32Array(count);
  const aNode = new Float32Array(count);

  /* ---------- India target geometry, precomputed once ---------- */

  const poly = INDIA.map(([lo, la]) => proj(lo, la));
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // densify the boundary so outline points can land on a crisp edge
  const edge: [number, number][] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const segs = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.28));
    for (let s = 0; s < segs; s++) {
      const t = s / segs;
      edge.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }

  const hubs = HUBS.map(([lo, la]) => proj(lo, la));
  const lanka = proj(LANKA[0], LANKA[1]);
  const nodeWorld: THREE.Vector3[] = hubs.map(
    ([x, y]) => new THREE.Vector3(MAP_CENTRE.x + x, MAP_CENTRE.y + y, MAP_CENTRE.z)
  );

  /* ---------- per point ---------- */

  const RO = COIL_RO;
  const RI = COIL_RI;
  const W = COIL_W;
  const areaOuter = 2 * Math.PI * RO * W;
  const areaInner = 2 * Math.PI * RI * W;
  const areaFaces = 2 * Math.PI * (RO * RO - RI * RI);
  const total = areaOuter + areaInner + areaFaces;
  const pOuter = areaOuter / total;
  const pInner = pOuter + areaInner / total;

  const v = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const j = i * 3;
    aRand[i] = r();
    aSize[i] = 0.55 + Math.pow(r(), 2.4) * 1.9;

    /* --- T0: the coil's surface. Axis along X: it rides eye-to-the-side. --- */
    const pick = r();
    const th = r() * Math.PI * 2;
    if (pick < pOuter) {
      v.set((r() - 0.5) * W, Math.sin(th) * RO, Math.cos(th) * RO);
    } else if (pick < pInner) {
      v.set((r() - 0.5) * W, Math.sin(th) * RI, Math.cos(th) * RI);
    } else {
      const wraps = 26;
      const k = Math.floor(r() * wraps) / wraps;
      const rad = RI + (RO - RI) * (k + r() * 0.02);
      v.set((r() > 0.5 ? 1 : -1) * (W / 2), Math.sin(th) * rad, Math.cos(th) * rad);
    }
    v.add(coilCentre);
    t0[j] = v.x;
    t0[j + 1] = v.y;
    t0[j + 2] = v.z;

    /* --- T1: the shatter. Thrown hard along the surface normal, drifting up.
           Faster and wider than a soft disperse — it should read as the coil
           coming apart, not evaporating. --- */
    const dir = v.clone().sub(coilCentre).normalize();
    const throwDist = 3.5 + Math.pow(r(), 1.5) * 19;
    const burst = dir.multiplyScalar(throwDist);
    burst.x += (r() - 0.5) * 6;
    burst.y += (r() - 0.5) * 5 + throwDist * 0.22;
    burst.z += (r() - 0.5) * 6;
    burst.add(coilCentre);
    t1[j] = burst.x;
    t1[j + 1] = Math.max(0.4, burst.y);
    t1[j + 2] = burst.z;

    /* --- T2: India. A crisp outline, a filled interior, brighter hub nodes,
           and a little Sri Lanka. Roles are assigned by lot. --- */
    let mx: number, my: number;
    const role = r();
    if (role < 0.15) {
      // hub node — snap tight, mark it hot. A tighter cluster + smaller size
      // reads as a round node; big additive sprites saturate into hard squares
      const h = hubs[Math.floor(r() * hubs.length)];
      mx = h[0] + (r() - 0.5) * 0.22;
      my = h[1] + (r() - 0.5) * 0.22;
      aNode[i] = 1;
      aSize[i] *= 1.35;
    } else if (role < 0.42) {
      // outline — a densified boundary point with a hair of jitter
      const e = edge[Math.floor(r() * edge.length)];
      mx = e[0] + (r() - 0.5) * 0.12;
      my = e[1] + (r() - 0.5) * 0.12;
    } else if (role < 0.47) {
      // Sri Lanka
      const a = r() * Math.PI * 2;
      const rr = Math.pow(r(), 0.6) * 0.7;
      mx = lanka[0] + Math.cos(a) * rr * 0.7;
      my = lanka[1] + Math.sin(a) * rr;
    } else {
      // interior fill — rejection sample inside the outline
      let tries = 0;
      do {
        mx = minX + r() * (maxX - minX);
        my = minY + r() * (maxY - minY);
      } while (!inside(mx, my, poly) && ++tries < 24);
    }
    t2[j] = MAP_CENTRE.x + mx + (r() - 0.5) * 0.05;
    t2[j + 1] = MAP_CENTRE.y + my + (r() - 0.5) * 0.05;
    t2[j + 2] = MAP_CENTRE.z + (r() - 0.5) * 0.4;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(t0, 3));
  geo.setAttribute("aT1", new THREE.BufferAttribute(t1, 3));
  geo.setAttribute("aT2", new THREE.BufferAttribute(t2, 3));
  geo.setAttribute("aRand", new THREE.BufferAttribute(aRand, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
  geo.setAttribute("aNode", new THREE.BufferAttribute(aNode, 1));
  // the cloud spans from the coil out to the shatter radius; a coil-sized
  // bounding sphere would cull it the instant it came apart
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 4, -2), 60);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uStage: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 30 },
      uOpacity: { value: 0 },
      uScatter: { value: 1.7 },
      uDpr: { value: 1 },
      uCool: { value: new THREE.Color(C.data) },
      uHot: { value: new THREE.Color(C.signalHi) },
      uMap: { value: dotTexture() },
    },
    vertexShader: `
      attribute vec3 aT1;
      attribute vec3 aT2;
      attribute float aRand;
      attribute float aSize;
      attribute float aNode;

      uniform float uStage, uTime, uSize, uOpacity, uScatter, uDpr;
      uniform vec3 uCool, uHot;

      varying float vA;
      varying vec3 vC;

      void main() {
        /* Stagger the morph per point so the cloud travels as a swarm — but
           COLLAPSE the stagger at rest. A constant offset means that even when
           uStage sits exactly on a target, every point is still 0.2 away from
           it and carrying turbulence, so no state is ever crisp. settle is 0 at
           every integer stage and 1 halfway between, so the swarm scatters on
           the way and lands exactly on the target when it arrives.
           (No backticks in here — this whole shader is a JS template literal.) */
        float settle = abs(uStage - floor(uStage + 0.5)) * 2.0;
        float s = clamp(uStage + (aRand - 0.5) * 0.55 * settle, 0.0, 2.0);

        vec3 p = position;
        p = mix(p, aT1, clamp(s, 0.0, 1.0));
        p = mix(p, aT2, clamp(s - 1.0, 0.0, 1.0));

        // turbulence peaks halfway between any two targets and vanishes at rest
        float mid = sin(fract(s) * 3.14159265) * settle;
        p += vec3(
          sin(uTime * 0.61 + aRand * 41.0),
          cos(uTime * 0.53 + aRand * 33.0),
          sin(uTime * 0.72 + aRand * 27.0)
        ) * mid * uScatter;

        // hub nodes and a rare sprinkle burn hot; the flash brightens everyone
        float hot = max(aNode, step(0.985, aRand));
        vec3 c = mix(uCool, uHot, hot);
        vC = mix(c, vec3(1.0), mid * 0.7);
        vA = uOpacity * (0.5 + 0.5 * mid + aNode * 0.22);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * aSize * uDpr / max(0.1, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uMap;
      varying float vA;
      varying vec3 vC;
      void main() {
        float m = texture2D(uMap, gl_PointCoord).a;
        if (m < 0.02) discard;
        // gain: a raw ShaderMaterial skips three's output colour-space encode,
        // so authored values render noticeably darker than they read
        gl_FragColor = vec4(vC * 1.65, m * vA);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;

  return { points, material, nodes: nodeWorld };
}
