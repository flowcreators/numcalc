"use client";

import { useEffect, useRef } from "react";

type MerkabahIcon3DProps = {
  spinKey: number;
  joltKey: number;
  className?: string;
};

type Point3D = {
  x: number;
  y: number;
  z: number;
};

type Segment3D = {
  start: Point3D;
  end: Point3D;
};

const TETRAHEDRON_A: Point3D[] = [
  { x: 1, y: 1, z: 1 },
  { x: -1, y: -1, z: 1 },
  { x: -1, y: 1, z: -1 },
  { x: 1, y: -1, z: -1 },
];

const TETRAHEDRON_B: Point3D[] = TETRAHEDRON_A.map((point) => ({
  x: -point.x,
  y: -point.y,
  z: -point.z,
}));

const TETRAHEDRON_EDGES: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 2],
  [1, 3],
  [2, 3],
];

const STAR_TETRAHEDRON_SEGMENTS: Segment3D[] = [
  ...TETRAHEDRON_EDGES.map(([startIndex, endIndex]) => ({
    start: TETRAHEDRON_A[startIndex],
    end: TETRAHEDRON_A[endIndex],
  })),
  ...TETRAHEDRON_EDGES.map(([startIndex, endIndex]) => ({
    start: TETRAHEDRON_B[startIndex],
    end: TETRAHEDRON_B[endIndex],
  })),
];

const rotateX = (point: Point3D, angle: number): Point3D => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  };
};

const rotateY = (point: Point3D, angle: number): Point3D => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  };
};

const rotateZ = (point: Point3D, angle: number): Point3D => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z,
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const FULL_ROTATION = Math.PI * 2;

export default function MerkabahIcon3D({ spinKey, joltKey, className = "h-6 w-6" }: MerkabahIcon3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const rotationRef = useRef({ x: 0.72, y: 0.58, z: 0.18 });
  const previousFrameTimeRef = useRef<number | null>(null);
  const clickSpinOffsetRef = useRef({ x: 0, y: 0, z: 0 });
  const typingOffsetRef = useRef({ x: 0, y: 0, z: 0 });
  const clickSpinRef = useRef<{
    startTime: number | null;
    duration: number;
    from: Point3D;
    to: Point3D;
  } | null>(null);
  const typingSpinRef = useRef<{
    startTime: number | null;
    duration: number;
    from: Point3D;
    to: Point3D;
  } | null>(null);

  useEffect(() => {
    clickSpinRef.current = {
      startTime: null,
      duration: 400,
      from: { ...clickSpinOffsetRef.current },
      to: {
        x: clickSpinOffsetRef.current.x + 0.42,
        y: clickSpinOffsetRef.current.y + Math.PI * 1.92,
        z: clickSpinOffsetRef.current.z + 0.2,
      },
    };
  }, [spinKey]);

  useEffect(() => {
    const rotationFraction = 0.15 + Math.random() * 0.65;
    const rotationDirection = Math.random() < 0.5 ? -1 : 1;

    typingSpinRef.current = {
      startTime: null,
      duration: 200,
      from: { ...typingOffsetRef.current },
      to: {
        x: toRadians((Math.random() - 0.5) * 22),
        y: typingOffsetRef.current.y + FULL_ROTATION * rotationFraction * rotationDirection,
        z: toRadians((Math.random() - 0.5) * 14),
      },
    };
  }, [joltKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const render = (timestamp: number) => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      const width = Math.max(bounds.width, 1);
      const height = Math.max(bounds.height, 1);

      if (canvas.width !== Math.round(width * pixelRatio) || canvas.height !== Math.round(height * pixelRatio)) {
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      const rotation = rotationRef.current;
      const previousFrameTime = previousFrameTimeRef.current ?? timestamp;
      const deltaMultiplier = Math.min((timestamp - previousFrameTime) / 16.6667, 2);
      previousFrameTimeRef.current = timestamp;

      rotation.x += 0.0026 * deltaMultiplier;
      rotation.y += 0.0061 * deltaMultiplier;
      rotation.z += 0.0017 * deltaMultiplier;

      const typingOffset = typingOffsetRef.current;
      const activeTypingSpin = typingSpinRef.current;

      if (activeTypingSpin) {
        if (activeTypingSpin.startTime === null) {
          activeTypingSpin.startTime = timestamp;
        }

        const rawProgress = Math.min((timestamp - activeTypingSpin.startTime) / activeTypingSpin.duration, 1);
        const easedProgress = 1 - Math.pow(1 - rawProgress, 4);

        typingOffset.x = activeTypingSpin.from.x + (activeTypingSpin.to.x - activeTypingSpin.from.x) * easedProgress;
        typingOffset.y = activeTypingSpin.from.y + (activeTypingSpin.to.y - activeTypingSpin.from.y) * easedProgress;
        typingOffset.z = activeTypingSpin.from.z + (activeTypingSpin.to.z - activeTypingSpin.from.z) * easedProgress;

        if (rawProgress === 1) {
          typingSpinRef.current = null;
        }
      }

      const activeSpin = clickSpinRef.current;

      if (activeSpin) {
        if (activeSpin.startTime === null) {
          activeSpin.startTime = timestamp;
        }

        const rawProgress = Math.min((timestamp - activeSpin.startTime) / activeSpin.duration, 1);
        const easedProgress = 1 - Math.pow(1 - rawProgress, 5);
        const nextOffset = {
          x: activeSpin.from.x + (activeSpin.to.x - activeSpin.from.x) * easedProgress,
          y: activeSpin.from.y + (activeSpin.to.y - activeSpin.from.y) * easedProgress,
          z: activeSpin.from.z + (activeSpin.to.z - activeSpin.from.z) * easedProgress,
        };

        rotation.x += nextOffset.x - clickSpinOffsetRef.current.x;
        rotation.y += nextOffset.y - clickSpinOffsetRef.current.y;
        rotation.z += nextOffset.z - clickSpinOffsetRef.current.z;
        clickSpinOffsetRef.current = nextOffset;

        if (rawProgress === 1) {
          clickSpinRef.current = null;
        }
      }

      const effectiveRotation = {
        x: rotation.x + typingOffset.x,
        y: rotation.y + typingOffset.y,
        z: rotation.z + typingOffset.z,
      };

      const projectedSegments = STAR_TETRAHEDRON_SEGMENTS.map((segment) => {
        const startRotated = rotateZ(rotateY(rotateX(segment.start, effectiveRotation.x), effectiveRotation.y), effectiveRotation.z);
        const endRotated = rotateZ(rotateY(rotateX(segment.end, effectiveRotation.x), effectiveRotation.y), effectiveRotation.z);
        const cameraDistance = 5.2;
        const startScale = cameraDistance / (cameraDistance - startRotated.z);
        const endScale = cameraDistance / (cameraDistance - endRotated.z);
        const scale = Math.min(width, height) * 0.22;

        return {
          start: {
            x: width / 2 + startRotated.x * startScale * scale,
            y: height / 2 + startRotated.y * startScale * scale,
          },
          end: {
            x: width / 2 + endRotated.x * endScale * scale,
            y: height / 2 + endRotated.y * endScale * scale,
          },
          avgDepth: (startRotated.z + endRotated.z) / 2,
        };
      }).sort((left, right) => left.avgDepth - right.avgDepth);

      for (const segment of projectedSegments) {
        const normalizedDepth = clamp((segment.avgDepth + 2.2) / 4.4, 0, 1);
        const strokeAlpha = 0.52 + normalizedDepth * 0.38;
        const lineWidth = 0.85 + normalizedDepth * 1.1;

        context.beginPath();
        context.strokeStyle = `rgba(255, 255, 255, ${strokeAlpha})`;
        context.lineWidth = lineWidth;
        context.moveTo(segment.start.x, segment.start.y);
        context.lineTo(segment.end.x, segment.end.y);
        context.stroke();
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameRef.current);
      previousFrameTimeRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}