/**
 * Control Point Helper for visualizing camera rail control points.
 * Creates 3D visual representations of control points in the scene.
 */

import * as THREE from "three";
import type { ControlPoint } from "./camera-rail";

export interface ControlPointMesh extends THREE.Group {
  pointId: string;
  setSelected: (selected: boolean) => void;
}

export interface ControlPointHelperSystem {
  // Point visualization
  createPointMesh: (point: ControlPoint) => ControlPointMesh;
  updatePointMesh: (mesh: ControlPointMesh, point: ControlPoint) => void;
  disposePointMesh: (mesh: ControlPointMesh) => void;

  // Rail path visualization
  railLine: THREE.Line | null;
  updateRailLine: (points: ControlPoint[], scene: THREE.Scene) => void;
  disposeRailLine: (scene: THREE.Scene) => void;

  // Cleanup
  dispose: () => void;
}

// Colors
const POINT_COLOR = 0x4a9eff; // Blue
const POINT_SELECTED_COLOR = 0xffaa00; // Orange
const DIRECTION_COLOR = 0x22cc44; // Green
const RAIL_LINE_COLOR = 0x666666; // Gray

export function createControlPointHelperSystem(): ControlPointHelperSystem {
  // Shared geometries and materials
  const sphereGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const coneGeometry = new THREE.ConeGeometry(0.08, 0.3, 8);

  const pointMaterial = new THREE.MeshBasicMaterial({ color: POINT_COLOR });
  const pointSelectedMaterial = new THREE.MeshBasicMaterial({
    color: POINT_SELECTED_COLOR,
  });
  const directionMaterial = new THREE.MeshBasicMaterial({
    color: DIRECTION_COLOR,
  });

  const railLineMaterial = new THREE.LineBasicMaterial({
    color: RAIL_LINE_COLOR,
    linewidth: 2,
  });

  let railLine: THREE.Line | null = null;

  function createPointMesh(point: ControlPoint): ControlPointMesh {
    const group = new THREE.Group() as ControlPointMesh;
    group.pointId = point.id;

    // Main sphere
    const sphere = new THREE.Mesh(sphereGeometry, pointMaterial.clone());
    sphere.name = "sphere";
    group.add(sphere);

    // Direction cone (shows where camera looks)
    const cone = new THREE.Mesh(coneGeometry, directionMaterial.clone());
    cone.name = "cone";
    // Position cone in front of sphere, rotated to point forward
    cone.position.set(0, 0, -0.35);
    cone.rotation.x = -Math.PI / 2;
    group.add(cone);

    // Set position and rotation from control point
    group.position.copy(point.position);
    group.quaternion.copy(point.quaternion);

    // Selection method
    group.setSelected = (selected: boolean) => {
      const sphereMesh = group.getObjectByName("sphere") as THREE.Mesh;
      if (sphereMesh) {
        (sphereMesh.material as THREE.MeshBasicMaterial).color.setHex(
          selected ? POINT_SELECTED_COLOR : POINT_COLOR
        );
      }
    };

    return group;
  }

  function updatePointMesh(mesh: ControlPointMesh, point: ControlPoint): void {
    mesh.position.copy(point.position);
    mesh.quaternion.copy(point.quaternion);
  }

  function disposePointMesh(mesh: ControlPointMesh): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }

  function updateRailLine(points: ControlPoint[], scene: THREE.Scene): void {
    // Remove existing line
    if (railLine) {
      scene.remove(railLine);
      railLine.geometry.dispose();
      railLine = null;
    }

    if (points.length < 2) return;

    // Create new line geometry
    const linePoints = points.map((p) => p.position.clone());
    const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    railLine = new THREE.Line(geometry, railLineMaterial);
    railLine.name = "railLine";
    scene.add(railLine);
  }

  function disposeRailLine(scene: THREE.Scene): void {
    if (railLine) {
      scene.remove(railLine);
      railLine.geometry.dispose();
      railLine = null;
    }
  }

  function dispose(): void {
    sphereGeometry.dispose();
    coneGeometry.dispose();
    pointMaterial.dispose();
    pointSelectedMaterial.dispose();
    directionMaterial.dispose();
    railLineMaterial.dispose();
  }

  return {
    createPointMesh,
    updatePointMesh,
    disposePointMesh,
    get railLine() {
      return railLine;
    },
    updateRailLine,
    disposeRailLine,
    dispose,
  };
}
