"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitter, Github, Linkedin, Disc as Discord, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

export function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link href="/" className="logo">
                <div className="logo-icon">
                  <Image
                    src="/buk-logo.png"
                    alt="Swebuk Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span>Swebuk</span>
              </Link>
              <p>The ultimate online tech community for software engineering students. Connect, collaborate, and build together.</p>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="Twitter">
                  <Twitter size={18} />
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  <Github size={18} />
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <Linkedin size={18} />
                </a>
                <a href="#" className="social-link" aria-label="Discord">
                  <Discord size={18} />
                </a>
              </div>
            </div>

            <div className="footer-column">
              <h5>Platform</h5>
              <ul>
                <li><Link href="#features">Features</Link></li>
                <li><Link href="#">Clusters</Link></li>
                <li><Link href="#">Projects</Link></li>
                <li><Link href="#">Events</Link></li>
                <li><Link href="/blog">Blog</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h5>Resources</h5>
              <ul>
                <li><Link href="#">Documentation</Link></li>
                <li><Link href="#">Help Center</Link></li>
                <li><Link href="#">Community Guidelines</Link></li>
                <li><Link href="#">API</Link></li>
              </ul>
            </div>

            <div className="footer-column">
              <h5>Company</h5>
              <ul>
                <li><Link href="#">About Us</Link></li>
                <li><Link href="#">Careers</Link></li>
                <li><Link href="#">Privacy Policy</Link></li>
                <li><Link href="#">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Swebuk. All rights reserved.</p>
            <p>Made with ❤️ for software engineering students</p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="back-to-top-btn"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
