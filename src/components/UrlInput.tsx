"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UrlInputProps {
  defaultUrl: string;
  onUrlSubmit: (url: string) => void;
}

export function UrlInput({ defaultUrl, onUrlSubmit }: UrlInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        onUrlSubmit(trimmed);
        setIsExpanded(false);
      }
    },
    [inputValue, onUrlSubmit]
  );

  const handleReset = useCallback(() => {
    onUrlSubmit(defaultUrl);
    setInputValue("");
    setIsExpanded(false);
  }, [defaultUrl, onUrlSubmit]);

  if (!isExpanded) {
    return (
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          Load Custom URL
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-10 w-96 max-w-[calc(100vw-2rem)]">
      <form
        onSubmit={handleSubmit}
        className="bg-background/90 backdrop-blur-sm border rounded-lg p-4 shadow-lg"
      >
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">
            Splat URL
            <span className="text-muted-foreground font-normal ml-1">
              (.spz, .splat, .ply)
            </span>
          </label>
          <Input
            type="url"
            placeholder="https://example.com/model.spz"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!inputValue.trim()}>
              Load
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              Reset to Default
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="ml-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
