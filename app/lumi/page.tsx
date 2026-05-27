import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BrainCircuit,
  Gem,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { SITE_ROUTES } from "@/app/lib/site";

const highlights = [
  {
    label: "For life's moments",
    icon: Sparkles,
  },
  {
    label: "Human verified",
    icon: ShieldCheck,
  },
  {
    label: "AI-guided design",
    icon: BrainCircuit,
  },
  {
    label: "Crafted with precision",
    icon: Gem,
  },
];

const galleryItems = [
  {
    label: "Solitaire",
    src: "/images/lumi/rings/solitaire.png",
  },
  {
    label: "Halo",
    src: "/images/lumi/rings/halo.png",
  },
  {
    label: "Vintage",
    src: "/images/lumi/rings/vintage.png",
  },
  {
    label: "Minimal",
    src: "/images/lumi/rings/minimal.png",
  },
  {
    label: "Modern",
    src: "/images/lumi/rings/modern.png",
  },
  {
    label: "More",
    src: "/images/lumi/rings/gallery.png",
  },
];

export const metadata: Metadata = {
  title: "Lumi AI Jewellery Design Assistant",
  description:
    "Describe your dream ring and let Lumi, TexoCAD's AI jewellery design assistant, turn it into a guided design concept.",
  alternates: {
    canonical: SITE_ROUTES.lumi,
  },
};

export default function LumiPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#f8f7f4] text-[#191817]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_42%,rgb(255_255_255_/_0.9),transparent_34%),linear-gradient(90deg,rgb(255_255_255_/_0.84)_0%,rgb(248_247_244_/_0.84)_48%,rgb(246_243_238_/_0.56)_100%)]" />

      <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
        <Link
          href={SITE_ROUTES.home}
          className="flex items-baseline gap-2 text-[12px] font-light tracking-[0.38em] text-[#171717]"
          aria-label="TexoCAD home"
        >
          <span>LUMI</span>
          <span className="text-[10px] font-normal tracking-normal text-[#4f4a45]">
            by TexoCAD
          </span>
        </Link>

        <Link
          href={SITE_ROUTES.studio}
          className="rounded-full bg-[#171717] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_12px_30px_rgb(0_0_0_/_0.12)] transition-colors hover:bg-[#2b2b2b]"
        >
          Get Started
        </Link>
      </header>

      <section className="relative z-10 grid min-h-[calc(100dvh-4.75rem)] items-center gap-10 px-6 pb-10 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:px-16 lg:pb-0">
        <div className="order-2 max-w-[34rem] pt-0 lg:order-1 lg:pb-16">
          <h1 className="text-balance text-[clamp(3.4rem,8vw,5.9rem)] font-extralight leading-[0.95] tracking-[-0.065em]">
            Lumi,
            <span className="mt-2 block text-[clamp(2rem,4.6vw,3.55rem)] leading-[1.02] tracking-[-0.07em]">
              your personal AI jewellery design assistant.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-sm font-light leading-5 text-[#817b73] sm:text-base lg:whitespace-nowrap">
            Describe your dream ring and Lumi shapes it into fine jewellery.
          </p>

          <Link
            href={SITE_ROUTES.studio}
            className="mt-7 inline-flex rounded-full bg-[#171717] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_14px_34px_rgb(0_0_0_/_0.12)] transition-colors hover:bg-[#2b2b2b]"
          >
            Start Designing
          </Link>

          <ul className="mt-10 grid max-w-[32rem] gap-x-8 gap-y-5 text-[12px] font-light text-[#514d48] sm:grid-cols-2">
            {highlights.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-4 whitespace-nowrap">
                <Icon
                  size={16}
                  strokeWidth={1.35}
                  className="shrink-0 text-[#7d776f]"
                  aria-hidden="true"
                />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 max-w-[34rem]">
            <p className="mb-3 text-[11px] font-light uppercase tracking-[0.18em] text-[#817b73]">
              Gallery
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {galleryItems.map((item) => (
                <Link
                  key={item.label}
                  href={SITE_ROUTES.studio}
                  className="group overflow-hidden rounded-2xl border border-white/70 bg-white/45 p-2 shadow-[0_14px_40px_rgb(57_50_43_/_0.06)] backdrop-blur transition-colors hover:bg-white/70"
                >
                  <span className="relative block aspect-square overflow-hidden rounded-xl bg-[#f5f3ef]">
                    <Image
                      src={item.src}
                      alt={`${item.label} ring design`}
                      width={320}
                      height={320}
                      className="h-full w-full scale-125 object-contain transition-transform duration-300 group-hover:scale-[1.32]"
                      sizes="(min-width: 1024px) 96px, (min-width: 640px) 18vw, 42vw"
                    />
                  </span>
                  <span className="mt-2 block text-center text-[10px] font-light text-[#625c55]">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none order-1 relative mx-auto h-[22rem] w-full max-w-[30rem] lg:order-2 lg:h-full lg:min-h-[38rem] lg:max-w-none">
          <div className="absolute inset-0 lg:inset-y-0 lg:left-auto lg:right-[-7vw] lg:w-[55vw] lg:max-w-[52rem]">
            <Image
              src="/images/lumi/lumi.png"
              alt="Lumi AI jewellery design assistant"
              width={1254}
              height={1254}
              priority
              className="h-full w-full object-contain object-bottom drop-shadow-[0_26px_80px_rgb(105_79_52_/_0.16)]"
              sizes="(min-width: 1024px) 50vw, 90vw"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
