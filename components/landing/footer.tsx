import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Code2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-slate-900 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SWEBUK</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Building next generation of software engineers through collaboration, innovation, and community-driven learning.
            </p>
            <div className="flex space-x-4">
              <ThemeToggle />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/auth/sign-up" className="text-gray-400 hover:text-white transition-colors">Get Started</Link></li>
              <li><Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-400">Clusters</span></li>
              <li><span className="text-gray-400">Projects</span></li>
              <li><span className="text-gray-400">Events</span></li>
              <li><span className="text-gray-400">FYP Portal</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 SWEBUK. Software Engineering Student Community. Built with ❤️ for students, by students.
          </p>
        </div>
      </div>
    </footer>
  );
}