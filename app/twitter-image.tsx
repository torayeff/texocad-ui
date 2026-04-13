import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION, SITE_NAME } from "@/app/lib/site";
import { SocialImage } from "@/app/lib/social-image";

export const alt = `${SITE_NAME} social preview`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <SocialImage
        eyebrow="Physical product workflows"
        title="Text-to-CAD for rapid product iteration"
        description={SITE_DESCRIPTION}
        topics={["Sketch inputs", "Parametric output", "Manufacturing handoff"]}
      />
    ),
    size,
  );
}
