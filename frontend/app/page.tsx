import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { MlmPlayground } from "@/components/mlm-playground";
import { Classification } from "@/components/classification";
import { Features } from "@/components/features";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="relative">
        <Hero />
        <MlmPlayground />
        <Classification />
        <Features />
      </main>
      <SiteFooter />
    </>
  );
}
