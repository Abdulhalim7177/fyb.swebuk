"use client";

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Clock, User, ArrowRight, MessageCircle } from 'lucide-react';

// Mock blog data
const blogPosts = [
  {
    id: 1,
    title: "Getting Started with React 18 and Concurrent Features",
    excerpt: "Explore the new features in React 18 including concurrent rendering, automatic batching, and transitions that improve user experience.",
    author: "Sarah Johnson",
    role: "Level 300 Student",
    date: "2 days ago",
    readTime: "5 min read",
    category: "Frontend",
    image: "/api/placeholder/400/250",
    comments: 12,
    likes: 45,
    featured: true
  },
  {
    id: 2,
    title: "Building Scalable APIs with Node.js and TypeScript",
    excerpt: "Learn how to create robust and scalable backend APIs using Node.js, TypeScript, and best practices for enterprise applications.",
    author: "Michael Chen",
    role: "Staff Member",
    date: "1 week ago",
    readTime: "8 min read",
    category: "Backend",
    image: "/api/placeholder/400/250",
    comments: 8,
    likes: 32,
    featured: false
  },
  {
    id: 3,
    title: "Machine Learning in Python: A Beginner's Guide",
    excerpt: "Introduction to machine learning concepts using Python, scikit-learn, and TensorFlow for students new to AI/ML.",
    author: "Emily Davis",
    role: "Level 400 Student",
    date: "3 days ago",
    readTime: "6 min read",
    category: "AI/ML",
    image: "/api/placeholder/400/250",
    comments: 15,
    likes: 67,
    featured: true
  },
  {
    id: 4,
    title: "DevOps Best Practices for Student Projects",
    excerpt: "Essential DevOps practices every software engineering student should know for successful project deployment.",
    author: "David Kim",
    role: "Cluster Lead",
    date: "5 days ago",
    readTime: "4 min read",
    category: "DevOps",
    image: "/api/placeholder/400/250",
    comments: 6,
    likes: 28,
    featured: false
  },
  {
    id: 5,
    title: "Web3 and Blockchain: The Future of Development",
    excerpt: "Understanding blockchain technology, smart contracts, and Web3 development opportunities for software engineers.",
    author: "Alex Thompson",
    role: "Level 200 Student",
    date: "1 week ago",
    readTime: "7 min read",
    category: "Blockchain",
    image: "/api/placeholder/400/250",
    comments: 20,
    likes: 89,
    featured: false
  },
  {
    id: 6,
    title: "Mobile Development with Flutter: Complete Guide",
    excerpt: "Build beautiful, natively compiled applications for mobile, web, and desktop from a single codebase using Flutter.",
    author: "Lisa Wang",
    role: "Level 300 Student",
    date: "4 days ago",
    readTime: "10 min read",
    category: "Mobile",
    image: "/api/placeholder/400/250",
    comments: 18,
    likes: 76,
    featured: true
  }
];

const categories = ["All", "Frontend", "Backend", "AI/ML", "DevOps", "Blockchain", "Mobile"];

export function BlogSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = selectedCategory === "All"
    ? blogPosts
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPosts = blogPosts.filter(post => post.featured);

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
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-indigo-400 mr-3" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Community Blog
            </h2>
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Insights, tutorials, and experiences shared by our community of software engineering students and staff.
          </p>
        </motion.div>

        {/* Featured Posts */}
        <motion.div
          className="mb-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <h3 className="text-2xl font-bold text-white mb-6">Featured Posts</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredPosts.slice(0, 3).map((post, index) => (
              <motion.div key={post.id} variants={itemVariants}>
                <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border-white/20 hover:from-white/15 hover:to-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/10 group">
                  <CardContent className="p-0">
                    {/* Image placeholder */}
                    <div className="h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-t-lg flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-indigo-400/50" />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                          {post.category}
                        </Badge>
                        <span className="text-sm text-gray-500">{post.readTime}</span>
                      </div>

                      <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                        {post.title}
                      </h4>

                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                          <span className="text-gray-400">{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-500">
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {post.comments}
                          </span>
                          <span>{post.date}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`${
                selectedCategory === category
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* All Posts Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {filteredPosts.map((post, index) => (
            <motion.div key={post.id} variants={itemVariants}>
              <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border-white/20 hover:from-white/15 hover:to-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/10 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-gray-500">{post.readTime}</span>
                  </div>

                  <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    <Link href={`/blog/${post.id}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h4>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-500">
                      <span className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        {post.comments}
                      </span>
                      <Clock className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 group">
            View All Articles
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}