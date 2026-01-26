"use client";

/**
 * EditorView - React component for the camera rail editor.
 * Provides a fullscreen view with OrbitControls and a grid.
 * React handles lifecycle; Three.js objects live in refs.
 */

import { useEffect, useRef } from "react";
import { SplatMesh } from "@sparkjsdev/spark";
import { createSceneSystem, type SceneSystem } from "@/systems/scene";
import {
  createEditorViewport,
  type EditorViewport,
} from "@/systems/editor-viewport";

interface EditorViewProps {
  splatUrl: string;
  className?: string;
}

export function EditorView({ splatUrl, className }: EditorViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneSystem | null>(null);
  const viewportRef = useRef<EditorViewport | null>(null);
  const splatRef = useRef<SplatMesh | null>(null);

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

    return () => {
      viewport.dispose();
      sceneSystem.dispose();
      viewportRef.current = null;
      sceneRef.current = null;
      splatRef.current = null;
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

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
