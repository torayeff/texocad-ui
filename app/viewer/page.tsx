import type { Metadata } from "next";

import { Header } from "@/app/components/header";
import { SITE_NAME } from "@/app/lib/site";
import { LocalModelViewer } from "@/app/viewer/_components/local-model-viewer";

export const metadata: Metadata = {
  title: "CAD Viewer",
  description: `Open STEP, STL, GLB, and self-contained GLTF files locally in ${SITE_NAME}.`,
  alternates: {
    canonical: "/viewer",
  },
};

export default function LocalViewerPage() {
  return (
    <main className="fixed left-0 top-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <div className="min-h-0 flex-1">
        <LocalModelViewer />
      </div>
    </main>
  );
}
