'use client';

import { useEffect, useRef } from 'react';

type MatrixBackgroundProps = {
  enabled: boolean;
  accentRgb: string;
  backgroundHex: string;
};

export default function MatrixBackground({ enabled, accentRgb, backgroundHex }: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const startTime = Date.now();

    const animate = () => {
      const t = (Date.now() - startTime) / 1000; // Time in seconds
      ctx.fillStyle = 'rgba(11, 11, 11, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scale factors for x and y to create a denser effect
      const scaleX = canvas.width / 100; // More points horizontally
      const scaleY = canvas.height / 100; // More points vertically

      for (let x = 0; x < canvas.width; x += scaleX) {
        for (let y = 0; y < canvas.height; y += scaleY) {
          const normalizedX = x / canvas.width;
          const normalizedY = y / canvas.height;
          
          // Using the provided formula with adjusted parameters
          const intensity = (1 - (Math.sin(normalizedX * 7) - (normalizedY / 15) + (t * 0.5 + 2)) % 1) / 3;
          
          if (intensity > 0.05) { // Lower threshold for more visible points
            const alpha = intensity * 0.11; // Apply 11% opacity to the points
            ctx.fillStyle = `rgba(${accentRgb}, ${alpha})`;
            ctx.fillRect(x, y, 3, 3); // Slightly larger points
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [accentRgb, enabled]);

  return (
    <div className="fixed inset-0 -z-10">
      {enabled ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{
            background: backgroundHex
          }}
        />
      ) : (
        <div className="h-full w-full" style={{ background: backgroundHex }} />
      )}
    </div>
  );
}