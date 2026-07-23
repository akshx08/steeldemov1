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
  dispose,
  steelCoil,
  studioEnv,
} from "./world/kit";
import { COIL_HOME, COIL_RI, COIL_RO, COIL_W, edgeShader, ground, truck } from "./world/truck";
import { SHEET_COIL_CENTRE, mapNodes, steelSheet } from "./world/sheet";

gsap.registerPlugin(ScrollTrigger);

/**
 * The film. One continuous take: a truck assembles from wireframe, its coil
 * lifts off the bed, unrolls into a flat sheet, the sheet is slit into strips,
 * and the strips lay down as the map of India it ships across. All solid steel.
 *
 * `?act=0.62` pins progress and skips ScrollTrigger — the tuning and
 * screenshot surface, because a throttled rAF cannot advance ScrollTrigger.
 */

/** camera keyframes, interpolated with smoothstep between neighbours.
 *  Act windows (6 acts): manifest .148 · lift .297 · uncoil .495 · slit .644
 *  · india .851 · dispatch 1.0. The camera swings from the side of the coil
 *  round to a front-on view during the uncoil, so the sheet unrolls toward the
 *  viewer; from there it holds front-on for slit and India. The map sits at
 *  world x=0 but the camera aims LEFT of it so it seats in the right of frame,
 *  leaving the left third clear for the copy column. */
const KEYS: { p: number; pos: [number, number, number]; look: [number, number, number]; fov: number }[] = [
  { p: 0.0, pos: [18, 8.0, 19], look: [0, 4.8, -4.0], fov: 34 },
  { p: 0.1, pos: [13, 6.8, 14], look: [0, 4.6, -4.2], fov: 34 },
  { p: 0.22, pos: [7.0, 6.6, 9.0], look: [0, 5.5, -4.4], fov: 35 },
  /* swing to front-on as the coil unrolls into the sheet */
  { p: 0.37, pos: [1.0, 7.6, 15.0], look: [-2.6, 7.1, -4.0], fov: 41 },
  { p: 0.5, pos: [-2.6, 7.6, 17.5], look: [-3.3, 7.2, -4.0], fov: 40 },
  { p: 0.64, pos: [-2.8, 7.5, 18.0], look: [-3.4, 7.2, -4.0], fov: 40 },
  { p: 0.85, pos: [-2.8, 7.4, 18.5], look: [-3.4, 7.1, -4.0], fov: 40 },
  { p: 1.0, pos: [-2.8, 7.0, 24.0], look: [-3.2, 6.7, -3.0], fov: 40 },
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
    // a soft front fill from the camera side, so the flat sheet + map (which
    // face the camera and reflect only the dark rear of the studio) are lit as
    // bright neutral steel rather than a dim blue silhouette
    const front = new THREE.DirectionalLight(0xf4f5f1, 2.5);
    front.position.set(-2, 9, 14);
    scene.add(front);

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

    // the coil itself — a real mesh until the cloud takes over from it.
    // built from primitives (see steelCoil) so its edges stay crisp instead of
    // shading into a rounded pebble the way a single lathe does
    const coil = new THREE.Group();
    const steel = steelCoil(COIL_RI, COIL_RO, COIL_W);
    coil.add(steel);
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
    // the steel that unrolls, slits, and lays down as India — solid geometry,
    // so it stays lit brushed metal the whole way and never shows grain
    const steelSheetRig = steelSheet(mobile);
    const steelMat = steelSheetRig.mesh.material as THREE.MeshStandardMaterial;
    steelSheetRig.mesh.visible = false;
    scene.add(steelSheetRig.mesh);
    const nodes = mapNodes();
    scene.add(nodes.group);

    /* ---------------- sizing ---------------- */

    let repaint: (() => void) | null = null;
    const resize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio, DPR_CAP);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
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
      uncoil: actWindow("uncoil"),
      slit: actWindow("slit"),
      india: actWindow("india"),
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
      // the truck is gone by the time the sheet has unrolled
      const truckOut = 1 - span(p, W.uncoil[0], W.uncoil[1]);
      edgeUniforms.uOpacity.value = (1 - bodyIn * 0.72) * truckOut;
      applyAlpha(truckFades, bodyIn * truckOut);

      /* ---- the coil lifts off the bed and turns once, scroll-locked ----
         One full revolution over the lift, eased, so it settles back to its
         start orientation exactly as the ribbon takes over — a time-based idle
         spin would keep tumbling when the scroll stops. */
      const liftRaw = span(p, W.lift[0], W.lift[1]);
      const lift = smooth(liftRaw);
      coil.position.y = lerp(COIL_HOME.y, SHEET_COIL_CENTRE.y, lift);
      coil.position.z = COIL_HOME.z;
      coil.rotation.x = lift * Math.PI * 2;
      coil.rotation.y = smoothPt.x * 0.12;

      /* ---- hand the solid coil over to the ribbon system ----
         The solid coil fades out over the first sliver of the uncoil act while
         the ribbon fades in already at its coil state and immediately begins to
         unroll. Both are "a coil" at the same place and size for that instant,
         so the swap reads as continuous rather than as a cut. The wireframe
         flares once across the handover. */
      const handover = span(p, W.uncoil[0], W.uncoil[0] + 0.05);
      applyAlpha(coilFades, bodyIn * (1 - handover));
      coilEdgeU.uReveal.value = 1;
      coilEdgeU.uOpacity.value = Math.sin(handover * Math.PI) * 0.9;

      /* ---- the ribbon: coil -> sheet -> slit -> India ----
         Each morph completes in the first 64% of its act and then HOLDS, so the
         finished sheet, the slit strips, and the map each get a clean beat to be
         read at rest before the next move begins. */
      const seg = (w: [number, number]) => span(p, w[0], w[0] + (w[1] - w[0]) * 0.64);
      const ribbonStage = seg(W.uncoil) + seg(W.slit) + seg(W.india);
      steelSheetRig.setStage(ribbonStage);
      world.stage = ribbonStage;

      const ribbonIn = span(p, W.uncoil[0], W.uncoil[0] + 0.045);
      const ribbonOut = 1 - span(p, W.dispatch[0] + 0.02, W.dispatch[1]);
      steelSheetRig.mesh.visible = ribbonIn > 0.001 && ribbonOut > 0.001;
      steelMat.opacity = ribbonIn * ribbonOut;
      steelMat.depthWrite = steelMat.opacity > 0.5;

      /* ---- destination nodes light up once the map has settled ---- */
      const mapReveal = span(p, W.india[0] + (W.india[1] - W.india[0]) * 0.45, W.india[1]);
      nodes.update(mapReveal * ribbonOut, time);

      // the floor grid belongs to the physical half; fade it out as the sheet
      // lifts free and the map takes over the frame
      applyAlpha(floorFades, 1 - span(p, W.uncoil[0], W.slit[0]) * 0.9);

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
      scene.remove(floor, rig.group, coil, steelSheetRig.mesh, nodes.group);
      dispose(floor);
      dispose(rig.group);
      dispose(coil);
      steelSheetRig.dispose();
      nodes.dispose();
      envMap.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} aria-hidden className="fixed inset-0 z-0 h-[100svh] w-full bg-void" />;
}
