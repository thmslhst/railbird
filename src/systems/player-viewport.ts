/**
 * Player viewport for Railbird.
 * A minimal viewport for previewing rail-driven camera animation.
 * No user controls - camera pose is set externally via setProgress().
 */

import * as THREE from "three";
import { createViewport, type Viewport } from "./viewport";
import type { CameraRailSystem } from "./camera-rail";

export interface PlayerViewport extends Viewport {
  /** Set camera position along the rail (t ∈ [0, 1]) */
  setProgress: (t: number) => void;
  /** Get current progress value */
  getProgress: () => number;
}

export interface PlayerViewportOptions {
  container: HTMLElement;
  scene: THREE.Scene;
  rail: CameraRailSystem;
}

export function createPlayerViewport(
  options: PlayerViewportOptions
): PlayerViewport {
  const { container, scene, rail } = options;

  let currentProgress = 0;

  // Create base viewport
  const viewport = createViewport({
    container,
    scene,
    fov: 60,
    near: 0.1,
    far: 1000,
  });

  // Set initial camera position if rail has points
  function updateCameraFromRail(t: number) {
    const pose = rail.getPose(t);
    if (pose) {
      viewport.camera.position.copy(pose.position);
      viewport.camera.quaternion.copy(pose.quaternion);
    }
  }

  // Initialize with t=0
  updateCameraFromRail(0);

  // Override dispose to clean up player-specific resources
  const originalDispose = viewport.dispose.bind(viewport);

  return {
    ...viewport,
    setProgress(t: number) {
      currentProgress = Math.max(0, Math.min(1, t));
      updateCameraFromRail(currentProgress);
    },
    getProgress() {
      return currentProgress;
    },
    dispose() {
      originalDispose();
    },
  };
}
