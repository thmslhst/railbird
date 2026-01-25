"use client";

/**
 * SplatViewer - A React component that renders a Gaussian splat.
 * React is used only for lifecycle orchestration.
 * Three.js objects are stored in refs, not state.
 */

import { useEffect, useRef } from "react";
import { SplatMesh } from "@sparkjsdev/spark";
import {
  createRenderingSystem,
  type RenderingSystem,
} from "@/systems/rendering";

interface SplatViewerProps {
  splatUrl: string;
  className?: string;
}

export function SplatViewer({ splatUrl, className }: SplatViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const systemRef = useRef<RenderingSystem | null>(null);
  const splatRef = useRef<SplatMesh | null>(null);

  // Initialize rendering system once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const system = createRenderingSystem({
      container,
      onFrame: () => {
        if (splatRef.current) {
          splatRef.current.rotation.y += 0.005;
        }
      },
    });
    systemRef.current = system;
    system.start();

    return () => {
      system.dispose();
      systemRef.current = null;
      splatRef.current = null;
    };
  }, []);

  // Load/swap splat when URL changes
  useEffect(() => {
    const system = systemRef.current;
    if (!system) return;

    // Remove existing splat if any
    if (splatRef.current) {
      system.scene.remove(splatRef.current);
      splatRef.current.dispose();
      splatRef.current = null;
    }

    // Load and add the new splat
    const splat = new SplatMesh({ url: splatUrl });
    splat.quaternion.set(1, 0, 0, 0);
    splat.position.set(0, 0, -3);
    splatRef.current = splat;
    system.scene.add(splat);

    return () => {
      // Cleanup on URL change or unmount
      if (splatRef.current && systemRef.current) {
        systemRef.current.scene.remove(splatRef.current);
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
