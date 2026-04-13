import { SITE_NAME } from "@/app/lib/site";

interface SocialImageProps {
  eyebrow: string;
  title: string;
  description: string;
  topics: string[];
}

export function SocialImage({
  eyebrow,
  title,
  description,
  topics,
}: SocialImageProps) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        background:
          "linear-gradient(135deg, #0f172a 0%, #111827 55%, #1f2937 100%)",
        color: "#f8fafc",
        padding: "56px 64px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            height: "72px",
            width: "72px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "20px",
            background: "#f8fafc",
            color: "#0f172a",
            fontSize: "32px",
            fontWeight: 700,
          }}
        >
          T
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              opacity: 0.72,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            {SITE_NAME}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            maxWidth: "900px",
            fontSize: "64px",
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: "920px",
            fontSize: "28px",
            lineHeight: 1.4,
            color: "#cbd5e1",
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {topics.map((topic) => (
          <div
            key={topic}
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: "999px",
              border: "1px solid rgba(248, 250, 252, 0.18)",
              background: "rgba(248, 250, 252, 0.08)",
              padding: "12px 20px",
              fontSize: "22px",
              color: "#e2e8f0",
            }}
          >
            {topic}
          </div>
        ))}
      </div>
    </div>
  );
}
