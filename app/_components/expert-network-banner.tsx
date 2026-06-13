import { TrackedLink } from "@/app/components/analytics/tracked-link";
import { SITE_ROUTES } from "@/app/lib/site";

export function ExpertNetworkBanner() {
  return (
    <div className="border-b border-border bg-accent/[0.03] px-[var(--app-chrome-gutter)] py-2.5 text-xs font-medium text-foreground/70">
      <p className="mx-auto w-full max-w-7xl text-center">
        <span>Are you a human expert?</span>{" "}
        <TrackedLink
          href={SITE_ROUTES.humanExpertsNetwork}
          analytics={{
            cta: "join_expert_network",
            destination: SITE_ROUTES.humanExpertsNetwork,
            location: "expert_network_banner",
          }}
          className="text-accent transition-colors hover:text-accent/80"
        >
          Join the Expert Network
        </TrackedLink>
      </p>
    </div>
  );
}
