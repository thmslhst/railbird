"use client";

/**
 * RailEditor - UI component for displaying camera rail control points.
 * Shows a list of control points with selection and deletion.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ControlPoint } from "@/systems/camera-rail";

export type EditorMode = "select" | "create";

interface RailEditorProps {
  controlPoints: ControlPoint[];
  selectedPointId: string | null;
  onSelectPoint: (id: string | null) => void;
  onDeletePoint: (id: string) => void;
}

export function RailEditor({
  controlPoints,
  selectedPointId,
  onSelectPoint,
  onDeletePoint,
}: RailEditorProps) {
  return (
    <Card className="bg-background/90 backdrop-blur-sm py-4 gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">Camera Rail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
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
            <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-1">
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
  );
}
