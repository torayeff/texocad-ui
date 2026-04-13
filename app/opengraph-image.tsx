import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION, SITE_NAME } from "@/app/lib/site";
import { SocialImage } from "@/app/lib/social-image";

export const alt = `${SITE_NAME} social preview`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <SocialImage
        eyebrow="Agentic text-to-CAD"
        title="Turn ideas and sketches into editable CAD"
        description={SITE_DESCRIPTION}
        topics={["Natural language", "Editable CAD", "STEP and STL"]}
      />
    ),
    size,
  );
}
