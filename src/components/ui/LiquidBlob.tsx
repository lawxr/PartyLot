'use client';

import React, { useEffect, useRef } from 'react';

interface LiquidBlobProps {
  balance: number;
  className?: string;
}

export const LiquidBlob: React.FC<LiquidBlobProps> = ({ balance, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const render = () => {
      t += 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = width * 0.34;

      ctx.clearRect(0, 0, width, height);

      // Create organic multi-harmonic blob path
      ctx.beginPath();
      const points = 60;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Harmonic deformers simulating visionOS liquid sphere
        const wave1 = Math.sin(angle * 3 + t * 1.5) * (width * 0.035);
        const wave2 = Math.cos(angle * 5 - t * 2.0) * (width * 0.02);
        const wave3 = Math.sin(angle * 2 + t * 0.8) * (width * 0.015);
        const r = baseRadius + wave1 + wave2 + wave3;

        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Outer Glow
      ctx.shadowColor = 'rgba(233, 255, 50, 0.35)';
      ctx.shadowBlur = 40;

      // Base Gradient: Deep liquid glass with acid lime & incandescent party hues
      const grad = ctx.createRadialGradient(
        centerX - baseRadius * 0.3,
        centerY - baseRadius * 0.3,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius * 1.2
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(0.25, 'rgba(233, 255, 50, 0.55)'); // Accent Lime
      grad.addColorStop(0.6, 'rgba(120, 60, 255, 0.25)'); // Ultraviolet party refraction
      grad.addColorStop(0.9, 'rgba(20, 20, 30, 0.85)');
      grad.addColorStop(1, 'rgba(5, 5, 10, 0.95)');

      ctx.fillStyle = grad;
      ctx.fill();

      // Specular highlight crest (glass reflection)
      ctx.shadowBlur = 0;
      ctx.save();
      ctx.clip();

      const highlightGrad = ctx.createLinearGradient(
        centerX - baseRadius,
        centerY - baseRadius,
        centerX + baseRadius,
        centerY
      );
      highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      highlightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = highlightGrad;
      ctx.beginPath();
      ctx.ellipse(
        centerX - baseRadius * 0.2,
        centerY - baseRadius * 0.35,
        baseRadius * 0.55,
        baseRadius * 0.25,
        -Math.PI / 6,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Rim light
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [balance]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        className="w-full max-w-[280px] sm:max-w-[320px] aspect-square pointer-events-none drop-shadow-2xl"
      />
    </div>
  );
};
