'use client';
import { useCanvasPanning } from '@/hooks/use-canvas-panning';
import { useMoveItem } from '@/hooks/use-move-item';
import { useResizeWindow } from '@/hooks/use-resize-window';
import { useRef, useState } from 'react';
import { items, draw } from './beta';

export const ShowcaseStudio = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1); // For zoom level
  const { translatePos } = useCanvasPanning(canvasRef);

  // Resize the canvas when the window resizes
  useResizeWindow(canvasRef, setScale);

  // Move the item that is being dragged
  useMoveItem(canvasRef, items, translatePos, scale);

  // Draw the canvas
  useDrawCanvas(canvasRef, scale, translatePos, draw);

  // Don't render canvas on the server
  if (typeof window === 'undefined') return null;

  // Render canvas on the client
  return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />;
};
