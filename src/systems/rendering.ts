/**
 * Core rendering system for Railbird.
 * Manages WebGL renderer, animation loop, and resize handling.
 * Decoupled from React - operates imperatively.
 */

import * as THREE from "three";

export interface RenderingSystem {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  start: () => void;
  stop: () => void;
  dispose: () => void;
}

export interface RenderingSystemOptions {
  container: HTMLElement;
  onFrame?: (time: number) => void;
}

export function createRenderingSystem(
  options: RenderingSystemOptions
): RenderingSystem {
  const { container, onFrame } = options;

  // Create scene
  const scene = new THREE.Scene();

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
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
  function handleResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener("resize", handleResize);

  return {
    renderer,
    scene,
    camera,
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
    dispose() {
      this.stop();
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
