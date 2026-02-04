"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import { EditorView } from "@/components/EditorView";
import { PlayerView } from "@/components/PlayerView";
import { RailEditor, type EditorMode } from "@/components/RailEditor";
import { SplatLoader } from "@/components/SplatLoader";
import { Toolbar } from "@/components/Toolbar";
import { ExportButton } from "@/components/ExportButton";
import { InfoModal } from "@/components/InfoModal";
import type { ControlPoint, CameraRailSystem } from "@/systems/camera-rail";
import type { SceneSystem } from "@/systems/scene";
import { storageGet, storageSet } from "@/lib/storage";

const DEFAULT_SPLAT_URL = "/default.spz";
const STORAGE_KEY = "railbird:splatUrl";

// Custom event for same-tab storage updates
const STORAGE_UPDATE_EVENT = "railbird-storage-update";

// Subscribe to storage changes (for useSyncExternalStore)
function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_UPDATE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_UPDATE_EVENT, callback);
  };
}

// Get current snapshot from storage
function getStorageSnapshot() {
  return storageGet(STORAGE_KEY) || DEFAULT_SPLAT_URL;
}

// Server snapshot always returns default
function getServerSnapshot() {
  return DEFAULT_SPLAT_URL;
}

export default function Home() {
  // Read stored URL with proper SSR handling (single source of truth)
  const splatUrl = useSyncExternalStore(
    subscribeToStorage,
    getStorageSnapshot,
    getServerSnapshot
  );

  const [editorMode, setEditorMode] = useState<EditorMode>("select");
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  // Rail system stored in state since we render based on its presence
  const [railSystem, setRailSystem] = useState<CameraRailSystem | null>(null);

  const handleUrlSubmit = useCallback((url: string) => {
    if (url !== DEFAULT_SPLAT_URL) {
      storageSet(STORAGE_KEY, url);
    } else {
      // Clear storage when resetting to default
      storageSet(STORAGE_KEY, "");
    }
    // Trigger re-render for same-tab updates
    window.dispatchEvent(new Event(STORAGE_UPDATE_EVENT));
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
        src="/railbird.svg"
        alt="Railbird"
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
      {/* Export button and info - bottom right */}
      {railSystem && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
          <InfoModal />
          <ExportButton rail={railSystem} splatUrl={splatUrl} />
        </div>
      )}
    </main>
  );
}
