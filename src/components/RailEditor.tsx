"use client";

/**
 * RailEditor - UI component for managing camera rail control points.
 * Provides mode switching (create/edit), a list of control points, and URL loading.
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ControlPoint } from "@/systems/camera-rail";

export type EditorMode = "view" | "create" | "edit";

interface RailEditorProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  controlPoints: ControlPoint[];
  selectedPointId: string | null;
  onSelectPoint: (id: string | null) => void;
  onDeletePoint: (id: string) => void;
  defaultSplatUrl: string;
  onUrlSubmit: (url: string) => void;
}

export function RailEditor({
  mode,
  onModeChange,
  controlPoints,
  selectedPointId,
  onSelectPoint,
  onDeletePoint,
  defaultSplatUrl,
  onUrlSubmit,
}: RailEditorProps) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");

  const handleUrlSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = urlInputValue.trim();
      if (trimmed) {
        onUrlSubmit(trimmed);
        setShowUrlInput(false);
        setUrlInputValue("");
      }
    },
    [urlInputValue, onUrlSubmit]
  );

  const handleReset = useCallback(() => {
    onUrlSubmit(defaultSplatUrl);
    setShowUrlInput(false);
    setUrlInputValue("");
  }, [defaultSplatUrl, onUrlSubmit]);

  return (
    <div className="absolute top-4 right-4 z-10 w-64">
      <Card className="bg-background/90 backdrop-blur-sm py-4 gap-4">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Camera Rail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL and Mode buttons row */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="shrink-0"
            >
              Load URL
            </Button>
            <Button
              variant={mode === "create" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange(mode === "create" ? "view" : "create")}
              className="flex-1"
            >
              {mode === "create" ? "Adding..." : "Add"}
            </Button>
            <Button
              variant={mode === "edit" ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange(mode === "edit" ? "view" : "edit")}
              className="flex-1"
            >
              {mode === "edit" ? "Editing..." : "Edit"}
            </Button>
          </div>

          {/* URL Input form */}
          {showUrlInput && (
            <form onSubmit={handleUrlSubmit} className="space-y-2">
              <Input
                type="url"
                placeholder="https://example.com/model.spz"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                autoFocus
                className="text-xs"
              />
              <div className="flex gap-2">
                <Button type="submit" size="xs" disabled={!urlInputValue.trim()}>
                  Load
                </Button>
                <Button type="button" variant="outline" size="xs" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowUrlInput(false)}
                  className="ml-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Instructions */}
          {mode === "create" && (
            <p className="text-xs text-muted-foreground">
              Click on the scene to add control points
            </p>
          )}
          {mode === "edit" && (
            <p className="text-xs text-muted-foreground">
              Click a point to select, then drag to move
            </p>
          )}

          {/* Control points list */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">
              Points ({controlPoints.length})
            </div>
            {controlPoints.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 italic">
                No points yet
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {controlPoints.map((point, index) => (
                  <div
                    key={point.id}
                    className={`
                      flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs
                      cursor-pointer transition-colors
                      ${
                        selectedPointId === point.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted"
                      }
                    `}
                    onClick={() =>
                      onSelectPoint(selectedPointId === point.id ? null : point.id)
                    }
                  >
                    <span className="font-mono">
                      {index + 1}. ({point.position.x.toFixed(1)},{" "}
                      {point.position.y.toFixed(1)}, {point.position.z.toFixed(1)})
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePoint(point.id);
                      }}
                      className={
                        selectedPointId === point.id
                          ? "hover:bg-primary-foreground/20"
                          : "hover:bg-destructive/20"
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
