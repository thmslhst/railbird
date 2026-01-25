import { SplatViewer } from "@/components/SplatViewer";

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <SplatViewer
        splatUrl="/butterfly.spz"
        className="h-full w-full"
      />
    </main>
  );
}
