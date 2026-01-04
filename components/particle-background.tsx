'use client';

import { useEffect } from 'react';

export function ParticleBackground() {
  useEffect(() => {
    // Ambient Background Orbs - matching the design mockup
    const createOrb = (className: string, width: number, height: number, color: string) => {
      const orb = document.createElement('div');
      orb.className = `ambient-orb ${className}`;
      orb.style.cssText = `
        width: ${width}px;
        height: ${height}px;
        background: ${color};
        border-radius: 50%;
        filter: blur(100px);
        opacity: 0.12;
        position: fixed;
        z-index: -1;
        pointer-events: none;
        animation: ambientFloat 60s ease-in-out infinite;
      `;
      return orb;
    };

    // Create ambient background container
    const ambientBg = document.createElement('div');
    ambientBg.className = 'ambient-bg';
    ambientBg.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
    `;

    // Create ambient orbs
    const orb1 = createOrb('ambient-orb-1', 500, 500, '#8b5cf6');
    orb1.style.cssText += `
      top: -100px;
      left: -100px;
      animation-delay: 0s;
    `;

    const orb2 = createOrb('ambient-orb-2', 400, 400, '#3b82f6');
    orb2.style.cssText += `
      bottom: -50px;
      right: -50px;
      animation-delay: -10s;
    `;

    const orb3 = createOrb('ambient-orb-3', 300, 300, '#06b6d4');
    orb3.style.cssText += `
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: -20s;
    `;

    ambientBg.appendChild(orb1);
    ambientBg.appendChild(orb2);
    ambientBg.appendChild(orb3);
    document.body.appendChild(ambientBg);

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ambientFloat {
        0%, 100% {
          transform: translate(0, 0) scale(1);
        }
        25% {
          transform: translate(50px, 50px) scale(1.1);
        }
        50% {
          transform: translate(-30px, 30px) scale(0.95);
        }
        75% {
          transform: translate(-50px, -30px) scale(1.05);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      ambientBg.remove();
      style.remove();
    };
  }, []);

  return null;
}
