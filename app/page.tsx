import { ParticleBackground } from "@/components/particle-background";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { BlogSection } from "@/components/landing/blog-section";
import { StatsSection } from "@/components/landing/stats-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white theme-transition">
      <ParticleBackground />
      <Navigation />

      <main>
        <HeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="blog">
          <BlogSection />
        </div>
        <div id="stats">
          <StatsSection />
        </div>
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
