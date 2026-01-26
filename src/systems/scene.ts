/**
 * Scene system for Splato.
 * Manages the shared Three.js scene that can be rendered by multiple viewports.
 * This is the single source of truth for all scene objects (splats, meshes, helpers).
 */

import * as THREE from "three";

export interface SceneSystem {
  scene: THREE.Scene;
  add: (object: THREE.Object3D) => void;
  remove: (object: THREE.Object3D) => void;
  dispose: () => void;
}

export function createSceneSystem(): SceneSystem {
  const scene = new THREE.Scene();

  return {
    scene,
    add(object: THREE.Object3D) {
      scene.add(object);
    },
    remove(object: THREE.Object3D) {
      scene.remove(object);
    },
    dispose() {
      // Dispose all objects in the scene
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });
      scene.clear();
    },
  };
}
