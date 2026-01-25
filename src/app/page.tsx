"use client";

import { useState, useCallback } from "react";
import { SplatViewer } from "@/components/SplatViewer";
import { UrlInput } from "@/components/UrlInput";

const DEFAULT_SPLAT_URL = "/butterfly.spz";

export default function Home() {
  const [splatUrl, setSplatUrl] = useState(DEFAULT_SPLAT_URL);

  const handleUrlSubmit = useCallback((url: string) => {
    setSplatUrl(url);
  }, []);

  return (
    <main className="relative h-screen w-screen">
      <SplatViewer splatUrl={splatUrl} className="h-full w-full" />
      <UrlInput defaultUrl={DEFAULT_SPLAT_URL} onUrlSubmit={handleUrlSubmit} />
    </main>
  );
}
