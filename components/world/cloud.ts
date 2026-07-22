import * as THREE from "three";
import { C, dotTexture, rng } from "./kit";
import { COIL_RI, COIL_RO, COIL_W } from "./truck";

/**
 * The whole second half of this site is one point cloud with four targets.
 *
 * Rather than swapping objects, every point carries the four positions it will
 * ever occupy and the vertex shader interpolates between them. The coil does
 * not "become" data by cutting to a different scene — the same 60,000 samples
 * that described its surface are the ones that end up as nodes on the network.
 * That is the entire argument of the page, made in geometry.
 *
 *   T0  the coil's own surface       (stored in `position`)
 *   T1  the burst — dispersed        (aT1)
 *   T2  the data field — 8 bands     (aT2)
 *   T3  the route network — nodes    (aT3)
 *
 * `uStage` runs 0→3 and is driven by scroll. Per-point jitter on the stage
 * value staggers the morph so the cloud arrives like a swarm, not a slab.
 */

export type Cloud = {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  /** node positions for the network act, so the HUD can label them */
  nodes: THREE.Vector3[];
};

const NODE_COUNT = 412; // matches the figure in the copy
/** columns per row in the data field — quantisation is what makes it legible */
const COLS = 64;

export function pointCloud(count: number, coilCentre: THREE.Vector3): Cloud {
  const r = rng(97);

  const t0 = new Float32Array(count * 3);
  const t1 = new Float32Array(count * 3);
  const t2 = new Float32Array(count * 3);
  const t3 = new Float32Array(count * 3);
  const aRand = new Float32Array(count);
  const aSize = new Float32Array(count);

  /* ---------- T3 first: the network's nodes, so arcs can reference them --- */

  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    // clustered, not uniform — a freight network is corridors, not confetti
    const hub = Math.floor(r() * 11);
    const hr = rng(400 + hub);
    const hx = (hr() - 0.5) * 54;
    const hz = (hr() - 0.5) * 34;
    const spread = 2 + r() * 9;
    nodes.push(
      new THREE.Vector3(
        hx + (r() - 0.5) * spread * 2,
        0.25 + r() * 0.4,
        hz + (r() - 0.5) * spread * 1.4
      )
    );
  }

  /* Arcs run between NEAR neighbours, not random global pairs. Connecting
     random nodes across the whole map produces a uniform hairball with no
     legible structure; short hops read as corridors, which is what a freight
     network actually looks like. */
  const NEI = 6;
  const neighbours: number[][] = nodes.map((n) => {
    const d = nodes.map((m, j) => ({ j, d: n.distanceToSquared(m) }));
    d.sort((x, y) => x.d - y.d);
    return d.slice(1, NEI + 1).map((x) => x.j);
  });

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const mid = new THREE.Vector3();

  /* ---------- per point ---------- */

  const RO = COIL_RO;
  const RI = COIL_RI;
  const W = COIL_W;
  // sample the coil by surface area so the density is even across its faces
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
      // the wound face — bias radius onto discrete wraps so the spiral reads
      const wraps = 26;
      const k = Math.floor(r() * wraps) / wraps;
      const rad = RI + (RO - RI) * (k + r() * 0.02);
      v.set((r() > 0.5 ? 1 : -1) * (W / 2), Math.sin(th) * rad, Math.cos(th) * rad);
    }
    v.add(coilCentre);
    t0[j] = v.x;
    t0[j + 1] = v.y;
    t0[j + 2] = v.z;

    /* --- T1: the burst. Push along the surface normal, with drift up. --- */
    const dir = v.clone().sub(coilCentre).normalize();
    const throwDist = 2.5 + Math.pow(r(), 1.7) * 15;
    const burst = dir.multiplyScalar(throwDist);
    burst.x += (r() - 0.5) * 5;
    burst.y += (r() - 0.5) * 4 + throwDist * 0.24;
    burst.z += (r() - 0.5) * 5;
    burst.add(coilCentre);
    t1[j] = burst.x;
    t1[j + 1] = Math.max(0.4, burst.y);
    t1[j + 2] = burst.z;

    /* --- T2: the data field. Eight rows of discrete columns — a histogram,
           not a haze.

       Scattering points along a continuous curve produces a smooth ribbon, and
       eight smooth ribbons at any oblique angle blur into one luminous fog. The
       structure has to be QUANTISED to survive: 64 columns per row, each a
       vertical bar of a definite height. Verticals are what the eye reads as
       data, and they hold up even when the rows overlap in screen space. --- */
    const band = i % 8;
    const col = Math.floor(r() * COLS);
    const x = -19 + col * (38 / (COLS - 1));
    // a deterministic per-column height, different profile per field
    const hNorm =
      0.5 +
      0.5 *
        (Math.sin(col * 0.19 + band * 1.7) * 0.62 +
          Math.sin(col * 0.51 + band * 0.7) * 0.28 +
          Math.sin(col * 1.03 + band * 2.3) * 0.1);
    const barH = 0.35 + hNorm * 3.1;
    t2[j] = x + (r() - 0.5) * 0.34;
    t2[j + 1] = 0.55 + Math.pow(r(), 0.85) * barH; // fill the bar top-heavy
    t2[j + 2] = -14.5 + band * 4.15 + (r() - 0.5) * 0.5;

    /* --- T3: the network. Node points are tight and bright; the rest ride
           short arcs between neighbouring nodes. --- */
    if (r() < 0.42) {
      const n = nodes[Math.floor(r() * NODE_COUNT)];
      t3[j] = n.x + (r() - 0.5) * 0.42;
      t3[j + 1] = n.y + r() * 0.32;
      t3[j + 2] = n.z + (r() - 0.5) * 0.42;
      aSize[i] *= 1.7; // nodes should out-read the lines that join them
    } else {
      const ai = Math.floor(r() * NODE_COUNT);
      a.copy(nodes[ai]);
      b.copy(nodes[neighbours[ai][Math.floor(r() * NEI)]]);
      const t = r();
      mid.copy(a).add(b).multiplyScalar(0.5);
      mid.y = a.distanceTo(b) * 0.34 + 0.8;
      // quadratic bezier, sampled
      const it = 1 - t;
      t3[j] = it * it * a.x + 2 * it * t * mid.x + t * t * b.x;
      t3[j + 1] = it * it * a.y + 2 * it * t * mid.y + t * t * b.y + (r() - 0.5) * 0.12;
      t3[j + 2] = it * it * a.z + 2 * it * t * mid.z + t * t * b.z;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(t0, 3));
  geo.setAttribute("aT1", new THREE.BufferAttribute(t1, 3));
  geo.setAttribute("aT2", new THREE.BufferAttribute(t2, 3));
  geo.setAttribute("aT3", new THREE.BufferAttribute(t3, 3));
  geo.setAttribute("aRand", new THREE.BufferAttribute(aRand, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
  // the cloud spans the whole network at T3; a coil-sized bounding sphere
  // would have it culled the moment it dispersed
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 90);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uStage: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 31 },
      uOpacity: { value: 0 },
      uScatter: { value: 1.4 },
      uDpr: { value: 1 },
      uCool: { value: new THREE.Color(C.data) },
      uHot: { value: new THREE.Color(C.signalHi) },
      uMap: { value: dotTexture() },
    },
    vertexShader: `
      attribute vec3 aT1;
      attribute vec3 aT2;
      attribute vec3 aT3;
      attribute float aRand;
      attribute float aSize;

      uniform float uStage, uTime, uSize, uOpacity, uScatter, uDpr;
      uniform vec3 uCool, uHot;

      varying float vA;
      varying vec3 vC;

      void main() {
        /* Stagger the morph per point so the cloud travels as a swarm — but
           COLLAPSE the stagger at rest. A constant offset means that even when
           uStage sits exactly on a target, every point is still 0.2 away from
           it and carrying turbulence, so no state is ever crisp: the histogram
           stays a haze and the network stays a blob. settle is 0 at every
           integer stage and 1 halfway between, so the swarm scatters on the way
           and lands exactly on the target when it arrives.
           (No backticks in here — this whole shader is a JS template literal.) */
        float settle = abs(uStage - floor(uStage + 0.5)) * 2.0;
        float s = clamp(uStage + (aRand - 0.5) * 0.55 * settle, 0.0, 3.0);

        vec3 p = position;
        p = mix(p, aT1, clamp(s, 0.0, 1.0));
        p = mix(p, aT2, clamp(s - 1.0, 0.0, 1.0));
        p = mix(p, aT3, clamp(s - 2.0, 0.0, 1.0));

        // turbulence peaks halfway between any two targets and vanishes at rest
        float mid = sin(fract(s) * 3.14159265) * settle;
        p += vec3(
          sin(uTime * 0.61 + aRand * 41.0),
          cos(uTime * 0.53 + aRand * 33.0),
          sin(uTime * 0.72 + aRand * 27.0)
        ) * mid * uScatter;

        vec3 c = mix(uCool, uHot, step(0.962, aRand));
        vC = mix(c, vec3(1.0), mid * 0.55);
        vA = uOpacity * (0.55 + 0.45 * mid);

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

  return { points, material, nodes };
}
