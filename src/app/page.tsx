"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { EditorView } from "@/components/EditorView";
import { PlayerView } from "@/components/PlayerView";
import { RailEditor, type EditorMode } from "@/components/RailEditor";
import { SplatLoader } from "@/components/SplatLoader";
import { Toolbar } from "@/components/Toolbar";
import { ExportButton } from "@/components/ExportButton";
import type { ControlPoint, CameraRailSystem } from "@/systems/camera-rail";
import type { SceneSystem } from "@/systems/scene";
import { storageGet, storageSet } from "@/lib/storage";

const DEFAULT_SPLAT_URL = "/burger-from-amboy.spz";

export default function Home() {
  // Initialize with default, then load from storage in useEffect
  const [splatUrl, setSplatUrl] = useState(DEFAULT_SPLAT_URL);
  const [isHydrated, setIsHydrated] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("select");
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  // Rail system stored in state since we render based on its presence
  const [railSystem, setRailSystem] = useState<CameraRailSystem | null>(null);

  // Load splat URL from storage on mount
  useEffect(() => {
    const stored = storageGet("splato:splatUrl");
    if (stored) {
      setSplatUrl(stored);
    }
    setIsHydrated(true);
  }, []);

  // Save splat URL when it changes (skip default URL and initial hydration)
  useEffect(() => {
    if (!isHydrated) return;
    if (splatUrl === DEFAULT_SPLAT_URL) {
      // Don't persist the default URL
      return;
    }
    storageSet("splato:splatUrl", splatUrl);
  }, [splatUrl, isHydrated]);

  const handleUrlSubmit = useCallback((url: string) => {
    setSplatUrl(url);
  }, []);

  const handleSystemsReady = useCallback((_scene: SceneSystem, rail: CameraRailSystem) => {
    setRailSystem(rail);
  }, []);

  const handleDeletePoint = useCallback((id: string) => {
    // Call the delete function exposed by EditorView
    const deleteFunc = (window as unknown as { __deleteControlPoint?: (id: string) => void }).__deleteControlPoint;
    if (deleteFunc) {
      deleteFunc(id);
    }
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <EditorView
        splatUrl={splatUrl}
        className="h-full w-full"
        mode={editorMode}
        selectedPointId={selectedPointId}
        onPointsChange={setControlPoints}
        onSelectPoint={setSelectedPointId}
        onModeChange={setEditorMode}
        onSystemsReady={handleSystemsReady}
      />
      {/* Logo - top left */}
      <Image
        src="/splato_.svg"
        alt="Splato"
        width={94}
        height={36}
        className="absolute top-4 left-4 z-10 h-8 w-auto"
        priority
      />
      {/* Player preview - bottom left */}
      {railSystem && (
        <div className="absolute bottom-4 left-4 z-10 w-[24rem]">
          <PlayerView
            splatUrl={splatUrl}
            rail={railSystem}
            controlPoints={controlPoints}
            selectedPointId={selectedPointId}
          />
        </div>
      )}
      {/* Editor panels - top right */}
      <div className="absolute top-4 right-4 z-10 w-64 space-y-3">
        <SplatLoader
          defaultUrl={DEFAULT_SPLAT_URL}
          currentUrl={splatUrl}
          onUrlSubmit={handleUrlSubmit}
        />
        <RailEditor
          controlPoints={controlPoints}
          selectedPointId={selectedPointId}
          onSelectPoint={setSelectedPointId}
          onDeletePoint={handleDeletePoint}
        />
      </div>
      {/* Bottom toolbar */}
      <Toolbar mode={editorMode} onModeChange={setEditorMode} />
      {/* Export button - bottom right */}
      {railSystem && (
        <div className="absolute bottom-4 right-4 z-10">
          <ExportButton rail={railSystem} splatUrl={splatUrl} />
        </div>
      )}
    </main>
  );
}
