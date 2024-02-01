'use client';

import { useCanvasPanning } from '@/hooks/use-canvas-panning';
import { useMoveItem } from '@/hooks/use-move-item';
import { useEffect, useRef, useState } from 'react';

const items = [
  { x: 100, y: 100, width: 100, height: 100, colour: `#${Math.floor(Math.random() * 16777215).toString(16)}`, zIndex: 0 },
  { x: 200, y: 200, width: 100, height: 100, colour: `#${Math.floor(Math.random() * 16777215).toString(16)}`, zIndex: 0 },
  { x: 300, y: 300, width: 100, height: 100, colour: `#${Math.floor(Math.random() * 16777215).toString(16)}`, zIndex: 0 },
  { x: 400, y: 400, width: 100, height: 100, colour: `#${Math.floor(Math.random() * 16777215).toString(16)}`, zIndex: 0 },
  { x: 500, y: 500, width: 100, height: 100, colour: `#${Math.floor(Math.random() * 16777215).toString(16)}`, zIndex: 0 },
  { x: 600, y: 600, width: 100, height: 100, colour: `#${Math.floor(Math.random() * 16777215).toString(16)}`, zIndex: 0 },
  { x: 700, y: 700, width: 100, height: 100, colour: `#${Math.floor(Math.random() * 16777215).toString(16)}`, zIndex: 0 },
];

type Position = {
  x: number;
  y: number;
};

const draw = (ctx: CanvasRenderingContext2D, scale: number, translatePos: Position) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas

  ctx.save(); // Save the current context state
  ctx.translate(translatePos.x, translatePos.y); // Translate the canvas based on panning
  ctx.scale(scale, scale); // Apply zoom scaling

  for (const item of items) {
    ctx.fillStyle = item.colour;
    ctx.fillRect(item.x, item.y, item.width, item.height);
  }

  ctx.restore(); // Restore the context state to what it was before scaling and translating
};

export const ShowcaseStudio = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestAnimationFrameRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1); // For zoom level
  const { translatePos } = useCanvasPanning(canvasRef);

  // Move the item that is being dragged
  useMoveItem(canvasRef, items, translatePos, scale);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Start the animation loop
    const animate = () => {
      draw(ctx, scale, translatePos);
      requestAnimationFrameRef.current = requestAnimationFrame(animate);
    };

    requestAnimationFrameRef.current = requestAnimationFrame(animate);
  }, [scale, translatePos]);

  // Resize the canvas when the window resizes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // On window resize adjust the canvas size
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }, []);

  // Don't render canvas on the server
  if (typeof window === 'undefined') return null;

  // Render canvas on the client
  return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />;
};
