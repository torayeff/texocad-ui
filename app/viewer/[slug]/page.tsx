import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/app/components/header";
import { getSharedArtifactBySlug } from "@/app/lib/server/shared-artifacts";
import { SITE_NAME } from "@/app/lib/site";
import { SharedModelViewer } from "@/app/viewer/[slug]/_components/shared-model-viewer";
import { SharedSketchViewer } from "@/app/viewer/[slug]/_components/shared-sketch-viewer";

interface ViewerPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ViewerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sharedArtifact = await getSharedArtifactBySlug(slug);

  if (!sharedArtifact) {
    return {
      title: "Shared artifact",
    };
  }

  return {
    title: sharedArtifact.name,
    description: `View ${sharedArtifact.name} on ${SITE_NAME}.`,
    alternates: {
      canonical: `/viewer/${sharedArtifact.slug}`,
    },
  };
}

export default async function ViewerPage({ params }: ViewerPageProps) {
  const { slug } = await params;
  const sharedArtifact = await getSharedArtifactBySlug(slug);

  if (!sharedArtifact) {
    notFound();
  }

  return (
    <main className="fixed left-0 top-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <div className="min-h-0 flex-1">
        {sharedArtifact.kind === "sketch" ? (
          <SharedSketchViewer
            source={{
              kind: "url",
              label: sharedArtifact.filename,
              url: sharedArtifact.artifactUrl,
            }}
          />
        ) : (
          <SharedModelViewer
            source={{
              kind: "url",
              label: sharedArtifact.filename,
              url: sharedArtifact.artifactUrl,
            }}
          />
        )}
      </div>
    </main>
  );
}
