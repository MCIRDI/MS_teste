import { HomeCta } from "@/components/marketing/home-cta";
import { HomeFeatures } from "@/components/marketing/home-features";
import { HomeHero } from "@/components/marketing/home-hero";
import { HomeStats } from "@/components/marketing/home-stats";
import { HomeWorkflow } from "@/components/marketing/home-workflow";

export default function HomePage() {
  return (
    <main className="marketing-mesh relative overflow-hidden">
      <div className="marketing-grid pointer-events-none absolute inset-0" aria-hidden />
      <HomeHero />
      <HomeStats />
      <HomeFeatures />
      <HomeWorkflow />
      <HomeCta />
    </main>
  );
}
