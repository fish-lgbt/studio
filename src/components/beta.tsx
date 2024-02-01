'use client';

import { useCanvasPanning } from '@/hooks/use-canvas-panning';
import { useDrawCanvas } from '@/hooks/use-draw-canvas';
import { useMoveItem } from '@/hooks/use-move-item';
import { useResizeWindow } from '@/hooks/use-resize-window';
import { useRef, useState } from 'react';
import FPSStats from 'react-fps-stats';

const randomNumberBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const items = Array.from({ length: 1_000 }, (_, index) => ({
  id: index,
  x: 100 * index,
  y: 100 * index,
  width: randomNumberBetween(50, 200),
  height: randomNumberBetween(50, 200),
  colour: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  image:
    '/backgrounds/imlunahey_3d_wallpapers_of_water_splashes_in_the_ocean_in_the_b327bffc-94c7-4314-a669-c86bfab3a17a_0.png',
  zIndex: 0,
}));

type Position = {
  x: number;
  y: number;
};

const cachedImages = new Map<string, HTMLImageElement>();

const draw = (ctx: CanvasRenderingContext2D, scale: number, translatePos: Position) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas

  ctx.save(); // Save the current context state
  ctx.translate(translatePos.x, translatePos.y); // Translate the canvas based on panning
  ctx.scale(scale, scale); // Apply zoom scaling

  // Only draw items that are within the viewport
  const itemsWithinViewport = items.filter(
    (item) =>
      item.x + item.width >= -translatePos.x / scale &&
      item.x <= (-translatePos.x + ctx.canvas.width) / scale &&
      item.y + item.height >= -translatePos.y / scale &&
      item.y <= (-translatePos.y + ctx.canvas.height) / scale,
  );

  for (const item of itemsWithinViewport) {
    // Draw the background colour
    ctx.fillStyle = item.colour;
    ctx.fillRect(item.x, item.y, item.width, item.height);

    // Draw the image
    if (item.image) {
      if (!cachedImages.has(item.image)) {
        const image = new Image();
        image.src = item.image;
        cachedImages.set(item.image, image);
      }
      const image = cachedImages.get(item.image)!;
      ctx.drawImage(image, item.x, item.y, item.width, item.height);
    }

    // Draw the item's id
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(item.id.toString(), item.x + 10, item.y + 30);
  }

  ctx.restore(); // Restore the context state to what it was before scaling and translating
};

export const ShowcaseStudio = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
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
  return (
    <>
      <FPSStats />
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />
    </>
  );
};
