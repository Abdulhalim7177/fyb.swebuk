"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export function HeroSection() {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Logic to animate numbers if needed, or rely on global script if I port it
    // For now, I'll rely on the global observer I'll add to page.tsx
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="hero-bg">
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-orb hero-orb-3"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge animate-on-scroll">
            <span className="hero-badge-dot"></span>
            <span>Now open for all levels</span>
          </div>

          <h1 className="animate-on-scroll delay-1">
            Connect. Collaborate.<br />
            <span className="text-gradient">Build Together.</span>
          </h1>

          <p className="hero-subtitle animate-on-scroll delay-2">
            Swebuk is the ultimate online tech community for software engineering students.
            Join clusters, work on real projects, and build your professional portfolio.
          </p>

          <div className="hero-ctas animate-on-scroll delay-3">
            <Link href="/auth/sign-up" className="btn btn-primary">
              <span>Join the Community</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <Link href="#features" className="btn btn-secondary">Learn More</Link>
          </div>

          <div className="hero-stats animate-on-scroll delay-4" ref={statsRef}>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Active Students</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">20+</div>
              <div className="stat-label">Tech Clusters</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">Projects Built</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}