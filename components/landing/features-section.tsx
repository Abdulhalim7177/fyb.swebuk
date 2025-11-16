"use client";

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Code,
  Calendar,
  BookOpen,
  MessageSquare,
  Trophy,
  Target,
  Zap,
  Shield,
  BarChart,
  FileText,
  Bell
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: "Smart Clusters",
    description: "Join specialized tech communities based on your interests and skill level",
    gradient: "from-blue-500 to-cyan-500",
    badge: "Popular"
  },
  {
    icon: Code,
    title: "Project Collaboration",
    description: "Work on real projects with peers, track progress, and build your portfolio",
    gradient: "from-purple-500 to-pink-500",
    badge: "Interactive"
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "Discover and register for tech events, workshops, and networking opportunities",
    gradient: "from-orange-500 to-red-500",
    badge: "New"
  },
  {
    icon: BookOpen,
    title: "Blog Platform",
    description: "Share knowledge, write technical articles, and learn from community posts",
    gradient: "from-green-500 to-teal-500",
    badge: "Content"
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Connect with cluster members through integrated chat rooms",
    gradient: "from-indigo-500 to-blue-500",
    badge: "Live"
  },
  {
    icon: Trophy,
    title: "FYP Management",
    description: "Complete your final year project with supervisor guidance and tracking",
    gradient: "from-yellow-500 to-orange-500",
    badge: "Level 400"
  },
  {
    icon: Target,
    title: "Role-based Access",
    description: "Tailored experience for students, leads, staff, and administrators",
    gradient: "from-pink-500 to-purple-500",
    badge: "Secure"
  },
  {
    icon: BarChart,
    title: "Analytics Dashboard",
    description: "Track your progress, project contributions, and skill development",
    gradient: "from-cyan-500 to-blue-500",
    badge: "Insights"
  },
  {
    icon: FileText,
    title: "Portfolio Builder",
    description: "Showcase your projects, achievements, and professional profile",
    gradient: "from-teal-500 to-green-500",
    badge: "Career"
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Stay updated with cluster activities, events, and project milestones",
    gradient: "from-red-500 to-pink-500",
    badge: "Alerts"
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Enterprise-grade security with role-based permissions and data protection",
    gradient: "from-slate-500 to-gray-500",
    badge: "Security"
  },
  {
    icon: Zap,
    title: "Performance Tracking",
    description: "Monitor academic progress, project completion, and skill development",
    gradient: "from-amber-500 to-yellow-500",
    badge: "Growth"
  }
];

export function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-slate-900" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to Excel
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            A comprehensive platform designed specifically for software engineering students to collaborate, learn, and grow together.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
            >
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl blur-xl"
                     style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }} />

                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:from-white/15 hover:to-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/10 group-hover:border-white/30">
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="text-xs bg-white/10 text-gray-300 border-white/20">
                      {feature.badge}
                    </Badge>
                  </div>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-white font-semibold mb-2 group-hover:text-white/90 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}