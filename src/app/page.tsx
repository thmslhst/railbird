"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { EditorView } from "@/components/EditorView";
import { RailEditor, type EditorMode } from "@/components/RailEditor";
import { SplatLoader } from "@/components/SplatLoader";
import { Toolbar } from "@/components/Toolbar";
import type { ControlPoint } from "@/systems/camera-rail";

const DEFAULT_SPLAT_URL = "/burger-from-amboy.spz";

export default function Home() {
  const [splatUrl, setSplatUrl] = useState(DEFAULT_SPLAT_URL);
  const [editorMode, setEditorMode] = useState<EditorMode>("select");
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const handleUrlSubmit = useCallback((url: string) => {
    setSplatUrl(url);
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
      />
      {/* Logo - top left */}
      <Image
        src="/splato.svg"
        alt="Splato"
        width={94}
        height={36}
        className="absolute top-4 left-4 z-10 h-6 w-auto"
        priority
      />
      {/* Editor panels - top right */}
      <div className="absolute top-4 right-4 z-10 w-64 space-y-3">
        <RailEditor
          controlPoints={controlPoints}
          selectedPointId={selectedPointId}
          onSelectPoint={setSelectedPointId}
          onDeletePoint={handleDeletePoint}
        />
        <SplatLoader
          defaultUrl={DEFAULT_SPLAT_URL}
          onUrlSubmit={handleUrlSubmit}
        />
      </div>
      {/* Bottom toolbar */}
      <Toolbar mode={editorMode} onModeChange={setEditorMode} />
    </main>
  );
}
