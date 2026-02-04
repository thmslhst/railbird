/**
 * Base viewport system for Railbird.
 * A viewport manages its own renderer and camera, but renders a shared scene.
 * Multiple viewports can render the same scene simultaneously.
 */

import * as THREE from "three";

export interface Viewport {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  container: HTMLElement;
  start: () => void;
  stop: () => void;
  dispose: () => void;
  resize: () => void;
}

export interface ViewportOptions {
  container: HTMLElement;
  scene: THREE.Scene;
  fov?: number;
  near?: number;
  far?: number;
  onFrame?: (time: number) => void;
}

export function createViewport(options: ViewportOptions): Viewport {
  const { container, scene, fov = 60, near = 0.1, far = 1000, onFrame } = options;

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    fov,
    container.clientWidth / container.clientHeight,
    near,
    far
  );

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Animation loop state
  let animationId: number | null = null;

  function animate(time: number) {
    animationId = requestAnimationFrame(animate);
    onFrame?.(time);
    renderer.render(scene, camera);
  }

  // Handle resize
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener("resize", resize);

  return {
    renderer,
    camera,
    container,
    start() {
      if (animationId === null) {
        animationId = requestAnimationFrame(animate);
      }
    },
    stop() {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    resize,
    dispose() {
      this.stop();
      window.removeEventListener("resize", resize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
