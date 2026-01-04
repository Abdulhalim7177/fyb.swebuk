"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="cta-section" id="cta">
      <div className="cta-bg"></div>
      <div className="container">
        <div className="cta-content">
          <h2 className="animate-on-scroll">Ready to Start Your <span className="text-gradient">Journey</span>?</h2>
          <p className="animate-on-scroll delay-1">Join thousands of software engineering students already building their future with Swebuk.</p>
          <div className="animate-on-scroll delay-2">
            <Link href="/auth/sign-up" className="btn btn-primary">
              <span>Join the Community</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
