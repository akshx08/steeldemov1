"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DPR_CAP, clamp, lerp, prefersReducedMotion, smooth, span } from "@/lib/motion";
import { markReady, world } from "@/lib/store";
import { actWindow } from "@/lib/site";
import {
  applyAlpha,
  coilGeo,
  collectFadeables,
  chromeMat,
  dispose,
  studioEnv,
} from "./world/kit";
import { COIL_HOME, COIL_RI, COIL_RO, COIL_W, edgeShader, ground, truck } from "./world/truck";
import { pointCloud } from "./world/cloud";

gsap.registerPlugin(ScrollTrigger);

/**
 * The film. One continuous take: a truck assembles from wireframe, its coil
 * lifts off the bed, resolves into a point cloud, bursts, settles into a data
 * field, and folds into the route network.
 *
 * `?act=0.62` pins progress and skips ScrollTrigger — the tuning and
 * screenshot surface, because a throttled rAF cannot advance ScrollTrigger.
 */

/** camera keyframes, interpolated with smoothstep between neighbours */
const KEYS: { p: number; pos: [number, number, number]; look: [number, number, number]; fov: number }[] = [
  /* The look targets sit ABOVE the subject on purpose: it drops the rig into
     the lower half of frame and leaves the top two thirds for the type. */
  /* ~28 units from the rig frames its 19 m at fov 34. Further out and the
     wireframe's 1px additive lines stop reading at all. */
  { p: 0.0, pos: [18, 8.0, 19], look: [0, 4.8, -4.0], fov: 34 },
  { p: 0.13, pos: [13, 6.4, 13.5], look: [0, 4.4, -4.2], fov: 34 },
  { p: 0.273, pos: [8.4, 6.4, 8.6], look: [0, 5.8, -4.4], fov: 34 },
  { p: 0.424, pos: [5.0, 6.2, 5.4], look: [0, 5.8, -4.4], fov: 33 },
  { p: 0.554, pos: [13.5, 10.0, 17.0], look: [0, 5.4, -4.4], fov: 45 },
  /* Far enough back that the eight rows compress into a readable set. Close in,
     the nearest row fills the bottom of frame and the far ones vanish — the
     perspective ratio alone turns the histogram into a wash. */
  { p: 0.706, pos: [2.0, 16.0, 44.0], look: [0, 2.2, 0.0], fov: 38 },
  /* Oblique, not plan view: the routing arcs only read as arcs when they have
     the void behind them. Straight down flattens the network into noise. */
  { p: 0.87, pos: [2.0, 15.0, 30.0], look: [0, 2.6, -2.0], fov: 42 },
  { p: 1.0, pos: [1.0, 11.0, 38.0], look: [0, 2.2, 0.0], fov: 40 },
];

export default function Stage() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = prefersReducedMotion();

    /* `?act=` and `?act=abc` both parse to NaN, and NaN is not null — an
       unvalidated pin sails past every `=== null` guard and then poisons every
       transform, because NaN defeats the clamps downstream too. */
    const raw = new URLSearchParams(window.location.search).get("act");
    const parsedPin = raw !== null ? parseFloat(raw) : NaN;
    const pinned = Number.isFinite(parsedPin) ? clamp(parsedPin) : null;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL — the page is fully readable without it
    }
    renderer.setClearColor(0x08090b, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%" });

    const scene = new THREE.Scene();
    // the ground fogs out with distance; the point cloud does not (its custom
    // shader carries no fog chunk), so the network stays crisp above the haze
    scene.fog = new THREE.Fog(0x08090b, 40, 260);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 900);

    /* Chrome has no diffuse term — with nothing to reflect the whole truck
       renders black. This studio is what makes it read as metal. */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envSrc = studioEnv();
    const envMap = pmrem.fromEquirectangular(envSrc).texture;
    scene.environment = envMap;
    envSrc.dispose();
    pmrem.dispose();

    scene.add(new THREE.AmbientLight(0x9fb2c6, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(7, 12, 9);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8fb0d0, 0.85);
    fill.position.set(-9, 5, -7);
    scene.add(fill);

    /* ---------------- the world ---------------- */

    const floor = ground();
    scene.add(floor);
    const floorFades = collectFadeables(floor);

    const rig = truck();
    scene.add(rig.group);
    const truckFades = collectFadeables(rig.group).filter(
      (f) => f.mat !== (rig.edges.material as THREE.Material)
    );
    const edgeUniforms = (rig.edges.material as THREE.ShaderMaterial).uniforms;

    // the coil itself — a real mesh until the cloud takes over from it
    const coil = new THREE.Group();
    const coilMesh = new THREE.Mesh(
      coilGeo(COIL_RI, COIL_RO, COIL_W, 128),
      chromeMat({ color: 0x8d97a3, roughness: 0.26, metalness: 0.95, envMapIntensity: 1.7 })
    );
    // the coil rides eye-to-the-side: axis across the trailer
    coilMesh.rotation.z = Math.PI / 2;
    coil.add(coilMesh);
    const coilEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(coilGeo(COIL_RI, COIL_RO, COIL_W, 64), 18),
      edgeShader()
    );
    coilEdges.rotation.z = Math.PI / 2;
    coilEdges.renderOrder = 10; // same overlay rule as the truck's wireframe
    coil.add(coilEdges);
    const coilEdgeU = (coilEdges.material as THREE.ShaderMaterial).uniforms;
    // the coil's edge ramp runs along its own axis, so give it a full sweep
    coilEdges.geometry.setAttribute(
      "aSeq",
      new THREE.BufferAttribute(
        new Float32Array(coilEdges.geometry.getAttribute("position").count).fill(0.5),
        1
      )
    );
    coil.position.copy(COIL_HOME);
    scene.add(coil);
    const coilFades = collectFadeables(coil).filter(
      (f) => f.mat !== (coilEdges.material as THREE.Material)
    );

    const mobile = window.innerWidth < 768;
    const cloud = pointCloud(mobile ? 26000 : 62000, COIL_HOME.clone().setY(5.7));
    scene.add(cloud.points);
    const cu = cloud.material.uniforms;

    /* ---------------- sizing ---------------- */

    let repaint: (() => void) | null = null;
    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio, DPR_CAP);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      cu.uDpr.value = dpr;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      repaint?.();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* ---------------- scroll ---------------- */

    let target = pinned ?? 0;
    let current = pinned ?? 0;

    let pendingRepaint = 0;
    const frameRef: { current: (() => void) | null } = { current: null };
    const requestOne = () => {
      if (pendingRepaint) return;
      pendingRepaint = requestAnimationFrame(() => {
        pendingRepaint = 0;
        frameRef.current?.();
      });
    };

    let st: ScrollTrigger | null = null;
    if (pinned === null) {
      st = ScrollTrigger.create({
        trigger: document.documentElement,
        start: 0,
        end: () => document.documentElement.scrollHeight - window.innerHeight,
        scrub: true,
        onUpdate: (self) => {
          target = self.progress;
          if (reduced) requestOne();
        },
      });
      target = st.progress; // onUpdate does not fire on creation
    }

    const pt = { x: 0, y: 0 };
    const smoothPt = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pt.x = (e.clientX / window.innerWidth) * 2 - 1;
      pt.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    if (!reduced) window.addEventListener("pointermove", onPointer, { passive: true });

    /* ---------------- act windows ---------------- */

    const W = {
      manifest: actWindow("manifest"),
      lift: actWindow("lift"),
      scan: actWindow("scan"),
      burst: actWindow("burst"),
      field: actWindow("field"),
      network: actWindow("network"),
      dispatch: actWindow("dispatch"),
    };

    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    const kPos = new THREE.Vector3();
    const kLook = new THREE.Vector3();

    const clock = new THREE.Clock();
    let raf = 0;
    let lastT = performance.now();
    let first = true;

    const frame = (nowMs: number) => {
      const gap = nowMs - lastT;
      lastT = nowMs;
      const snapNow = gap > 250; // a woken tab must snap, never crawl

      current =
        snapNow || reduced || pinned !== null
          ? target
          : current + (target - current) * 0.09;
      const p = current;
      world.progress = p;

      const time = reduced ? 0 : clock.getElapsedTime();

      smoothPt.x = reduced ? 0 : smoothPt.x + (pt.x - smoothPt.x) * 0.045;
      smoothPt.y = reduced ? 0 : smoothPt.y + (pt.y - smoothPt.y) * 0.045;
      world.pointer = smoothPt;

      /* ---- camera: find the keyframe pair and smoothstep between them ---- */
      let i = 0;
      while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
      const k0 = KEYS[i];
      const k1 = KEYS[i + 1];
      const kt = smooth((p - k0.p) / (k1.p - k0.p || 1));
      camPos.fromArray(k0.pos).lerp(kPos.fromArray(k1.pos), kt);
      camLook.fromArray(k0.look).lerp(kLook.fromArray(k1.look), kt);
      // a little parallax, scaled down as the shot gets wider
      camera.position.set(
        camPos.x + smoothPt.x * 1.1,
        camPos.y + smoothPt.y * 0.7,
        camPos.z
      );
      camera.lookAt(camLook);
      const fov = lerp(k0.fov, k1.fov, kt);
      if (Math.abs(camera.fov - fov) > 0.001) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      /* ---- the truck: wireframe draws in, then the body materialises ---- */
      /* Under reduced motion the rig is simply already built. The assembly is
         a flourish, and playing it back scrubbed would otherwise leave that
         visitor looking at two bare chassis rails on arrival. */
      const reveal = reduced ? 1 : span(p, W.manifest[0], W.manifest[0] + 0.075);
      edgeUniforms.uReveal.value = reveal;
      // wireframe stays as a faint overlay once the body is solid
      const bodyIn = reduced ? 1 : span(p, W.manifest[0] + 0.055, W.manifest[0] + 0.12);
      const truckOut = 1 - span(p, W.burst[0], W.field[0]);
      edgeUniforms.uOpacity.value = (1 - bodyIn * 0.72) * truckOut;
      applyAlpha(truckFades, bodyIn * truckOut);

      /* ---- the coil lifts off the bed ---- */
      const lift = smooth(span(p, W.lift[0], W.lift[1]));
      coil.position.y = lerp(COIL_HOME.y, 5.7, lift);
      coil.position.z = COIL_HOME.z;
      coil.rotation.x = lift * 0.4 + time * 0.06;

      /* ---- scan: the mesh hands over to the cloud ---- */
      const scan = span(p, W.scan[0], W.scan[1]);
      // its own wireframe flares up as the solid surface goes
      coilEdgeU.uReveal.value = 1;
      coilEdgeU.uOpacity.value = Math.sin(clamp(scan) * Math.PI) * 0.9 * truckOut;
      applyAlpha(coilFades, bodyIn * (1 - smooth(scan)));

      /* ---- the cloud ---- */
      cu.uOpacity.value = smooth(span(p, W.scan[0] + 0.01, W.scan[0] + 0.08));
      cu.uTime.value = time;
      /* Each morph completes in the first 62% of its act and then HOLDS.
         Spread across the whole act, a target is only ever clean for a single
         instant at the boundary — and the per-point stagger smears even that,
         so every state read as fog. The hold is what makes the field look like
         eight bands and the network look like a network. */
      const seg = (w: [number, number]) => span(p, w[0], w[0] + (w[1] - w[0]) * 0.62);
      const stage = seg(W.burst) + seg(W.field) + seg(W.network);
      cu.uStage.value = stage;
      world.stage = stage;
      world.indexed = Math.round(clamp(scan) * 1_048_576);

      // the floor grid belongs to the physical half; fade it under the network
      applyAlpha(floorFades, 1 - span(p, W.network[0], W.network[1]) * 0.65);

      renderer.render(scene, camera);

      if (first) {
        first = false;
        markReady();
      }
      /* Self-schedule ONLY in the free-running mode: keying this off `pinned`
         alone would give reduced-motion visitors the full animated scene, and
         would let `repaint` spawn a second rAF chain on every resize. */
      if (!reduced && pinned === null) raf = requestAnimationFrame(frame);
    };

    frameRef.current = () => frame(performance.now());
    repaint = frameRef.current;

    if (pinned !== null) {
      // settle synchronously — a throttled rAF would take a minute to converge
      for (let n = 0; n < 4; n++) frame(performance.now());
    } else if (reduced) {
      // no loop: the world still follows the scrollbar so the HUD stays honest
      frame(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (pendingRepaint) cancelAnimationFrame(pendingRepaint);
      frameRef.current = null;
      repaint = null;
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      st?.kill();
      scene.remove(floor, rig.group, coil, cloud.points);
      dispose(floor);
      dispose(rig.group);
      dispose(coil);
      cloud.points.geometry.dispose();
      cloud.material.uniforms.uMap.value?.dispose();
      cloud.material.dispose();
      envMap.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} aria-hidden className="fixed inset-0 z-0 h-[100svh] w-full bg-void" />;
}
