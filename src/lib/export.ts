/**
 * Export utilities for Railbird.
 *
 * The export format captures the "creative intent" - the camera rail,
 * scene reference, and future extensions (camera settings, shaders, lighting).
 *
 * Design philosophy (from ARCHITECTURE.md):
 * - Export data, not implementation
 * - JSON configs remain valid across library upgrades
 * - Consumers can use @railbird/player or roll their own
 *
 * The mental model: Figma → CSS, not Figma → static image.
 * Export the creative intent, let consumers handle rendering.
 */

import type { ControlPointData } from "@/systems/camera-rail";

/**
 * The Railbird export format.
 * Designed for easy integration into scroll-driven websites.
 */
export interface RailbirdExport {
  version: string;
  scene: {
    url: string;
    position?: [number, number, number];
    rotation?: [number, number, number, number];
  };
  rail: {
    controlPoints: ControlPointData[];
    interpolation: "linear" | "catmull-rom";
  };
  // Future extensions:
  // camera?: { fov?: number; near?: number; far?: number };
  // shaders?: { ... };
  // lighting?: { ... };
}

export const EXPORT_VERSION = "1.0";

export interface CreateExportOptions {
  sceneUrl: string;
  controlPoints: ControlPointData[];
  interpolation?: "linear" | "catmull-rom";
}

/**
 * Create the export data structure from current state.
 */
export function createExport(options: CreateExportOptions): RailbirdExport {
  const { sceneUrl, controlPoints, interpolation = "linear" } = options;

  return {
    version: EXPORT_VERSION,
    scene: {
      url: sceneUrl,
    },
    rail: {
      controlPoints,
      interpolation,
    },
  };
}

/**
 * Download the export as a JSON file.
 */
export function downloadExport(
  exportData: RailbirdExport,
  filename = "railbird-rail.json"
): void {
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
