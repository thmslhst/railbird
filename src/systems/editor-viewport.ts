/**
 * Editor viewport for Splato.
 * Extends the base viewport with OrbitControls and a grid helper.
 * Used for the editor view where users can freely navigate the scene.
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createViewport, type Viewport } from "./viewport";

export interface EditorViewport extends Viewport {
  controls: OrbitControls;
  gridHelper: THREE.GridHelper;
}

export interface EditorViewportOptions {
  container: HTMLElement;
  scene: THREE.Scene;
}

export function createEditorViewport(
  options: EditorViewportOptions
): EditorViewport {
  const { container, scene } = options;

  // Create grid helper (Unity-style)
  const gridSize = 20;
  const gridDivisions = 20;
  const gridHelper = new THREE.GridHelper(
    gridSize,
    gridDivisions,
    0x444444, // center line color
    0x222222  // grid color
  );
  scene.add(gridHelper);

  // Create base viewport with onFrame hook for controls update
  let controls: OrbitControls | null = null;

  const viewport = createViewport({
    container,
    scene,
    fov: 60,
    near: 0.1,
    far: 1000,
    onFrame: () => {
      controls?.update();
    },
  });

  // Set up editor camera position (elevated, looking at origin)
  viewport.camera.position.set(5, 5, 5);
  viewport.camera.lookAt(0, 0, 0);

  // Create OrbitControls
  controls = new OrbitControls(viewport.camera, viewport.renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.target.set(0, 0, 0);
  controls.update();

  // Override dispose to clean up editor-specific resources
  const originalDispose = viewport.dispose.bind(viewport);

  return {
    ...viewport,
    controls,
    gridHelper,
    dispose() {
      controls?.dispose();
      scene.remove(gridHelper);
      gridHelper.geometry.dispose();
      (gridHelper.material as THREE.Material).dispose();
      originalDispose();
    },
  };
}
