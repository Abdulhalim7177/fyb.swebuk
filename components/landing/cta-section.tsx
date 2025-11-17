"use client";

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Rocket, Users, Sparkles } from 'lucide-react';

export function CtaSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
      >
        <motion.div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" animate={{ y: [-10, 10], transition: { duration: 5, repeat: Infinity, repeatType: "reverse" } }} />
        <motion.div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl" animate={{ y: [10, -10], transition: { duration: 8, repeat: Infinity, repeatType: "reverse" } }} />
        <motion.div className="absolute bottom-10 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-xl" animate={{ y: [-15, 15], transition: { duration: 6, repeat: Infinity, repeatType: "reverse" } }} />
        <motion.div className="absolute bottom-20 right-1/3 w-16 h-16 bg-white/5 rounded-full blur-lg" animate={{ y: [15, -15], transition: { duration: 7, repeat: Infinity, repeatType: "reverse" } }} />
      </motion.div>

      <motion.div
        ref={ref}
        className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {/* Icon */}
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6"
          whileHover={{ scale: 1.1, rotate: 10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Rocket className="w-10 h-10 text-white" />
        </motion.div>

        {/* Main heading */}
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to Launch Your
          <span className="block text-yellow-300">Tech Journey?</span>
        </h2>

        {/* Description */}
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          Join hundreds of software engineering students who are already building, collaborating,
          and innovating in our vibrant tech ecosystem.
        </p>

        {/* Features highlight */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          <div className="flex items-center text-white/80">
            <Sparkles className="w-5 h-5 mr-2 text-yellow-300" />
            <span>No Experience Required</span>
          </div>
          <div className="flex items-center text-white/80">
            <Users className="w-5 h-5 mr-2 text-yellow-300" />
            <span>Join 500+ Students</span>
          </div>
          <div className="flex items-center text-white/80">
            <Rocket className="w-5 h-5 mr-2 text-yellow-300" />
            <span>Start Building Today</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <motion.div variants={pulseVariants} animate="pulse">
            <Button
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold group shadow-2xl hover:shadow-white/25 transition-all"
              asChild
            >
              <Link href="/auth/sign-up">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          <Button
            variant="outline"
            size="lg"
            className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
            asChild
          >
            <Link href="/auth/login">
              Sign In
            </Link>
          </Button>
        </div>

        {/* Additional info */}
        <p className="text-white/70 text-sm mt-6">
          Free forever for students • No credit card required • Instant access
        </p>
      </motion.div>
    </section>
  );
}