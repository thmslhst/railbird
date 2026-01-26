"use client";

/**
 * EditorView - React component for the camera rail editor.
 * Provides a fullscreen view with OrbitControls and a grid.
 * React handles lifecycle; Three.js objects live in refs.
 */

import * as THREE from "three";
import { useEffect, useRef, useCallback } from "react";
import { SplatMesh } from "@sparkjsdev/spark";
import { createSceneSystem, type SceneSystem } from "@/systems/scene";
import {
  createEditorViewport,
  type EditorViewport,
} from "@/systems/editor-viewport";
import {
  createCameraRailSystem,
  type CameraRailSystem,
  type ControlPoint,
} from "@/systems/camera-rail";
import {
  createControlPointHelperSystem,
  type ControlPointHelperSystem,
  type ControlPointMesh,
} from "@/systems/control-point-helper";
import type { EditorMode } from "./RailEditor";

interface EditorViewProps {
  splatUrl: string;
  className?: string;
  mode: EditorMode;
  selectedPointId: string | null;
  onPointsChange: (points: ControlPoint[]) => void;
  onSelectPoint: (id: string | null) => void;
}

export function EditorView({
  splatUrl,
  className,
  mode,
  selectedPointId,
  onPointsChange,
  onSelectPoint,
}: EditorViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneSystem | null>(null);
  const viewportRef = useRef<EditorViewport | null>(null);
  const splatRef = useRef<SplatMesh | null>(null);
  const railRef = useRef<CameraRailSystem | null>(null);
  const helperRef = useRef<ControlPointHelperSystem | null>(null);
  const pointMeshesRef = useRef<Map<string, ControlPointMesh>>(new Map());

  // For drag handling
  const isDraggingRef = useRef(false);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycasterRef = useRef(new THREE.Raycaster());

  // Sync point meshes with control points
  const syncPointMeshes = useCallback(() => {
    const sceneSystem = sceneRef.current;
    const rail = railRef.current;
    const helper = helperRef.current;
    if (!sceneSystem || !rail || !helper) return;

    const meshes = pointMeshesRef.current;
    const points = rail.controlPoints;

    // Remove meshes for deleted points
    for (const [id, mesh] of meshes) {
      if (!points.find((p) => p.id === id)) {
        sceneSystem.remove(mesh);
        helper.disposePointMesh(mesh);
        meshes.delete(id);
      }
    }

    // Add/update meshes for existing points
    for (const point of points) {
      let mesh = meshes.get(point.id);
      if (!mesh) {
        mesh = helper.createPointMesh(point);
        meshes.set(point.id, mesh);
        sceneSystem.add(mesh);
      } else {
        helper.updatePointMesh(mesh, point);
      }
      mesh.setSelected(point.id === selectedPointId);
    }

    // Update rail line
    helper.updateRailLine(points, sceneSystem.scene);

    // Notify parent of changes
    onPointsChange([...points]);
  }, [selectedPointId, onPointsChange]);

  // Initialize scene and viewport once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create shared scene system
    const sceneSystem = createSceneSystem();
    sceneRef.current = sceneSystem;

    // Create editor viewport
    const viewport = createEditorViewport({
      container,
      scene: sceneSystem.scene,
    });
    viewportRef.current = viewport;
    viewport.start();

    // Create camera rail system
    const rail = createCameraRailSystem();
    railRef.current = rail;

    // Create control point helper system
    const helper = createControlPointHelperSystem();
    helperRef.current = helper;

    return () => {
      // Clean up point meshes
      const meshes = pointMeshesRef.current;
      for (const [, mesh] of meshes) {
        sceneSystem.remove(mesh);
        helper.disposePointMesh(mesh);
      }
      meshes.clear();

      helper.disposeRailLine(sceneSystem.scene);
      helper.dispose();
      rail.dispose();
      viewport.dispose();
      sceneSystem.dispose();
      viewportRef.current = null;
      sceneRef.current = null;
      splatRef.current = null;
      railRef.current = null;
      helperRef.current = null;
    };
  }, []);

  // Load/swap splat when URL changes
  useEffect(() => {
    const sceneSystem = sceneRef.current;
    if (!sceneSystem) return;

    // Remove existing splat if any
    if (splatRef.current) {
      sceneSystem.remove(splatRef.current);
      splatRef.current.dispose();
      splatRef.current = null;
    }

    // Load and add the new splat
    const splat = new SplatMesh({ url: splatUrl });
    // Position at origin (grid center) for editor view
    splat.position.set(0, 0, 0);
    splat.quaternion.set(1, 0, 0, 0);
    splatRef.current = splat;
    sceneSystem.add(splat);

    return () => {
      if (splatRef.current && sceneRef.current) {
        sceneRef.current.remove(splatRef.current);
        splatRef.current.dispose();
        splatRef.current = null;
      }
    };
  }, [splatUrl]);

  // Update selection visualization when selectedPointId changes
  useEffect(() => {
    const meshes = pointMeshesRef.current;
    for (const [id, mesh] of meshes) {
      mesh.setSelected(id === selectedPointId);
    }
  }, [selectedPointId]);

  // Handle click/drag events based on mode
  useEffect(() => {
    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (!container || !viewport) return;

    const raycaster = raycasterRef.current;
    const dragPlane = dragPlaneRef.current;

    function getMousePosition(event: MouseEvent): THREE.Vector2 {
      const rect = container!.getBoundingClientRect();
      return new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
    }

    function getIntersectionPoint(event: MouseEvent): THREE.Vector3 | null {
      const camera = viewport!.camera;
      const mouse = getMousePosition(event);
      raycaster.setFromCamera(mouse, camera);

      // Intersect with the grid plane (y = 0)
      const intersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        return intersection;
      }
      return null;
    }

    function getHitPointMesh(event: MouseEvent): ControlPointMesh | null {
      const camera = viewport!.camera;
      const mouse = getMousePosition(event);
      raycaster.setFromCamera(mouse, camera);

      const meshes = Array.from(pointMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        // Find the parent ControlPointMesh
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj) {
          if ("pointId" in obj) {
            return obj as ControlPointMesh;
          }
          obj = obj.parent;
        }
      }
      return null;
    }

    function handlePointerDown(event: MouseEvent) {
      if (event.button !== 0) return; // Left click only

      const rail = railRef.current;
      if (!rail) return;

      if (mode === "create") {
        // Add a new control point at click position
        const point = getIntersectionPoint(event);
        if (point) {
          // Use current camera orientation for the new point
          const camera = viewport!.camera;
          const quaternion = camera.quaternion.clone();
          rail.addPoint(point, quaternion);
          syncPointMeshes();
        }
      } else if (mode === "edit") {
        // Check if clicking on a point mesh
        const hitMesh = getHitPointMesh(event);
        if (hitMesh) {
          onSelectPoint(hitMesh.pointId);
          isDraggingRef.current = true;
          // Disable orbit controls while dragging
          viewport!.controls.enabled = false;

          // Set drag plane to pass through the selected point
          const point = rail.getPoint(hitMesh.pointId);
          if (point) {
            dragPlane.constant = -point.position.y;
          }
        } else {
          onSelectPoint(null);
        }
      }
    }

    function handlePointerMove(event: MouseEvent) {
      if (!isDraggingRef.current || mode !== "edit" || !selectedPointId) return;

      const rail = railRef.current;
      if (!rail) return;

      const point = getIntersectionPoint(event);
      if (point) {
        rail.updatePoint(selectedPointId, point);
        syncPointMeshes();
      }
    }

    function handlePointerUp() {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        viewport!.controls.enabled = true;
      }
    }

    // Only add listeners if in create or edit mode
    if (mode === "create" || mode === "edit") {
      container.addEventListener("pointerdown", handlePointerDown);
      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerup", handlePointerUp);
      container.addEventListener("pointerleave", handlePointerUp);
    }

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointerleave", handlePointerUp);
    };
  }, [mode, selectedPointId, syncPointMeshes, onSelectPoint]);

  // Expose delete functionality
  useEffect(() => {
    // Store delete function on window for RailEditor to call
    // This is a simple approach; could use context or refs for cleaner API
    (window as unknown as { __deleteControlPoint: (id: string) => void }).__deleteControlPoint = (id: string) => {
      const rail = railRef.current;
      if (!rail) return;

      rail.removePoint(id);
      if (selectedPointId === id) {
        onSelectPoint(null);
      }
      syncPointMeshes();
    };

    return () => {
      delete (window as unknown as { __deleteControlPoint?: (id: string) => void }).__deleteControlPoint;
    };
  }, [selectedPointId, onSelectPoint, syncPointMeshes]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", cursor: mode === "create" ? "crosshair" : mode === "edit" ? "pointer" : "default" }}
    />
  );
}
