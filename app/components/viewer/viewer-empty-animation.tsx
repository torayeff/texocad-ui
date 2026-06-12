import { HeroPointCloud } from "@/app/_components/hero-point-cloud";

export function ViewerEmptyAnimation() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-x-0 top-1/2 mx-auto w-[min(44rem,90vw)] -translate-y-1/2 opacity-70">
        <HeroPointCloud />
      </div>
    </div>
  );
}
