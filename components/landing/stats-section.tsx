"use client";

import { motion, useInView, useAnimation } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Users, Code, Calendar, BookOpen, TrendingUp, Award } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: 500,
    label: "Active Students",
    description: "From all academic levels",
    gradient: "from-blue-500 to-cyan-500",
    suffix: "+"
  },
  {
    icon: Code,
    value: 50,
    label: "Live Projects",
    description: "Collaborative development",
    gradient: "from-purple-500 to-pink-500",
    suffix: "+"
  },
  {
    icon: Calendar,
    value: 20,
    label: "Monthly Events",
    description: "Workshops & meetups",
    gradient: "from-orange-500 to-red-500",
    suffix: "+"
  },
  {
    icon: BookOpen,
    value: 100,
    label: "Blog Articles",
    description: "Student & staff contributions",
    gradient: "from-green-500 to-teal-500",
    suffix: "+"
  },
  {
    icon: TrendingUp,
    value: 95,
    label: "Success Rate",
    description: "FYP completion rate",
    gradient: "from-indigo-500 to-blue-500",
    suffix: "%"
  },
  {
    icon: Award,
    value: 15,
    label: "Tech Clusters",
    description: "Specialized communities",
    gradient: "from-yellow-500 to-orange-500",
    suffix: "+"
  }
];

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });


  useEffect(() => {
    if (isInView && ref.current) {
      ref.current.textContent = `${Math.round(value)}${suffix}`;
    }
  }, [isInView, value, suffix]);

  return <span ref={ref}>{`0${suffix}`}</span>;
}

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="py-20 relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Impact in Numbers
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Our growing community is making a real difference in software engineering education.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              variants={itemVariants}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.gradient} mb-4`}>
                <stat.icon className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {stat.label}
                </h3>
                <p className="text-gray-400 text-sm">
                  {stat.description}
                </p>
              </div>

              {/* Progress bar animation */}
              <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: "100%" } : {}}
                  transition={{ duration: 1.5, delay: index * 0.2 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional impact statement */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all duration-300">
            <h3 className="text-2xl font-bold text-white mb-4">
              Building the Future of Tech Education
            </h3>
            <p className="text-gray-300 max-w-3xl mx-auto text-lg leading-relaxed">
              SWEBUK is more than just a platform—it's a movement to transform software engineering education through
              collaboration, innovation, and community-driven learning. Join us in shaping the next generation of tech leaders.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}