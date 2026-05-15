import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Header } from "@/app/components/header";
import { getSharedModelBySlug } from "@/app/lib/server/shared-models";
import { SITE_NAME } from "@/app/lib/site";
import { SharedModelViewer } from "@/app/viewer/[slug]/_components/shared-model-viewer";

interface ViewerPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ViewerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sharedModel = await getSharedModelBySlug(slug);

  if (!sharedModel) {
    return {
      title: "Shared model",
    };
  }

  return {
    title: sharedModel.name,
    description: `View ${sharedModel.name} on ${SITE_NAME}.`,
    alternates: {
      canonical: `/viewer/${sharedModel.slug}`,
    },
  };
}

export default async function ViewerPage({ params }: ViewerPageProps) {
  const { slug } = await params;
  const sharedModel = await getSharedModelBySlug(slug);

  if (!sharedModel) {
    notFound();
  }

  return (
    <main className="fixed left-0 top-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <div className="min-h-0 flex-1">
        <SharedModelViewer
          source={{
            kind: "url",
            label: sharedModel.filename,
            url: sharedModel.modelUrl,
          }}
        />
      </div>
    </main>
  );
}
