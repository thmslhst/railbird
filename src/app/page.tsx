"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { SplatViewer } from "@/components/SplatViewer";
import { UrlInput } from "@/components/UrlInput";

const DEFAULT_SPLAT_URL = "/burger-from-amboy.spz";

export default function Home() {
  const [splatUrl, setSplatUrl] = useState(DEFAULT_SPLAT_URL);

  const handleUrlSubmit = useCallback((url: string) => {
    setSplatUrl(url);
  }, []);

  return (
    <main className="relative h-screen w-screen">
      <SplatViewer splatUrl={splatUrl} className="h-full w-full" />
      {/* Logo - top left */}
      <Image
        src="/splato.svg"
        alt="Splato"
        width={94}
        height={36}
        className="absolute top-4 left-4 z-10 h-6 w-auto"
        priority
      />
      <UrlInput defaultUrl={DEFAULT_SPLAT_URL} onUrlSubmit={handleUrlSubmit} />
    </main>
  );
}
