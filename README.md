# LODE — the freight operating system

**A concept brand, not a real company.** Every figure on the page is invented for
the build; nothing here should be lifted into a client site.

One continuous take: a tractor-trailer assembles out of a wireframe, the coil on its
bed lifts off, resolves into a point cloud, bursts, settles into a data field, and
folds into a 412-node route network. The argument is made in geometry rather than
stated — matter becoming addressable.

## The signature

**One point cloud, four targets.** 62,000 points each carry every position they will
ever occupy; the vertex shader interpolates between them:

```
T0  the coil's own surface   (stored in `position`)
T1  the burst — dispersed    (aT1)
T2  the data field, 8 bands  (aT2)
T3  the route network        (aT3)
```

`uStage` runs 0→3 on scroll. The coil does not *become* data by cutting to another
scene: the same samples that described its surface are the ones that end up as nodes
on the network. Nothing is swapped, so nothing can be a cheat.

The second signature is the **readout**, which does the same argument in one number —
it starts as a mass (24.6 t), becomes a point count the instant the unit is resolved,
then a field count, then a node count.

## Four things this build is designed around

Each cost real time to find:

- **A raw `ShaderMaterial` skips three's output colour-space encode.** Authored
  colours render far darker than they read. Both custom shaders here carry an
  explicit gain; without it the wireframe is invisible and the cloud is mud.
- **`EdgesGeometry` output sits exactly on the surface it came from**, so with depth
  testing on it loses the LESS comparison to its own body and vanishes the moment
  that body materialises. A glowing wireframe is an overlay: `depthTest: false`.
- **A morph target is only clean for one instant** if the stage value spreads across
  a whole act. Every morph completes in the first 62% of its act and then holds — but
  the hold alone is not enough: a *constant* per-point stagger means that even when
  `uStage` sits exactly on a target, every point is still ~0.2 away from it and
  carrying turbulence, so no state is ever crisp. The stagger has to **collapse at
  rest** (`settle` in the vertex shader). That one term is the difference between a
  legible histogram and a permanent haze.
- **Render order beats depth for overlays.** A wireframe with `depthTest: false` is
  not safe on its own: transparent objects sort back-to-front by centroid distance,
  and the 400 m ground plane's centroid is nearer the camera than the truck's — so the
  floor renders *after* the wireframe and paints over it. `renderOrder = 10`.
- **Never let visibility depend on an animation finishing.** `transition-all` on the
  mobile drawer included `visibility`, so on a stalled animation clock the button
  reported `aria-expanded="true"` while the panel stayed invisible. Opening flips
  visibility instantly; only closing delays it.
- **Chrome has no diffuse term.** With nothing to reflect, the whole truck renders as
  a black silhouette. The environment is a drawn photographic studio — overhead
  softbox, cold fill, hard rim — run through `PMREMGenerator`. It is never shown.

## Why procedural and not GLTF

The brief asked for Spline/Blender exports. The signature move is a wireframe reveal
and a particle burst, and both need clean, controllable topology: a 100k-triangle
exported truck produces a grey mush of triangulated wireframe and a structureless
burst. Every box in `world/truck.ts` contributes exactly twelve readable edges, and
the coil is sampled by surface area so the cloud's density is even. No payload, no
licensing, no art-direction mismatch.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind 3.4 · Three.js · GSAP
ScrollTrigger (scroll scrub) · Lenis (inertia, lerp 0.09).

Archivo display (light weights, large) · Jost labels · Inter body · JetBrains Mono
specs. Near-black, chrome, one signal red used sparingly.

## Inspecting it

- `?act=0.49` — pins progress and skips ScrollTrigger. Pins the copy too, so only the
  act that owns that progress shows. NaN-guarded and clamped.
- `?native=1` — bails out of Lenis.
- `?reduced=1` — forces the reduced-motion path without touching an OS setting, in
  **both** the JS and the CSS (an inline script in `layout.tsx` sets
  `:root[data-reduced]`, which globals.css mirrors against the media query). The
  accessibility route touches four components and is the one path that otherwise
  ships unverified.
- `prefers-reduced-motion` — no render loop and a frozen clock; the rig starts already
  assembled, and the world still tracks the scrollbar so the readout stays honest.

Note: the pin renders the film at `scrollY 0`, where screenshots actually paint, but a
later act's copy still lives at its own document position and will be off-screen.

## Development

```bash
npm run dev    # port 3322, registered in .claude/launch.json
npm run build
```

Never run `next build` while the dev server shares `.next`.
`html { overflow-x: clip }` is load-bearing — `hidden` would make `<html>` a scroll
container and every sticky act would render as blank void.
