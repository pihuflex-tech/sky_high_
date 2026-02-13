
import React, { useRef, useEffect } from 'react';
import { GameStatus } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  multiplier: number;
  countdown: number;
  lastCrash: number | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'smoke' | 'fire' | 'debris';
}

const GameCanvas: React.FC<GameCanvasProps> = ({ status, multiplier, lastCrash }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  const starsRef = useRef<{ x: number, y: number, speed: number, size: number }[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const crashTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize stars
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        speed: 0.1 + Math.random() * 0.5,
        size: Math.random() * 2
      });
    }
    starsRef.current = stars;
  }, []);

  // Reset particles on state change
  useEffect(() => {
    if (status === GameStatus.WAITING) {
      particlesRef.current = [];
      crashTimeRef.current = null;
    }
    if (status === GameStatus.CRASHED) {
      crashTimeRef.current = Date.now();
      // Generate initial debris
      for (let i = 0; i < 20; i++) {
        particlesRef.current.push({
          x: 0, y: 0, // Set in draw loop relative to crash pos
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          life: 1,
          maxLife: 1 + Math.random() * 2,
          color: Math.random() > 0.5 ? '#f43f5e' : '#fbbf24',
          size: 2 + Math.random() * 4,
          type: 'debris'
        });
      }
    }
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      
      ctx.clearRect(0, 0, w, h);

      // Background Starfield
      const bgSpeed = (status === GameStatus.FLYING) ? Math.min(multiplier * 0.5, 20) : 0.2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      starsRef.current.forEach(star => {
        star.x -= star.speed * bgSpeed;
        star.y += star.speed * bgSpeed * 0.2;
        
        if (star.x < 0) star.x = w;
        if (star.y > h) star.y = 0;
        
        ctx.beginPath();
        ctx.arc(star.x % w, star.y % h, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Grid with perspective feel
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 100;
      const xOffset = (multiplier * -20) % gridSize;
      const yOffset = (multiplier * 15) % gridSize;
      
      for (let x = xOffset; x <= w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = yOffset; y <= h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const padding = 80;
      const graphW = w - padding * 2;
      const graphH = h - padding * 2;

      // Runway for takeoff phase (multiplier < 1.05)
      if (status === GameStatus.FLYING || status === GameStatus.WAITING) {
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        ctx.moveTo(padding, h - padding + 5);
        ctx.lineTo(padding + 200, h - padding + 5);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (status === GameStatus.FLYING || status === GameStatus.CRASHED) {
        // Dynamic camera tracking simulation
        const displayScaleX = Math.max(5, multiplier * 1.2);
        const displayScaleY = Math.max(4, Math.pow(multiplier, 0.8) * 2);

        const getCoords = (m: number) => {
          const x = padding + (graphW * (Math.log10(m + 4) - 0.6) / (Math.log10(displayScaleX + 4) - 0.6));
          const y = (h - padding) - (graphH * Math.pow((m - 1) / (displayScaleY - 0.5), 0.9));
          return { x, y };
        };

        const currentPos = getCoords(multiplier);

        // Gradient Fill Under Curve
        const grad = ctx.createLinearGradient(0, currentPos.y, 0, h - padding);
        grad.addColorStop(0, status === GameStatus.CRASHED ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.15)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        
        ctx.beginPath();
        ctx.moveTo(padding, h - padding);
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const m = 1 + (multiplier - 1) * t;
          const p = getCoords(m);
          ctx.lineTo(p.x, p.y);
        }
        ctx.lineTo(currentPos.x, h - padding);
        ctx.fillStyle = grad;
        ctx.fill();

        // Vapor Trail (Contrail)
        if (status === GameStatus.FLYING) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.moveTo(padding, h - padding);
          for (let i = 0; i <= steps; i += 2) {
            const t = i / steps;
            const m = 1 + (multiplier - 1) * t;
            const p = getCoords(m);
            ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Main Flight Path
        ctx.beginPath();
        ctx.strokeStyle = status === GameStatus.CRASHED ? '#f43f5e' : '#10b981';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = status === GameStatus.CRASHED ? 'rgba(244, 63, 94, 0.5)' : 'rgba(16, 185, 129, 0.5)';
        
        ctx.moveTo(padding, h - padding);
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const m = 1 + (multiplier - 1) * t;
          const p = getCoords(m);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Plane Animation Logic
        if (status === GameStatus.FLYING) {
          // Physics: Turbulence & Altitude Scaling
          const altitude = multiplier - 1;
          const scale = Math.max(0.4, 1 - (altitude * 0.05));
          const turbulence = multiplier > 5 ? (Math.sin(Date.now() / 150) * 2) : 0;
          const wobble = Math.sin(Date.now() / 100) * 1.5;

          ctx.save();
          ctx.translate(currentPos.x, currentPos.y + turbulence);
          
          // Slope calculation for nose tilt
          const pPrev = getCoords(Math.max(1, multiplier - 0.05));
          const angle = Math.atan2(currentPos.y - pPrev.y, currentPos.x - pPrev.x);
          
          // Banking simulation (tilting as we turn/climb)
          const banking = Math.sin(Date.now() / 500) * 0.1;
          ctx.rotate(angle + banking);
          ctx.scale(scale, scale);

          // Dynamic Shadow
          ctx.save();
          const shadowOffset = 15 + (altitude * 5);
          ctx.translate(5, shadowOffset);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath();
          ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Engine Thruster Exhaust (Motion Blur)
          const thrustIntensity = 0.8 + Math.random() * 0.4 + (multiplier * 0.05);
          const exhaustGrad = ctx.createLinearGradient(-30 * thrustIntensity, 0, 0, 0);
          exhaustGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
          exhaustGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.6)');
          exhaustGrad.addColorStop(1, 'rgba(255, 255, 255, 1)');
          
          ctx.fillStyle = exhaustGrad;
          ctx.beginPath();
          ctx.moveTo(0, -2);
          ctx.lineTo(-30 * thrustIntensity, -6 + Math.random() * 4);
          ctx.lineTo(-30 * thrustIntensity, 6 + Math.random() * 4);
          ctx.lineTo(0, 2);
          ctx.fill();

          // Plane Body (Sleek Jet Shape)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(25, 0); // nose
          ctx.bezierCurveTo(20, -10, -5, -12, -15, -10); // top hull
          ctx.lineTo(-10, -5); // back taper
          ctx.lineTo(-10, 5); // bottom taper
          ctx.bezierCurveTo(-5, 12, 20, 10, 25, 0); // bottom hull
          ctx.fill();

          // Wings
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-15, -18);
          ctx.lineTo(-8, -18);
          ctx.lineTo(8, 0);
          ctx.fill();

          // Tail
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(-8, 0);
          ctx.lineTo(-18, -12);
          ctx.lineTo(-14, 0);
          ctx.fill();

          // Reflection Shine
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(15, -5);
          ctx.lineTo(-5, -7);
          ctx.stroke();

          ctx.restore();
        }

        // Advanced Crash Sequence
        if (status === GameStatus.CRASHED && crashTimeRef.current) {
          const elapsed = (Date.now() - crashTimeRef.current) / 1000;
          ctx.save();
          ctx.translate(currentPos.x, currentPos.y);

          // Shockwave Expansion
          if (elapsed < 0.5) {
            const swRadius = elapsed * 300;
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - elapsed * 2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, swRadius, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Update and Draw Particles (Debris, Smoke, Fire)
          particlesRef.current.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // gravity for debris
            p.life -= 0.016;

            if (p.life > 0) {
              const alpha = p.life / p.maxLife;
              ctx.fillStyle = p.color;
              ctx.globalAlpha = alpha;
              
              if (p.type === 'debris') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(elapsed * 10);
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.restore();
              } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (2 - alpha), 0, Math.PI * 2);
                ctx.fill();
              }
            }
          });

          // Explosion Core
          const expRadius = Math.max(0, 40 * (1 - elapsed));
          if (expRadius > 0) {
            const grad = ctx.createRadialGradient(0,0,0,0,0, expRadius);
            grad.addColorStop(0, '#fff');
            grad.addColorStop(0.3, '#fbbf24');
            grad.addColorStop(1, 'rgba(244, 63, 94, 0)');
            ctx.fillStyle = grad;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(0, 0, expRadius * 2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Lingering Smoke
          if (elapsed < 2) {
            ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
            ctx.globalAlpha = 0.5 * (1 - elapsed/2);
            ctx.beginPath();
            ctx.arc(Math.sin(elapsed * 2) * 10, -elapsed * 50, 20 + elapsed * 30, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationRef.current!);
      window.removeEventListener('resize', resize);
    };
  }, [status, multiplier]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
};

export default GameCanvas;
