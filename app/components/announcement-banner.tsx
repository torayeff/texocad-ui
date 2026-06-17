export function AnnouncementBanner() {
  return (
    <aside
      aria-label="Scheduled maintenance announcement"
      className="sticky top-0 z-50 border-b border-amber-200/70 bg-amber-50 px-[var(--app-chrome-gutter)] py-2.5 text-center text-[13px] font-medium leading-5 text-amber-950 shadow-[0_1px_2px_rgb(0_0_0_/_0.04)] dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
    >
      <span className="font-semibold">Scheduled maintenance:</span> We will
      perform server updates on Friday at 00:00 UTC. Please download all your
      backups. The new server will not migrate old histories.
    </aside>
  );
}
