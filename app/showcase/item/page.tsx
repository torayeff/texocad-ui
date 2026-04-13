import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/app/components/Header";
import {
  SITE_NAME,
  SITE_URL,
} from "@/app/lib/site";
import ShowcaseItemClient from "@/app/showcase/item/_components/ShowcaseItemClient";
import {
  getShowcaseItemByThreadId,
  getShowcaseItemCanonical,
  getShowcaseItemImageUrl,
  getShowcaseItemSummary,
} from "@/app/showcase/_lib/showcase";

interface ShowcaseItemPageProps {
  searchParams: Promise<{
    id?: string | string[];
  }>;
}

function getIdFromSearchParams(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function renderMissingItem() {
  return (
    <main className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Item not found</p>
          <Link
            href="/"
            className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} className="mr-1 inline" />
            Back to showcase
          </Link>
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({
  searchParams,
}: ShowcaseItemPageProps): Promise<Metadata> {
  const params = await searchParams;
  const id = getIdFromSearchParams(params.id);

  if (!id) {
    return {
      title: {
        absolute: `Showcase | ${SITE_NAME}`,
      },
      description: "Browse showcase examples generated with TexoCAD.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const item = await getShowcaseItemByThreadId(id);
  if (!item) {
    return {
      title: {
        absolute: `Showcase Item Not Found | ${SITE_NAME}`,
      },
      description: "The requested TexoCAD showcase item is not available.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${item.name} | ${SITE_NAME} Showcase`;
  const description = getShowcaseItemSummary(item);
  const canonical = getShowcaseItemCanonical(item.thread_id);
  const imageUrl = getShowcaseItemImageUrl(item.thread_id);

  return {
    title: {
      absolute: title,
    },
    description,
    keywords: item.parts,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: item.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ShowcaseItemPage({
  searchParams,
}: ShowcaseItemPageProps) {
  const params = await searchParams;
  const id = getIdFromSearchParams(params.id);

  if (!id) {
    return renderMissingItem();
  }

  const item = await getShowcaseItemByThreadId(id);
  if (!item) {
    return renderMissingItem();
  }

  const canonical = getShowcaseItemCanonical(item.thread_id);
  const description = getShowcaseItemSummary(item);
  const imageUrl = getShowcaseItemImageUrl(item.thread_id);
  const creativeWorkJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${canonical}#creativework`,
    name: item.name,
    description,
    abstract: item.prompt,
    url: canonical,
    image: imageUrl,
    inLanguage: "en-US",
    keywords: item.parts.join(", "),
    creator: {
      "@id": `${SITE_URL}/#organization`,
    },
    isPartOf: {
      "@id": `${SITE_URL}/#website`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    about: [
      {
        "@type": "Thing",
        name: "Text-to-CAD",
      },
      {
        "@type": "Thing",
        name: "Editable CAD",
      },
      {
        "@type": "Thing",
        name: item.name,
      },
    ],
  };

  return (
    <main className="flex h-screen flex-col bg-background">
      <script
        id={`showcase-item-jsonld-${item.thread_id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(creativeWorkJsonLd),
        }}
      />
      <Header />
      <ShowcaseItemClient item={item} />
    </main>
  );
}
