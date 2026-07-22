import * as THREE from "three";
import { C, box, bodyMat, chromeMat, glowMat } from "./kit";

/**
 * A procedural tractor-trailer, modelled along +Z with the cab at the front.
 *
 * Built from primitives on purpose. The signature move is a wireframe reveal,
 * and that needs clean topology: a downloaded or Spline-exported truck is
 * 100k+ triangles of triangulated mesh whose EdgesGeometry renders as grey
 * mush. Every box here contributes exactly twelve readable edges.
 *
 * Real-ish dimensions in metres: 2.5 wide, 13.6 m trailer, 0.52 m wheels,
 * deck at 1.0 m, coil 1.62 m across riding eye-to-the-side in a cradle.
 */

export const DECK_Y = 1.02;
export const COIL_RO = 0.81;
export const COIL_RI = 0.28;
export const COIL_W = 1.25;
/** where the coil sits when it is still strapped down */
export const COIL_HOME = new THREE.Vector3(0, DECK_Y + COIL_RO + 0.06, -4.4);

type Built = {
  group: THREE.Group;
  /** LineSegments twin used for the wireframe reveal */
  edges: THREE.LineSegments;
  wheels: THREE.Object3D[];
  lamps: THREE.Mesh[];
};

export function truck(): Built {
  const g = new THREE.Group();
  const edgeGeos: THREE.BufferGeometry[] = [];

  const paint = bodyMat({ color: 0x3c4550, roughness: 0.3, metalness: 0.62 });
  const dark = bodyMat({ color: 0x171b21, roughness: 0.62, metalness: 0.35 });
  const bright = chromeMat();
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0d1116,
    metalness: 0.4,
    roughness: 0.06,
    envMapIntensity: 2.6,
    transparent: true,
    opacity: 0.85,
  });

  /** add a mesh and register its edges for the wireframe twin */
  const part = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    rot?: [number, number, number],
    wire = true
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    g.add(m);
    if (wire) {
      const e = new THREE.EdgesGeometry(geo, 24);
      // `m.matrix` is still identity until updateMatrix(); compose it directly
      e.applyMatrix4(new THREE.Matrix4().compose(m.position, m.quaternion, m.scale));
      edgeGeos.push(e);
    }
    return m;
  };

  /* ---------------- trailer ---------------- */

  const TL = 13.6; // trailer length
  const TZ = -6.4; // trailer centre

  // deck
  part(box(2.5, 0.16, TL), dark, 0, DECK_Y - 0.16, TZ);
  // main beams
  for (const x of [-0.86, 0.86]) part(box(0.16, 0.42, TL), paint, x, DECK_Y - 0.58, TZ);
  // cross members
  for (let i = 0; i < 14; i++)
    part(box(2.4, 0.1, 0.12), dark, 0, DECK_Y - 0.28, TZ - TL / 2 + 0.6 + i * 1.0, undefined, false);
  // side rails
  for (const x of [-1.29, 1.29]) part(box(0.08, 0.34, TL), paint, x, DECK_Y, TZ);

  // coil cradle — two angled chocks the coil rests in
  for (const s of [-1, 1]) {
    part(box(1.5, 0.34, 0.26), dark, 0, DECK_Y, COIL_HOME.z + s * 0.62, [s * 0.5, 0, 0]);
  }
  // strap anchors
  for (const s of [-1, 1])
    part(box(0.14, 0.1, 0.5), bright, s * 1.28, DECK_Y + 0.2, COIL_HOME.z, undefined, false);

  // landing gear
  for (const x of [-0.78, 0.78]) {
    part(box(0.16, 0.72, 0.16), dark, x, 0.3, TZ + TL / 2 - 3.4);
    part(box(0.42, 0.1, 0.42), dark, x, 0.18, TZ + TL / 2 - 3.4, undefined, false);
  }

  // rear bumper + lamps
  part(box(2.4, 0.12, 0.14), bright, 0, 0.62, TZ - TL / 2 - 0.1, undefined, false);
  const lamps: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), glowMat(C.signal, 1.5));
    l.position.set(s * 0.95, 0.92, TZ - TL / 2 - 0.06);
    g.add(l);
    lamps.push(l);
  }

  /* ---------------- tractor ---------------- */

  const CZ = 3.2; // cab centre

  // chassis rails
  for (const x of [-0.5, 0.5]) part(box(0.14, 0.34, 6.4), paint, x, 0.52, CZ - 0.4);
  // fifth wheel
  part(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), dark, 0, 0.98, CZ - 2.6, undefined, false);

  // sleeper + cab
  part(box(2.44, 1.72, 2.1), paint, 0, 1.05, CZ - 1.4);
  part(box(2.44, 1.5, 1.9), paint, 0, 1.05, CZ + 0.62);
  // windscreen — a slab tilted back, chrome-dark glass
  part(new THREE.BoxGeometry(2.2, 1.02, 0.1), glassMat, 0, 2.28, CZ + 1.5, [-0.22, 0, 0], true);
  // side glass
  for (const s of [-1, 1])
    part(new THREE.BoxGeometry(0.06, 0.66, 1.3), glassMat, s * 1.21, 2.16, CZ + 0.7, undefined, false);
  // roof fairing
  part(box(2.3, 0.5, 2.0), paint, 0, 2.76, CZ - 1.35);
  // grille + bumper
  part(box(2.2, 1.0, 0.16), bright, 0, 1.1, CZ + 1.62);
  part(box(2.5, 0.34, 0.22), bright, 0, 0.62, CZ + 1.72);
  // headlamps
  for (const s of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.2, 0.08), glowMat(0xf2f7ff, 2.4));
    l.position.set(s * 0.86, 1.02, CZ + 1.78);
    g.add(l);
    lamps.push(l);
  }
  // exhaust stacks
  for (const s of [-1, 1])
    part(
      new THREE.CylinderGeometry(0.09, 0.09, 2.9, 16),
      bright,
      s * 1.3,
      2.05,
      CZ - 1.9,
      undefined,
      false
    );
  // fuel tanks
  for (const s of [-1, 1])
    part(
      new THREE.CylinderGeometry(0.36, 0.36, 1.5, 24),
      bright,
      s * 1.12,
      0.72,
      CZ - 1.5,
      [0, 0, Math.PI / 2],
      false
    );
  // mirrors
  for (const s of [-1, 1]) {
    part(box(0.08, 0.62, 0.06), dark, s * 1.36, 1.9, CZ + 1.26, undefined, false);
    part(new THREE.BoxGeometry(0.06, 0.5, 0.22), dark, s * 1.46, 2.2, CZ + 1.26, undefined, false);
  }

  /* ---------------- wheels ---------------- */

  const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.3, 28);
  const tyre = bodyMat({ color: 0x101318, metalness: 0.1, roughness: 0.86 });
  const hubGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.32, 20);
  const axles = [CZ + 1.0, CZ - 1.7, CZ - 3.05, TZ - 4.0, TZ - 5.3];
  const wheels: THREE.Object3D[] = [];
  for (const z of axles) {
    for (const s of [-1, 1]) {
      // outer wheel, plus an inner one on the dual axles
      const duals = z === CZ + 1.0 ? [0] : [0, 0.34];
      for (const d of duals) {
        const w = new THREE.Mesh(wheelGeo, tyre);
        w.position.set(s * (1.06 - d), 0.52, z);
        w.rotation.z = Math.PI / 2;
        g.add(w);
        wheels.push(w);
        if (d === 0) {
          const hub = new THREE.Mesh(hubGeo, bright);
          hub.position.set(s * 1.09, 0.52, z);
          hub.rotation.z = Math.PI / 2;
          g.add(hub);
          wheels.push(hub);
        }
      }
    }
  }

  /* ---------------- the wireframe twin ---------------- */

  const merged = mergeLineGeometries(edgeGeos);
  const edges = new THREE.LineSegments(merged, edgeShader());
  /* Draw last. Transparent objects sort back-to-front by centroid distance, and
     the 400 m ground plane's centroid is NEARER the camera than the truck's, so
     without this the floor renders after the wireframe and paints straight over
     it — `depthTest: false` gives the lines no protection at all. Cost an hour. */
  edges.renderOrder = 10;
  g.add(edges);

  return { group: g, edges, wheels, lamps };
}

/**
 * The wireframe draw-in.
 *
 * `aSeq` is a 0→1 ramp along the truck's length (nose first), so raising
 * `uReveal` wipes the edges into existence front to back with a hot leading
 * line at the wavefront. Fading the whole thing uniformly instead would read
 * as an opacity change, not as construction.
 */
export function edgeShader() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uReveal: { value: 0 },
      uOpacity: { value: 1 },
      uCool: { value: new THREE.Color(C.data) },
      uHot: { value: new THREE.Color(C.white) },
    },
    vertexShader: `
      attribute float aSeq;
      uniform float uReveal;
      varying float vA;
      varying float vHot;
      void main() {
        vA = smoothstep(aSeq - 0.07, aSeq + 0.07, uReveal);
        vHot = 1.0 - smoothstep(0.0, 0.1, abs(uReveal - aSeq));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uCool; uniform vec3 uHot; uniform float uOpacity;
      varying float vA; varying float vHot;
      void main() {
        /* Gain, because two things dim these lines: a raw ShaderMaterial skips
           three's output colour-space encode, and a 1px additive line covers
           almost no pixels. Authored values render far darker than they read. */
        vec3 c = mix(uCool * 3.6, uHot * 6.0, vHot);
        gl_FragColor = vec4(c, vA * uOpacity);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    /* The edges sit exactly on the solid surfaces they were derived from, so
       with depth testing on they lose the LESS comparison to their own body
       and vanish the moment it materialises. A glowing wireframe is an overlay
       — draw it over everything and let the opacity ramp do the compositing. */
    depthTest: false,
  });
}

/** merge EdgesGeometry outputs into one draw call — they are position-only */
function mergeLineGeometries(list: THREE.BufferGeometry[]) {
  let n = 0;
  for (const g of list) n += (g.getAttribute("position") as THREE.BufferAttribute).count;
  const pos = new Float32Array(n * 3);
  // a 0→1 ramp along the truck's length, so the wireframe can draw in front-to-back
  const seq = new Float32Array(n);
  let o = 0;
  for (const g of list) {
    const a = g.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < a.count; i++) {
      pos[(o + i) * 3] = a.getX(i);
      pos[(o + i) * 3 + 1] = a.getY(i);
      pos[(o + i) * 3 + 2] = a.getZ(i);
      seq[o + i] = a.getZ(i);
    }
    o += a.count;
    g.dispose();
  }
  // normalise the ramp to 0→1, nose first
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < n; i++) {
    if (seq[i] < lo) lo = seq[i];
    if (seq[i] > hi) hi = seq[i];
  }
  for (let i = 0; i < n; i++) seq[i] = 1 - (seq[i] - lo) / (hi - lo || 1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeq", new THREE.BufferAttribute(seq, 1));
  return geo;
}

/* ------------------------------------------------------------------ */
/* The ground the whole thing stands on                                */
/* ------------------------------------------------------------------ */

export function ground() {
  const g = new THREE.Group();

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({
      color: 0x0c0e12,
      // a near-mirror floor turns the studio softbox into a blown-out hotspot
      // right under the subject; keep it damp
      roughness: 0.66,
      metalness: 0.22,
      envMapIntensity: 0.28,
      transparent: true,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);

  // the grid the interface sits on, drawn in world space
  const pts: number[] = [];
  const SIZE = 260;
  const STEP = 4;
  for (let v = -SIZE; v <= SIZE; v += STEP) {
    pts.push(-SIZE, 0, v, SIZE, 0, v, v, 0, -SIZE, v, 0, SIZE);
  }
  const gg = new THREE.BufferGeometry();
  gg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const grid = new THREE.LineSegments(
    gg,
    new THREE.LineBasicMaterial({
      color: 0x5f7183,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    })
  );
  grid.position.y = 0.01;
  g.add(grid);

  return g;
}
