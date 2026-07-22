/**
 * One mutable object shared between the WebGL film and the HUD.
 *
 * Not React state: progress changes 60× a second and every consumer writes
 * straight to the DOM inside its own rAF loop.
 */

export type World = {
  /** 0→1 across the whole film */
  progress: number;
  /** 0→3, which morph target pair the point cloud is between */
  stage: number;
  /** how many of the cloud's points are currently "indexed" — HUD counter */
  indexed: number;
  pointer: { x: number; y: number };
  /** true once the first WebGL frame has been presented */
  ready: boolean;
};

export const world: World = {
  progress: 0,
  stage: 0,
  indexed: 0,
  pointer: { x: 0, y: 0 },
  ready: false,
};

export function markReady() {
  world.ready = true;
}

/** fallback the HUD uses when WebGL never started, so it cannot report a lie */
export const scrollProgress = () => {
  const travel = document.documentElement.scrollHeight - window.innerHeight;
  return travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0;
};
