"use client";

import { useEffect } from "react";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  useEffect(() => {
    // Scroll Animations (from script.js)
    const initScrollAnimations = () => {
      const animatedElements = document.querySelectorAll('.animate-on-scroll');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      animatedElements.forEach(el => observer.observe(el));

      // Immediately show elements visible on page load
      setTimeout(() => {
        animatedElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('visible');
          }
        });
      }, 100);
    };

    // Parallax Effects (from script.js)
    const initParallaxEffects = () => {
      const parallaxElements = document.querySelectorAll('.hero-orb') as NodeListOf<HTMLElement>;
      if (!parallaxElements.length) return;

      let ticking = false;

      const updateParallax = () => {
        const scrollY = window.pageYOffset;
        parallaxElements.forEach((orb, index) => {
          const speed = 0.05 + (index * 0.02);
          const yPos = scrollY * speed;
          orb.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
        ticking = false;
      };

      const onScroll = () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    };

    // Initialize animations
    initScrollAnimations();
    const cleanupParallax = initParallaxEffects();

    // Depth-based Hover Effects (from script.js)
    const initDepthHoverEffects = () => {
      const cards = document.querySelectorAll('.glass-card, .feature-card') as NodeListOf<HTMLElement>;

      const handleCardHover = (event: MouseEvent) => {
        const card = event.currentTarget as HTMLElement;
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        card.style.transition = 'transform 0.1s ease-out';
      };

      const handleCardLeave = (event: MouseEvent) => {
        const card = event.currentTarget as HTMLElement;
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        card.style.transition = 'transform 0.3s ease-out';
      };

      cards.forEach(card => {
        card.addEventListener('mousemove', handleCardHover as any);
        card.addEventListener('mouseleave', handleCardLeave as any);
      });

      return () => {
        cards.forEach(card => {
          card.removeEventListener('mousemove', handleCardHover as any);
          card.removeEventListener('mouseleave', handleCardLeave as any);
        });
      };
    };

    const cleanupHover = initDepthHoverEffects();

    // Animated Stat Counters (from script.js)
    const initStatCounters = () => {
      const statNumbers = document.querySelectorAll('.stat-number');
      if (!statNumbers.length) return;

      const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
      };

      const animateCounter = (element: Element, targetValue: number, hasPlus: boolean) => {
        const duration = 1500;
        const frameDuration = 16;
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;

        const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

        const counter = setInterval(() => {
          frame++;
          const progress = Math.min(frame / totalFrames, 1);
          const easedProgress = easeOutQuart(progress);
          const currentValue = Math.round(targetValue * easedProgress);

          element.textContent = currentValue + (hasPlus ? '+' : '');

          if (frame === totalFrames) {
            clearInterval(counter);
            element.textContent = targetValue + (hasPlus ? '+' : '');
          }
        }, frameDuration);
      };

      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const counter = entry.target;
            const targetText = counter.textContent || '';
            const hasPlus = targetText.includes('+');
            const targetValue = parseInt(targetText.replace(/\D/g, ''));

            animateCounter(counter, targetValue, hasPlus);
            counterObserver.unobserve(counter);
          }
        });
      }, observerOptions);

      statNumbers.forEach(stat => counterObserver.observe(stat));
    };

    initStatCounters();

    // Ripple Effects (from script.js)
    const initRippleEffects = () => {
      const buttons = document.querySelectorAll('.btn');
      buttons.forEach(button => {
        button.addEventListener('click', createRipple);
      });
    };

    const createRipple = (event: MouseEvent) => {
      const button = event.currentTarget as HTMLElement;

      // Check if button already has ripple disabled
      if (button.classList.contains('no-ripple')) return;

      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';

      button.appendChild(ripple);

      // Remove ripple after animation
      setTimeout(() => {
        ripple.remove();
      }, 600);
    };

    initRippleEffects();

    // Scroll Progress Indicator (from script.js)
    const initScrollProgress = () => {
      // Create progress bar element
      const progressBar = document.createElement('div');
      progressBar.className = 'scroll-progress-bar';
      document.body.appendChild(progressBar);

      const updateProgress = () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        progressBar.style.width = scrollPercent + '%';
      };

      // Use requestAnimationFrame for smooth updates
      let ticking = false;

      window.addEventListener('scroll', () => {
        updateProgress();

        if (!ticking) {
          requestAnimationFrame(() => {
            updateProgress();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      // Initial update
      updateProgress();

      // Return cleanup function
      return () => {
        progressBar.remove();
      };
    };

    const cleanupScrollProgress = initScrollProgress();

    return () => {
      if (cleanupParallax) cleanupParallax();
      if (cleanupHover) cleanupHover();
      if (cleanupScrollProgress) cleanupScrollProgress();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1"></div>
        <div className="ambient-orb ambient-orb-2"></div>
        <div className="ambient-orb ambient-orb-3"></div>
      </div>

      <Navigation />

      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
