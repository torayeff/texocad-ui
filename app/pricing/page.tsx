import { PricingTable } from "@clerk/nextjs";

import { Header } from "@/app/components/Header";

export default function PricingPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />
      <div className="flex flex-1 flex-col items-center px-4 py-16">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="mb-10 max-w-md text-center text-muted-foreground">
          Subscribe to unlock TexoCAD Studio and start building.
        </p>
        <div className="w-full max-w-3xl">
          <PricingTable />
        </div>
      </div>
    </main>
  );
}
