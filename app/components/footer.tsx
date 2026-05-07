import Link from "next/link";
import { SITE_NAME, SITE_ROUTES, SUPPORT_EMAIL } from "@/app/lib/site";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="shrink-0 border-t border-border bg-background px-6 py-4 md:px-8 text-sm">
      <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
        <div className="text-muted-foreground">
          &copy; {currentYear} {SITE_NAME}. All rights reserved.
        </div>
        <div className="flex items-center gap-6 font-medium text-muted-foreground">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground transition-colors">
            Support
          </a>
          <Link href={SITE_ROUTES.privacy} className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href={SITE_ROUTES.terms} className="hover:text-foreground transition-colors">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
