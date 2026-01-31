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
    <section className="hero relative overflow-hidden min-h-screen flex items-center" id="hero">
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('/fci.jpg')` 
          }}
        />
        <div className="absolute inset-0 bg-black/40 z-0" />
      </div>
      
      <div className="container relative z-10">
        <div className="hero-content">
          <div className="hero-badge animate-on-scroll !text-white border-white/30 bg-white/20 shadow-lg">
            <span className="hero-badge-dot"></span>
            <span className="font-semibold">Now open for all levels</span>
          </div>

          <h1 className="animate-on-scroll delay-1 !text-white">
            Empowering the Future of<br />
            <span className="text-gradient">Software Innovation.</span>
          </h1>

          <p className="hero-subtitle animate-on-scroll delay-2 !text-white font-medium drop-shadow-sm">
            Department of Software Engineering, Bayero University Kano.
            Nurturing the next generation of software engineering leaders from study to mastery.
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

          <div className="mt-12 grid grid-cols-3 gap-2 md:flex md:justify-center md:gap-8" ref={statsRef}>
            <div className="stat-item aspect-square flex flex-col justify-center items-center p-1 md:p-2">
              <div className="stat-number text-2xl md:text-3xl">500+</div>
              <div className="stat-label text-xs md:text-xs">Active Students</div>
            </div>
            <div className="stat-item aspect-square flex flex-col justify-center items-center p-1 md:p-2">
              <div className="stat-number text-2xl md:text-3xl">20+</div>
              <div className="stat-label text-xs md:text-xs">Tech Clusters</div>
            </div>
            <div className="stat-item aspect-square flex flex-col justify-center items-center p-1 md:p-2">
              <div className="stat-number text-2xl md:text-3xl">100+</div>
              <div className="stat-label text-xs md:text-xs">Projects Built</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}