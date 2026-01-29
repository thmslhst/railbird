"use client";

/**
 * SplatLoader - UI component for loading custom splat URLs.
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SplatLoaderProps {
  defaultUrl: string;
  currentUrl: string;
  onUrlSubmit: (url: string) => void;
}

export function SplatLoader({ defaultUrl, currentUrl, onUrlSubmit }: SplatLoaderProps) {
  const [urlInputValue, setUrlInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = urlInputValue.trim();
      if (!trimmed) return;

      setError(null);
      setIsLoading(true);

      try {
        const response = await fetch(trimmed, { method: "HEAD" });
        if (!response.ok) {
          setError(`Failed to load: ${response.status} ${response.statusText}`);
          return;
        }
        onUrlSubmit(trimmed);
        setUrlInputValue("");
      } catch {
        setError("Failed to fetch URL");
      } finally {
        setIsLoading(false);
      }
    },
    [urlInputValue, onUrlSubmit]
  );

  const handleReset = useCallback(() => {
    onUrlSubmit(defaultUrl);
    setUrlInputValue("");
    setError(null);
  }, [defaultUrl, onUrlSubmit]);

  return (
    <Card className="bg-background/90 backdrop-blur-sm py-4 gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm">Splat Model</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="url"
            placeholder="https://example.com/model.spz"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            className="text-xs placeholder:text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Supports .spz, .splat, .ply
          </p>
          {error && (
            <p className="text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="xs" disabled={!urlInputValue.trim() || isLoading}>
              {isLoading ? "Loading..." : "Load"}
            </Button>
            {currentUrl !== defaultUrl && (
              <Button type="button" variant="outline" size="xs" onClick={handleReset}>
                Reset to default
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
