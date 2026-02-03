"use client";

/**
 * Toolbar - Bottom-center toolbar for editor mode selection.
 * Figma-style floating toolbar with select and point creation modes.
 * Keyboard shortcuts: S for select, P for add point.
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EditorMode } from "./RailEditor";

interface ToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

export function Toolbar({ mode, onModeChange }: ToolbarProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "s":
          onModeChange("select");
          break;
        case "p":
          onModeChange("create");
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onModeChange]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === "select" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("select")}
                className="gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                  <path d="M13 13l6 6" />
                </svg>
                Select
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Key: <kbd className="ml-1 px-1 py-0.5 rounded bg-white/20 text-[10px] font-mono">S</kbd></p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === "create" ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange("create")}
                className="gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
                Add Point
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Key: <kbd className="ml-1 px-1 py-0.5 rounded bg-white/20 text-[10px] font-mono">P</kbd></p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
