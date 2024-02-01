'use client';

import { useCanvasPanning } from '@/hooks/use-canvas-panning';
import { useDrawCanvas } from '@/hooks/use-draw-canvas';
import { useMoveItem } from '@/hooks/use-move-item';
import { useResizeWindow } from '@/hooks/use-resize-window';
import { useSelectItem } from '@/hooks/use-select-item';
import { useRef, useState } from 'react';
import FPSStats from 'react-fps-stats';

const randomNumberBetween = (min: number, max: number) => Math.random() * (max - min) + min;

type Item = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  colour: string;
  image: string;
  zIndex: number;
};

const items = Array.from<number, Item>({ length: 1_000 }, (_, index) => ({
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

const draw = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  translatePos: Position,
  currentItemIndexRef: React.MutableRefObject<number | null>,
) => {
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

    // If the item is selected draw a border around it with handles for resize and rotation
    if (currentItemIndexRef.current === item.id) {
      // Background
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x, item.y, item.width, item.height);

      // Draw the border
      ctx.strokeStyle = 'pink';
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x, item.y, item.width, item.height);

      // Handles
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'pink';
      ctx.lineWidth = 1;

      // Top left
      ctx.fillRect(item.x - 5, item.y - 5, 10, 10);
      ctx.strokeRect(item.x - 5, item.y - 5, 10, 10);

      // Top right
      ctx.fillRect(item.x + item.width - 5, item.y - 5, 10, 10);
      ctx.strokeRect(item.x + item.width - 5, item.y - 5, 10, 10);

      // Bottom left
      ctx.fillRect(item.x - 5, item.y + item.height - 5, 10, 10);
      ctx.strokeRect(item.x - 5, item.y + item.height - 5, 10, 10);

      // Bottom right
      ctx.fillRect(item.x + item.width - 5, item.y + item.height - 5, 10, 10);
      ctx.strokeRect(item.x + item.width - 5, item.y + item.height - 5, 10, 10);
    }
  }

  ctx.restore(); // Restore the context state to what it was before scaling and translating
};

export const ShowcaseStudio = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const { translatePos } = useCanvasPanning(canvasRef);

  // Resize the canvas when the window resizes
  useResizeWindow(canvasRef, setScale);

  // Select the item that is being clicked
  const currentItemIndexRef = useSelectItem(canvasRef, items, translatePos, scale);

  // Move the item that is being dragged
  useMoveItem(canvasRef, items, translatePos, scale);

  // Draw the canvas
  useDrawCanvas(canvasRef, scale, translatePos, () =>
    draw(canvasRef.current!.getContext('2d')!, scale, translatePos, currentItemIndexRef),
  );

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
