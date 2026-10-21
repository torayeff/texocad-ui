import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/app/components/header";
import { getSharedArtifactBySlug } from "@/app/lib/server/shared-artifacts";
import { SITE_NAME } from "@/app/lib/site";
import { SharedMarkdownViewer } from "@/app/viewer/[slug]/_components/shared-markdown-viewer";
import { SharedModelViewer } from "@/app/viewer/[slug]/_components/shared-model-viewer";
import { SharedSketchViewer } from "@/app/viewer/[slug]/_components/shared-sketch-viewer";
import type { SharedArtifact } from "@/app/lib/server/shared-artifact-types";

interface ViewerPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function sharedArtifactViewer(sharedArtifact: SharedArtifact) {
  switch (sharedArtifact.kind) {
    case "model":
      return (
        <SharedModelViewer
          source={{
            kind: "url",
            label: sharedArtifact.filename,
            url: sharedArtifact.artifactUrl,
          }}
        />
      );
    case "sketch":
      return (
        <SharedSketchViewer
          source={{
            kind: "url",
            label: sharedArtifact.filename,
            url: sharedArtifact.artifactUrl,
          }}
        />
      );
    case "markdown":
      return (
        <SharedMarkdownViewer
          source={{
            kind: "url",
            label: sharedArtifact.filename,
            url: sharedArtifact.artifactUrl,
            imageUrlsByFilename: Object.fromEntries(
              sharedArtifact.relatedArtifacts.map((artifact) => [artifact.filename, artifact.artifactUrl]),
            ),
          }}
        />
      );
    default: {
      const exhaustive: never = sharedArtifact.kind;
      return exhaustive;
    }
  }
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
    <main className="fixed left-0 top-[var(--announcement-height)] flex h-[var(--app-viewport-height)] w-full flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <div className="min-h-0 flex-1">
        {sharedArtifactViewer(sharedArtifact)}
      </div>
    </main>
  );
}
