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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create rendering system
    const system = createRenderingSystem({
      container,
      onFrame: () => {
        // Rotate the splat for visual interest
        if (splatRef.current) {
          splatRef.current.rotation.y += 0.005;
        }
      },
    });
    systemRef.current = system;

    // Load and add the splat mesh
    const splat = new SplatMesh({ url: splatUrl });
    // Rotate to upright orientation (spz files often need this)
    splat.quaternion.set(1, 0, 0, 0);
    splat.position.set(0, 0, -3);
    splatRef.current = splat;
    system.scene.add(splat);

    // Start the render loop
    system.start();

    // Cleanup on unmount
    return () => {
      system.dispose();
      systemRef.current = null;
      splatRef.current = null;
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
