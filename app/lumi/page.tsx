import type { Metadata } from "next";

import { SITE_ROUTES } from "@/app/lib/site";
import LumiClient from "@/app/lumi/_components/lumi-client";

export const metadata: Metadata = {
  title: "Lumi - AI Concept to 3D Model",
  description:
    "Describe an idea and Lumi turns it into a preview sketch and a 3D-printable model. Free to try, no account required.",
  alternates: {
    canonical: SITE_ROUTES.lumi,
  },
};

export default function LumiPage() {
  return <LumiClient />;
}
