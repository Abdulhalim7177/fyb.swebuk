"use client";

import {
  Users,
  Code,
  Calendar,
  MessageSquare,
  BookOpen,
  Trophy,
} from 'lucide-react';

export function FeaturesSection() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <h2 className="animate-on-scroll">Everything You Need to <span className="text-gradient">Excel</span></h2>
          <p className="animate-on-scroll delay-1">Powerful features designed to help software engineering students collaborate, learn, and grow together.</p>
        </div>
        
        <div className="bento-grid features-grid">
          {/* Large feature card (spans 2 columns, 2 rows) */}
          <div className="glass-card feature-card feature-card-large bento-item animate-on-scroll delay-1">
            <div className="feature-icon">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h4>Tech Clusters</h4>
            <p>Join specialized clubs focused on web, mobile, AI, data science, and more. Connect with like-minded peers.</p>
          </div>

          {/* Medium feature card */}
          <div className="glass-card feature-card feature-card-medium bento-item animate-on-scroll delay-2">
            <div className="feature-icon">
              <Code className="w-8 h-8 text-white" />
            </div>
            <h4>Project Collaboration</h4>
            <p>Create or join real-world projects. Work in teams, manage tasks, and build portfolio-worthy applications.</p>
          </div>

          {/* Small feature card */}
          <div className="glass-card feature-card feature-card-small bento-item animate-on-scroll delay-3">
            <div className="feature-icon">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h4>Events & Workshops</h4>
            <p>Register for hackathons, tech talks, and workshops.</p>
          </div>

          {/* Medium feature card */}
          <div className="glass-card feature-card feature-card-medium bento-item animate-on-scroll delay-4">
            <div className="feature-icon">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h4>Real-time Chat</h4>
            <p>Dedicated chatrooms for every cluster and project.</p>
          </div>

          {/* Wide feature card */}
          <div className="glass-card feature-card feature-card-wide bento-item animate-on-scroll delay-5">
            <div className="feature-icon">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h4>Tech Blog</h4>
            <p>Read and write articles on the latest tech trends. Share knowledge and engage with the community.</p>
          </div>

          {/* Medium feature card */}
          <div className="glass-card feature-card feature-card-medium bento-item animate-on-scroll delay-6">
            <div className="feature-icon">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h4>FYP Management</h4>
            <p>Level 400 students get dedicated tools for Final Year Project submission, tracking, and supervisor feedback.</p>
          </div>
        </div>
      </div>
    </section>
  );
}