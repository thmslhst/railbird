"use client";

import { Button } from "@/components/ui/button";
import { createExport, downloadExport } from "@/lib/export";
import type { CameraRailSystem } from "@/systems/camera-rail";

interface ExportButtonProps {
  rail: CameraRailSystem;
  splatUrl: string;
}

export function ExportButton({ rail, splatUrl }: ExportButtonProps) {
  const handleExport = () => {
    const controlPoints = rail.toJSON();

    if (controlPoints.length === 0) {
      return;
    }

    const exportData = createExport({ splatUrl, controlPoints });
    downloadExport(exportData);
  };

  const hasPoints = rail.controlPoints.length > 0;

  return (
    <Button
      onClick={handleExport}
      disabled={!hasPoints}
      className="gap-2"
    >
      Export
    </Button>
  );
}
