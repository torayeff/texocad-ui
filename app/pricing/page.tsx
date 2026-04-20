import { PricingTable } from "@clerk/nextjs";

import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";

export default function PricingPage() {
  return (
    <main className="flex h-dvh flex-col bg-background text-foreground overflow-hidden">
      <Header />
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col items-center justify-center min-h-full p-6 md:p-8">
          <div className="w-full max-w-md flex flex-col items-center">
            <h1 className="mb-2 text-3xl font-semibold tracking-tight">Pricing</h1>
            <p className="mb-6 max-w-md text-center text-muted-foreground">
              Subscribe to unlock TexoCAD Studio and start building.
            </p>
            <div className="mb-8 inline-flex items-center rounded-full bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent ring-1 ring-accent/20">
              ✨ 30-Day Free Trial
            </div>
            <div className="w-full">
              <PricingTable />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
