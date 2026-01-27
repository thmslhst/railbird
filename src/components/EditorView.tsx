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
  onModeChange: (mode: EditorMode) => void;
}

export function EditorView({
  splatUrl,
  className,
  mode,
  selectedPointId,
  onPointsChange,
  onSelectPoint,
  onModeChange,
}: EditorViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneSystem | null>(null);
  const viewportRef = useRef<EditorViewport | null>(null);
  const splatRef = useRef<SplatMesh | null>(null);
  const railRef = useRef<CameraRailSystem | null>(null);
  const helperRef = useRef<ControlPointHelperSystem | null>(null);
  const pointMeshesRef = useRef<Map<string, ControlPointMesh>>(new Map());

  // For drag handling (position and rotation)
  const isDraggingPositionRef = useRef(false);
  const isDraggingRotationRef = useRef(false);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycasterRef = useRef(new THREE.Raycaster());
  const lastMouseRef = useRef(new THREE.Vector2());

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
    const lastMouse = lastMouseRef.current;

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

      // Intersect with the drag plane (set dynamically based on camera view)
      const intersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        return intersection;
      }
      return null;
    }

    // Update drag plane to face the camera, passing through a given point
    function updateDragPlaneFromCamera(throughPoint: THREE.Vector3) {
      const camera = viewport!.camera;
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      // Plane faces the camera, passing through the specified point
      dragPlane.setFromNormalAndCoplanarPoint(cameraDirection, throughPoint);
    }

    interface HitResult {
      mesh: ControlPointMesh;
      hitCone: boolean; // True if the cone was hit, false if sphere
    }

    function getHitPointMesh(event: MouseEvent): HitResult | null {
      const camera = viewport!.camera;
      const mouse = getMousePosition(event);
      raycaster.setFromCamera(mouse, camera);

      const meshes = Array.from(pointMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        const hitCone = hitObject.name === "cone";

        // Find the parent ControlPointMesh
        let obj: THREE.Object3D | null = hitObject;
        while (obj) {
          if ("pointId" in obj) {
            return { mesh: obj as ControlPointMesh, hitCone };
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

      // Store initial mouse position for rotation dragging
      lastMouse.copy(getMousePosition(event));

      if (mode === "create") {
        // Set drag plane facing camera, through origin for new point creation
        updateDragPlaneFromCamera(new THREE.Vector3(0, 0, 0));

        // Add a new control point at click position
        const point = getIntersectionPoint(event);
        if (point) {
          // Use current camera orientation for the new point
          const camera = viewport!.camera;
          const quaternion = camera.quaternion.clone();
          rail.addPoint(point, quaternion);
          syncPointMeshes();
          // Auto-switch back to select mode after adding a point
          onModeChange("select");
        }
      } else if (mode === "select") {
        // Check if clicking on a point mesh
        const hitResult = getHitPointMesh(event);
        if (hitResult) {
          onSelectPoint(hitResult.mesh.pointId);

          // Set drag plane facing camera, through the selected point
          const point = rail.getPoint(hitResult.mesh.pointId);
          if (point) {
            updateDragPlaneFromCamera(point.position);
          }

          // Determine if we're rotating (cone clicked) or moving (sphere clicked)
          if (hitResult.hitCone) {
            // Rotation dragging
            isDraggingRotationRef.current = true;
            viewport!.controls.enabled = false;
          } else {
            // Position dragging
            isDraggingPositionRef.current = true;
            viewport!.controls.enabled = false;
          }
        } else {
          // Clicked on empty space - deselect
          onSelectPoint(null);
        }
      }
    }

    function handlePointerMove(event: MouseEvent) {
      if (mode !== "select" || !selectedPointId) return;

      const rail = railRef.current;
      const helper = helperRef.current;
      const sceneSystem = sceneRef.current;
      if (!rail || !helper || !sceneSystem) return;

      if (isDraggingPositionRef.current) {
        // Position dragging (sphere was clicked)
        const point = getIntersectionPoint(event);
        if (point) {
          rail.updatePoint(selectedPointId, point);
          syncPointMeshes();
        }
      } else if (isDraggingRotationRef.current) {
        // Rotation dragging (cone was clicked)
        const currentMouse = getMousePosition(event);
        const deltaX = currentMouse.x - lastMouse.x;
        const deltaY = currentMouse.y - lastMouse.y;
        lastMouse.copy(currentMouse);

        // Get the current point's quaternion
        const controlPoint = rail.getPoint(selectedPointId);
        if (!controlPoint) return;

        // Rotation sensitivity
        const sensitivity = 2.0;

        // Create rotation from mouse delta
        // Horizontal mouse movement → yaw (rotate around world Y axis)
        // Vertical mouse movement → pitch (rotate around local X axis)
        const yawDelta = deltaX * sensitivity;
        const pitchDelta = deltaY * sensitivity;

        // Create quaternions for yaw and pitch
        const yawQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          yawDelta
        );
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          pitchDelta
        );

        // Apply rotations: yaw is applied in world space, pitch in local space
        // newQuat = yawQuat * currentQuat * pitchQuat
        const newQuat = new THREE.Quaternion()
          .copy(yawQuat)
          .multiply(controlPoint.quaternion)
          .multiply(pitchQuat);

        // Update the rail system
        rail.updatePoint(selectedPointId, undefined, newQuat);

        // Update visualization
        const mesh = pointMeshesRef.current.get(selectedPointId);
        if (mesh) {
          helper.updatePointMesh(mesh, rail.getPoint(selectedPointId)!);
        }
        helper.updateRailLine(rail.controlPoints, sceneSystem.scene);
      }
    }

    function handlePointerUp() {
      if (isDraggingPositionRef.current || isDraggingRotationRef.current) {
        isDraggingPositionRef.current = false;
        isDraggingRotationRef.current = false;
        viewport!.controls.enabled = true;
      }
    }

    // Only add listeners if in create or select mode
    if (mode === "create" || mode === "select") {
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
  }, [mode, selectedPointId, syncPointMeshes, onSelectPoint, onModeChange]);

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
      style={{ width: "100%", height: "100%", cursor: mode === "create" ? "crosshair" : "default" }}
    />
  );
}
