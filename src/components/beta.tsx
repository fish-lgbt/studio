'use client';

import '@total-typescript/ts-reset';
import FPSStats from 'react-fps-stats';
import { useCanvasPanning } from '@/hooks/use-canvas-panning';
import { useDrawCanvas } from '@/hooks/use-draw-canvas';
import { useResizeWindow } from '@/hooks/use-resize-window';
import { useEffect, useRef, useState } from 'react';
import { Position } from '@/common/position';
import { Item } from './item';
import { Layers } from './Layers';
import { Button } from './button';
import { Point } from '@/common/point';
import { CommandMenu } from './command-menu';
import { TrashCanIcon } from './TrashCanIcon';
import { Border } from './effects/border';
import { Glow } from './effects/glow';
import { Rectangle } from './items/rectangle';
import { Circle } from './items/circle';
import { Triangle } from './items/triangle';
import { Line } from './items/line';
import { useWatchRef } from '@/hooks/use-watch-ref';
import { Tool, Tools } from './Tools';
import { MoveIcon } from './icons/move-icon';
import { CircleIcon } from './icons/circle-icon';
import { EraserIcon } from './icons/eraser-icon';
import { LineIcon } from './icons/line-icon';
import { TriangleIcon } from './icons/triangle-icon';
import { PencilIcon } from './icons/pencil-icon';
import { SquareIcon } from './icons/square-icon';
import { ImageIcon } from './icons/image-icon';
import { TextIcon } from './icons/text-icon';
import { Drawing } from './items/drawing';
import { Image } from './items/image';

export type Layer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  items: Item[];
};

const loadTime = Date.now();

const humanTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  // Dont show until we have at least 1 of the unit
  if (days >= 1) return `${days} days`;
  if (hours >= 1) return `${hours} hours`;
  if (minutes >= 1) return `${minutes} minutes`;
  if (seconds >= 1) return `${seconds} seconds`;
  return `${ms} ms`;
};

type RenderParams = {
  /**
   * The canvas to render to
   */
  canvas: HTMLCanvasElement | null;
  /**
   * The scale of the canvas
   */
  scale: number;
  translatePos: Position;
  layers: Layer[];
  activeTool: string;
  brushSize: number;
  brushColour: string;
  mousePos: Position;
  brushPoints: Point[];
  selectedItems: Set<string>;
  showDebug: boolean;
  showSafezone: boolean;
};

export const cachedRenderedCanvases = new Map<string, HTMLCanvasElement>();
const lastknownSafezone = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

type RenderUIParams = {
  ctx: CanvasRenderingContext2D;
  translatePos: Position;
  scale: number;
  layers: Layer[];
  activeTool: string;
  brushSize: number;
  brushColour: string;
  mousePos: Position;
  brushPoints: Point[];
  selectedItems: Set<string>;
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

const render = (
  {
    canvas,
    scale,
    translatePos,
    layers,
    activeTool,
    brushSize,
    brushColour,
    mousePos,
    brushPoints,
    selectedItems,
    showDebug,
    showSafezone,
  }: RenderParams,
  delta: number,
) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Render a background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // @ts-expect-error
  const memory = window.performance.memory;
  if (memory) {
    const performanceStats = `Memory: ${memory.usedJSHeapSize / 1000000}MB / ${memory.jsHeapSizeLimit / 1000000}MB`;

    // Render the performance stats at the bottom center
    ctx.fillText(performanceStats, (ctx.canvas.width - ctx.measureText(performanceStats).width) / 2, ctx.canvas.height - 30);
  }

  // Render the safezone
  if (showSafezone) {
    const safezone = {
      x: 0,
      y: 0,
      width: 1920 * scale,
      height: 1080 * scale,
    };

    // Save the current state of the context
    ctx.save();

    // Translate the canvas to the current position
    ctx.translate(translatePos.x, translatePos.y);

    // Scale the canvas
    ctx.scale(scale, scale);

    // If the safezone size has changed we should re-render the safezone canvas
    if (
      lastknownSafezone.x !== safezone.x ||
      lastknownSafezone.y !== safezone.y ||
      lastknownSafezone.width !== safezone.width ||
      lastknownSafezone.height !== safezone.height ||
      showDebug
    ) {
      // Update the last known safezone
      lastknownSafezone.x = safezone.x;
      lastknownSafezone.y = safezone.y;
      lastknownSafezone.width = safezone.width;
      lastknownSafezone.height = safezone.height;

      // Create a safezone canvas
      const safezoneCanvas = document.createElement('canvas');
      safezoneCanvas.width = safezone.width;
      safezoneCanvas.height = safezone.height;

      // Get the context of the safezone canvas
      const safezoneCtx = safezoneCanvas.getContext('2d');
      if (!safezoneCtx) return;

      // Fill safezone with a "transparent" checkerboard
      const size = 20;
      for (let x = 0; x < safezone.width; x += size) {
        for (let y = 0; y < safezone.height; y += size) {
          safezoneCtx.fillStyle = (x + y) % (size * 2) === 0 ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.2)';
          safezoneCtx.fillRect(x, y, size, size);
        }
      }

      // Cache the safezone canvas
      cachedRenderedCanvases.set('safezone', safezoneCanvas);
    }

    // Get the safezone canvas
    const safezoneCanvas = cachedRenderedCanvases.get('safezone');
    if (!safezoneCanvas) return;

    // Get the context of the safezone canvas
    const safezoneCtx = safezoneCanvas.getContext('2d');
    if (!safezoneCtx) return;

    // Show debug info
    if (showDebug) {
      // Above the safezone we should write some debug info
      safezoneCtx.font = '20px Arial';
      safezoneCtx.fillStyle = 'black';
      safezoneCtx.fillText(`Scale: ${scale}`, 10, 30);
      safezoneCtx.fillText(`Translate: ${translatePos.x}, ${translatePos.y}`, 10, 60);
      safezoneCtx.fillText(`Mouse: ${mousePos.x}, ${mousePos.y}`, 10, 90);
      safezoneCtx.fillText(`Brush Size: ${brushSize}`, 10, 120);
      safezoneCtx.fillText(`Brush Colour: ${brushColour}`, 10, 150);
      safezoneCtx.fillText(`Active Tool: ${activeTool}`, 10, 180);
      safezoneCtx.fillText(`Frames rendered: ${delta}`, 10, 210);
      safezoneCtx.fillText(`Time since last react re-render ${humanTime(Date.now() - loadTime)}`, 10, 240);
    }

    // Draw the safezone canvas
    ctx.drawImage(safezoneCanvas, 0, 0);

    // Draw the safezone outline
    if (showSafezone) {
      ctx.beginPath();
      // Draw a box around the viewport it should get small if we zoom out
      // It should get big if we zoom in
      // It should be fixed in position on the canvas not the viewport
      ctx.rect(0, 0, safezone.width + 1, safezone.height + 1);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw instructions above the safezone
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('Anything outside of this box will not be visible on the final render', 10, -10);

    // Restore the context to the state before we translated and scaled it
    ctx.restore();
  }

  const viewport = {
    x: -translatePos.x / scale,
    y: -translatePos.y / scale,
    width: window.innerWidth / scale,
    height: window.innerHeight / scale,
  };

  // Render all the layers
  for (const layer of layers.filter((layer) => layer.visible)) {
    // Only render items that are within the viewport
    const itemsWithinViewport = layer.items.filter((item) => item.isWithinPosition(viewport));

    // Render the items
    for (const item of itemsWithinViewport) {
      const beforeEffects = item.effects.filter((effect) => effect.stage === 'before');
      const afterEffects = item.effects.filter((effect) => effect.stage === 'after');

      // Render the item's before effects
      for (const effect of beforeEffects) {
        effect.render(ctx, translatePos, scale);
      }

      // Render the item
      item.render(ctx, translatePos, scale);

      // Render the item's after effects
      for (const effect of afterEffects) {
        effect.render(ctx, translatePos, scale);
      }

      // If the item is selected render a border and handles
      if (selectedItems.has(item.id)) {
        item.renderBorder(ctx, translatePos, scale);
        item.renderHandles(ctx, translatePos, scale);
      }
    }
  }

  // Save the current state of the context
  ctx.save();

  // Translate the canvas to the current position
  ctx.translate(translatePos.x, translatePos.y);

  // Scale the canvas
  ctx.scale(scale, scale);

  // Render the brush preview
  if (brushPoints.length >= 1) {
    ctx.strokeStyle = brushColour;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';

    ctx.beginPath(); // Begin a new path for the brush preview
    ctx.moveTo(brushPoints[0].x, brushPoints[0].y); // Move to the start of the brush points

    // Draw all of the points
    for (const [index, point] of brushPoints.entries()) {
      if (index > 0) {
        ctx.lineTo(point.x, point.y);
        ctx.moveTo(point.x, point.y);
        ctx.stroke();
      }
    }
    ctx.closePath(); // Close the path
  }

  // Restore the context to the state before we translated and scaled it
  ctx.restore();

  // If we have a brush render it where the mouse is
  if (activeTool === 'brush') {
    if (brushSize >= 1) {
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, brushSize / 2, 0, 2 * Math.PI);
      ctx.fillStyle = brushColour;
      ctx.fill();
    }
  }
};

type CanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
};

const Canvas = ({ canvasRef, onMouseDown, onMouseMove, onMouseUp, onMouseLeave }: CanvasProps) => {
  return (
    <canvas
      className="z-0"
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    />
  );
};

const saveCanvasImageFile = async (canvas: HTMLCanvasElement) => {
  const imageData = await fetch(canvas.toDataURL('image/png')).then((res) => res.blob());

  try {
    const imgFileHandle = await window.showSaveFilePicker({
      types: [
        {
          description: 'Image',
          accept: { 'image/png': ['.png'] },
        },
      ],
      suggestedName: `studio-${new Date().toISOString().replace(/:/g, '-')}.png`,
    });
    const writable = await imgFileHandle.createWritable();
    await writable.write(imageData);
    await writable.close();
  } catch (err) {
    // If the user cancels the save prompt, return
    if (err instanceof DOMException && err.name === 'AbortError') {
      return;
    }

    // Try to save the image using a link
    saveCanvasImageLink(canvas);
  }
};

const saveCanvasImageLink = (canvas: HTMLCanvasElement) => {
  const link = document.createElement('a');
  link.download = 'image.png'; // Set the filename for the download
  link.href = canvas.toDataURL('image/png'); // Create a data URL representing the canvas image
  document.body.appendChild(link); // Append to the document temporarily
  link.click(); // Trigger the download
  document.body.removeChild(link); // Clean up
};

const randomNumberBetween = (min: number, max: number) => Math.random() * (max - min) + min;

type DropzoneProps = {
  children: React.ReactNode;
  hoverChildren: React.ReactNode;
  onImageDrop: (image: HTMLImageElement) => void;
};
// Show the children
// When someone drags an image over show the hover children
// When they drop the image call onImageDrop with the image
const Dropzone = ({ children, hoverChildren, onImageDrop }: DropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files ?? [];
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new globalThis.Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          // Clear selection
          onImageDrop(img);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="absolute w-full h-full top-0 right-0 bottom-0 left-0"
      onDragOver={onDragOver}
      onDragLeave={onLeave}
      onMouseLeave={onLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="absolute w-full h-full top-0 right-0 bottom-0 left-0 flex justify-center items-center z-20">
          {hoverChildren}
        </div>
      )}
      <div className="relative w-full h-full flex justify-center">{children}</div>
    </div>
  );
};

type MetadataPanelProps = {
  layers: Layer[];
  selectedLayer: string | null;
  metadataRef: React.MutableRefObject<Set<string>>;
};

const MetadataPanel = ({ layers, selectedLayer, metadataRef }: MetadataPanelProps) => {
  // Aim for 30fps
  useWatchRef(metadataRef, 1000 / 30);

  const values = [...metadataRef.current.values()];
  const layer = layers.find((layer) => layer.id === selectedLayer);
  if (!layer) return null;

  return (
    <div className="p-2">
      <h1 className="text-xl font-bold">Selected Items</h1>
      <ul>
        {values.map((id) => {
          const item = layer.items.find((item) => item.id === id);
          if (!item) return null;
          return (
            <li key={item.id}>
              <h2 className="text-lg font-bold">{item.id}</h2>
              <p>X: {item.x}</p>
              <p>Y: {item.y}</p>
              <p>Width: {item.width}</p>
              <p>Height: {item.height}</p>
              <p>Rotation: {item.rotation}</p>
              <p>Colour: {item.colour}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

type RenderMenuProps = {
  showDebug: boolean;
  layers: Layer[];
  selectedLayer: string | null;
  onLayerUpdate: (layer: Layer) => void;
  selectedItemsRef: React.MutableRefObject<Set<string>>;
};

const RenderMenu = ({ showDebug, layers, selectedLayer, onLayerUpdate, selectedItemsRef }: RenderMenuProps) => {
  const onSaveImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    render(
      {
        canvas,
        scale: 1,
        translatePos: { x: 0, y: 0 },
        layers,
        activeTool: 'move',
        brushSize: 1,
        brushColour: 'black',
        mousePos: { x: 0, y: 0 },
        brushPoints: [],
        selectedItems: new Set(),
        showDebug: false,
        showSafezone: false,
      },
      0,
    );

    // Save the canvas as a file
    saveCanvasImageFile(canvas);
  };

  const onAddRandomItems = () => {
    const layer = layers[0];
    if (!layer) return;

    const items = Array.from({ length: 100 }).map(() => {
      const x = randomNumberBetween(10, 1920);
      const y = randomNumberBetween(10, 1080);
      const width = randomNumberBetween(10, 100);
      const height = randomNumberBetween(10, 100);
      return new Item({
        id: crypto.randomUUID(),
        x,
        y,
        width,
        height,
        colour: `hsl(${Math.random() * 360}, 100%, 50%)`,
        rotation: Math.random() * 360,
        zIndex: 0,
        canvas: null,
        effects: [
          new Glow({
            blur: randomNumberBetween(100, 1000),
            colour: `hsl(${Math.random() * 360}, 100%, 50%)`,
            offsetX: 0,
            offsetY: 0,
          }),
          new Glow({
            blur: randomNumberBetween(100, 1000),
            colour: `hsl(${Math.random() * 360}, 100%, 50%)`,
            offsetX: 0,
            offsetY: 0,
          }),
          new Border({
            lineWidth: randomNumberBetween(1, 10),
            colour: `hsl(${Math.random() * 360}, 100%, 50%)`,
          }),
        ],
      });
    });

    onLayerUpdate({
      ...layer,
      items: [...layer.items, ...items],
    });
  };

  return (
    <div className="fixed top-1 right-1 z-40 flex flex-col gap-1 max-w-96 bg-black p-2">
      <Button onClick={onSaveImage} className="w-full">
        Save image
      </Button>
      {showDebug && (
        <Button onClick={onAddRandomItems} className="w-full">
          Add random items
        </Button>
      )}
      <MetadataPanel metadataRef={selectedItemsRef} layers={layers} selectedLayer={selectedLayer} />
    </div>
  );
};

type CreateNewItemParams = {
  type: 'rectangle' | 'circle' | 'triangle' | 'line' | 'pie-chart';
  x: number;
  y: number;
  colour: string;
};

const createNewItem = ({ type, x, y, colour }: CreateNewItemParams) => {
  if (type === 'rectangle')
    return new Rectangle({
      id: crypto.randomUUID(),
      x,
      y,
      width: 5,
      height: 5,
      rotation: 0,
      zIndex: 0,
      canvas: null,
      effects: [],
      colour,
    });

  if (type === 'circle')
    return new Circle({
      id: crypto.randomUUID(),
      x,
      y,
      width: 5,
      height: 5,
      rotation: 0,
      zIndex: 0,
      canvas: null,
      effects: [],
      colour,
    });

  if (type === 'triangle')
    return new Triangle({
      id: crypto.randomUUID(),
      x,
      y,
      width: 5,
      height: 5,
      rotation: 0,
      zIndex: 0,
      canvas: null,
      effects: [],
      colour,
    });

  if (type === 'line')
    return new Line({
      id: crypto.randomUUID(),
      x,
      y,
      width: 5,
      height: 5,
      rotation: 0,
      zIndex: 0,
      canvas: null,
      effects: [],
      colour,
    });
};

// For some stupid reason the body gets focused when the canvas is focused
const isCanvasInFocus = () => document.activeElement?.tagName === 'BODY';

export const ShowcaseStudio = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useCanvasZooming();
  const translatePosRef = useCanvasPanning(canvasRef);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>('move');
  const [brushSize, setBrushSize] = useState(10);
  const [brushColour, setBrushColour] = useState('#000000');
  const [shape, setShape] = useState<'rectangle' | 'circle' | 'triangle' | 'line'>('rectangle');
  const [shapeColour, setShapeColour] = useState('#000000');
  const [showDebug, setShowDebug] = useState(false);
  const [showSafezone, setShowSafezone] = useState(true);

  const isDraggingRef = useRef(false);
  const initialMousePositionRef = useRef<Position>({ x: 0, y: 0 });
  const mousePositionRef = useRef<Position>({ x: 0, y: 0 });
  const drawingPointsRef = useRef<Point[]>([]);
  const selectedItemsRef = useRef<Set<string>>(new Set());
  const delta = useRef(0);

  // Reset delta on re-render
  useEffect(() => {
    delta.current = 0;
  }, []);

  // Track mouse position
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      initialMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [mousePositionRef]);

  // Resize the canvas when the window resizes
  useResizeWindow(canvasRef, scaleRef);

  // Draw the canvas
  useDrawCanvas(canvasRef, () => {
    return render(
      {
        canvas: canvasRef.current,
        scale: scaleRef.current,
        translatePos: translatePosRef.current,
        layers,
        activeTool,
        brushSize,
        brushColour,
        mousePos: mousePositionRef.current,
        brushPoints: drawingPointsRef.current,
        selectedItems: selectedItemsRef.current,
        showDebug: showDebug,
        showSafezone: showSafezone,
      },
      delta.current++,
    );
  });

  // Press ctrl+s and save the canvas as an image
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // If the canvas isnt focused ignore the event
      if (!isCanvasInFocus()) return;

      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        saveCanvasImageFile(canvas);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Press ctrl+a and select all items
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // If the canvas isnt focused ignore the event
      if (!isCanvasInFocus()) return;

      if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const layer = layers.find((layer) => layer.id === selectedLayer);
        if (!layer) return;

        selectedItemsRef.current = new Set(layer.items.map((item) => item.id));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [layers, selectedLayer]);

  // Press delete key and remove all selected items
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // If the canvas isnt focused ignore the event
      if (!isCanvasInFocus()) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        // Remove all selected items
        setLayers((prev) => {
          const newLayers = [...prev];
          return newLayers.map((layer) => ({
            ...layer,
            items: layer.items.filter((item) => !selectedItemsRef.current.has(item.id)),
          }));
        });
        // Reset the selected items
        selectedItemsRef.current.clear();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [setLayers]);

  // Press c when an item is selected to center it on the viewport
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // If the canvas isnt focused ignore the event
      if (!isCanvasInFocus()) return;

      if (e.key === 'c') {
        e.preventDefault();

        // Move the item to the center of the viewport
        const layer = layers.find((layer) => layer.id === selectedLayer);
        if (!layer) return;

        // Find the selected item
        const item = layer.items.find((item) => selectedItemsRef.current.has(item.id));
        if (!item) return;

        // Get the current translate position and scale
        const translatePos = translatePosRef.current;
        const scale = scaleRef.current;
        const viewport = {
          x: -translatePos.x / scale,
          y: -translatePos.y / scale,
          width: window.innerWidth / scale,
          height: window.innerHeight / scale,
        };

        // Calculate the center of the viewport
        const centerX = viewport.x + viewport.width / 2;
        const centerY = viewport.y + viewport.height / 2;
        const dx = centerX - item.x;
        const dy = centerY - item.y;

        // Move the item
        item.moveTo(dx, dy);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [layers, scaleRef, selectedLayer, translatePosRef]);

  // Don't render canvas on the server
  if (typeof window === 'undefined') return null;

  const onLayerSelect = (id: string | null) => {
    setSelectedLayer(id);
  };

  const onLayerCreate = () => {
    const id = crypto.randomUUID();
    setLayers((prev) => [
      ...prev,
      {
        id,
        name: `Layer ${prev.length}`,
        visible: true,
        locked: false,
        items: [],
      },
    ]);
    setSelectedLayer(id);
  };

  const onLayerUpdate = (layer: Layer) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === layer.id);

      // If the layer is being locked/unlocked we should allow that
      if (prev[index].locked !== layer.locked) {
        const newLayers = [...prev];
        newLayers[index] = layer;
        return newLayers;
      }

      // If the layer is locked we should not allow the update
      if (prev[index].locked) return prev;

      // Update the layer
      const newLayers = [...prev];
      newLayers[index] = layer;
      return newLayers;
    });
  };

  const onLayerDelete = (id: string | null) => {
    if (!id) return;

    const index = layers.findIndex((layer) => layer.id === id);
    setLayers((prev) => prev.filter((_, layerIndex) => layerIndex !== index));
    const nextLayer = layers[index + 1] ?? layers[index - 1];
    setSelectedLayer(nextLayer?.id ?? null);

    // Remove cached rendered canvases for the deleted layer
    cachedRenderedCanvases.delete(id);
  };

  const onLayerReorder = (layers: Layer[]) => {
    setLayers(layers);
  };

  const onToolChange = (tool: string) => {
    setActiveTool(tool);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only activate on left click
    if (e.button !== 0) return;

    // Transform mouse coordinates to canvas space
    const mouseX = e.nativeEvent.offsetX / scaleRef.current - translatePosRef.current.x / scaleRef.current;
    const mouseY = e.nativeEvent.offsetY / scaleRef.current - translatePosRef.current.y / scaleRef.current;

    // Erase or draw
    if (activeTool === 'erase' || activeTool === 'brush') {
      const layer = layers.find((layer) => layer.id === selectedLayer);
      if (!layer) {
        // Create a new layer if there are no layers
        onLayerCreate();
      }
      isDraggingRef.current = true;
    }

    // Move
    if (activeTool === 'move') {
      const layer = layers.find((layer) => layer.id === selectedLayer);
      if (!layer) return;

      // Ctrl + click should add the item to the selection
      // Click should set the item as the only selected item
      if (e.metaKey || e.ctrlKey) {
        // Get the last item that is within the position
        // This allows us to respect draw order
        const item = layer.items.findLast((item) =>
          item.isWithinPosition({
            x: mouseX,
            y: mouseY,
            width: 0,
            height: 0,
          }),
        );
        if (item) {
          isDraggingRef.current = true;
          selectedItemsRef.current.add(item.id);
        } else {
          isDraggingRef.current = true;
          selectedItemsRef.current.clear();
        }
      } else {
        // Get the last item that is within the position
        // This allows us to respect draw order
        const item = layer.items.findLast((item) =>
          item.isWithinPosition({
            x: mouseX,
            y: mouseY,
            width: 0,
            height: 0,
          }),
        );
        if (item) {
          isDraggingRef.current = true;
          selectedItemsRef.current.clear();
          selectedItemsRef.current.add(item.id);
        } else {
          isDraggingRef.current = true;
          selectedItemsRef.current.clear();
        }
      }
    }

    // Shape
    if (activeTool === 'shape') {
      // Create the inital shape
      const layer = layers.find((layer) => layer.id === selectedLayer);
      if (!layer) return;

      // Create a new item
      const item = createNewItem({
        type: shape,
        x: mouseX,
        y: mouseY,
        colour: shapeColour,
      });

      if (!item) return;

      // Add the new item to the layer
      setLayers((prev) => {
        // Clone the array to avoid mutating the previous state directly
        const newLayers = [...prev];

        // Clone the layer you want to update to avoid mutating it directly
        const updatedLayer = { ...layer };

        // Update the items in the cloned layer
        updatedLayer.items = [...updatedLayer.items, item];

        // Replace the original layer with the updated one
        newLayers[layers.findIndex((layer) => layer.id === selectedLayer)] = updatedLayer;

        return newLayers;
      });

      // Mark the item as selected
      selectedItemsRef.current.clear();
      selectedItemsRef.current.add(item.id);

      // Mark the item as being dragged
      isDraggingRef.current = true;
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Transform mouse coordinates to canvas space
    const mouseX = e.nativeEvent.offsetX / scaleRef.current - translatePosRef.current.x / scaleRef.current;
    const mouseY = e.nativeEvent.offsetY / scaleRef.current - translatePosRef.current.y / scaleRef.current;

    const layer = layers.find((layer) => layer.id === selectedLayer);
    if (!layer) return;

    // If layer is locked we should not allow any changes
    if (layer.locked) return;

    // Save the drawing points
    if (activeTool === 'brush' && isDraggingRef.current) {
      drawingPointsRef.current.push({ x: mouseX, y: mouseY, colour: `hsl(${(delta.current * 10) % 360}, 100%, 50%)` });
    }

    // Move the item
    if (activeTool === 'move' && isDraggingRef.current) {
      const items =
        layers.find((layer) => layer.id === selectedLayer)?.items.filter((item) => selectedItemsRef.current.has(item.id)) ??
        [];

      if (items.length >= 1) {
        // Get the difference between the current and previous mouse position
        // If we translate the canvas we should also take that into account
        const dx = mouseX - mousePositionRef.current.x + translatePosRef.current.x / scaleRef.current;
        const dy = mouseY - mousePositionRef.current.y + translatePosRef.current.y / scaleRef.current;
        for (const item of items) {
          item.moveBy(dx, dy);
        }
      }
    }

    // Inside your onMouseMove function for the 'shape' tool
    if (activeTool === 'shape' && isDraggingRef.current) {
      const item = layers
        .find((layer) => layer.id === selectedLayer)
        ?.items.find((item) => selectedItemsRef.current.has(item.id));

      if (item) {
        // Initial drag start positions (assuming these are captured correctly elsewhere)
        const startX = initialMousePositionRef.current.x - translatePosRef.current.x / scaleRef.current;
        const startY = initialMousePositionRef.current.y - translatePosRef.current.y / scaleRef.current;

        // Calculate new dimensions and position based on drag direction
        const width = Math.abs(mouseX - startX);
        const height = Math.abs(mouseY - startY);
        const newX = Math.min(mouseX, startX);
        const newY = Math.min(mouseY, startY);

        // Update the item's position and size
        item.moveTo(newX, newY);
        item.resize(width, height);
      }
    }
  };

  const onMouseUp = () => {
    const layer = layers.find((layer) => layer.id === selectedLayer);
    if (!layer) return;

    if (activeTool === 'brush') {
      isDraggingRef.current = false;

      const topLeft = drawingPointsRef.current.reduce(
        (acc, point) => {
          return {
            x: Math.min(acc.x, point.x - brushSize / 2),
            y: Math.min(acc.y, point.y - brushSize / 2),
          };
        },
        { x: Infinity, y: Infinity },
      );
      const bottomRight = drawingPointsRef.current.reduce(
        (acc, point) => {
          return {
            x: Math.max(acc.x, point.x + brushSize / 2),
            y: Math.max(acc.y, point.y + brushSize / 2),
          };
        },
        { x: -Infinity, y: -Infinity },
      );

      // Get the bounding box of the drawing
      const x = Math.min(topLeft.x, bottomRight.x);
      const y = Math.min(topLeft.y, bottomRight.y);
      const width = Math.abs(topLeft.x - bottomRight.x) + 1;
      const height = Math.abs(topLeft.y - bottomRight.y) + 1;

      // Create a new canvas to draw the drawing points
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw the drawing points
      ctx.beginPath();
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = brushColour;

      // Draw all of the points
      for (const point of drawingPointsRef.current) {
        // Allow the drawing path to be continuous
        ctx.lineTo(point.x - x, point.y - y);
        ctx.moveTo(point.x - x, point.y - y);
        ctx.stroke();
      }

      // Create a new drawing
      const item = new Drawing({
        id: crypto.randomUUID(),
        x,
        y,
        width,
        height,
        rotation: 0,
        zIndex: 0,
        canvas,
        effects: [],
      });

      // Clear the drawing points
      drawingPointsRef.current = [];

      // Add the new item to the layer
      setLayers((prev) => {
        // Clone the array to avoid mutating the previous state directly
        const newLayers = [...prev];

        // Clone the layer you want to update to avoid mutating it directly
        const updatedLayer = { ...layer };

        // Update the items in the cloned layer
        updatedLayer.items = [...updatedLayer.items, item];

        // Replace the original layer with the updated one
        newLayers[layers.findIndex((layer) => layer.id === selectedLayer)] = updatedLayer;

        return newLayers;
      });
    }

    // Move
    if (activeTool === 'move') {
      isDraggingRef.current = false;
    }

    // Shape
    if (activeTool === 'shape') {
      isDraggingRef.current = false;

      // Switch to the move tool
      setActiveTool('move');
    }
  };

  const onMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const commands = [
    {
      name: 'Reload Page',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="w-4 h-4 stroke-black dark:stroke-white"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M18.61 5.89L15.5 9h6V3l-2.89 2.89zm0 0A9.001 9.001 0 003.055 11m2.335 7.11L2.5 21v-6h6l-3.11 3.11zm0 0A9.001 9.001 0 0020.945 13"
          />
        </svg>
      ),
      description: 'Refresh the page',
      action: () => {
        window.location.reload();
      },
    },
    {
      name: 'New layer',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      description: 'Create a new layer',
      action: () => {
        onLayerCreate();
      },
    },
    {
      name: 'Delete layer',
      icon: <TrashCanIcon />,
      description: 'Delete the selected layer',
      action: () => {
        onLayerDelete(selectedLayer);
      },
    },
    {
      name: 'Move tool',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 stroke-black dark:stroke-white">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 3v6m0-6L9 6m3-3l3 3m-3 9v6m0 0l3-3m-3 3l-3-3m-6-6h6m-6 0l3 3m-3-3l3-3m9 3h6m0 0l-3-3m3 3l-3 3"
          ></path>
        </svg>
      ),
      description: 'Select the move tool',
      action: () => {
        onToolChange('move');
      },
    },
    {
      name: 'Brush tool',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 25 25" className="w-4 h-4 fill-black dark:fill-white">
          <path
            fill="currentColor"
            d="M13.294 7.959a.75.75 0 10-1.17-.938l1.17.938zm-6.483 6.89l.568.49a.754.754 0 00.017-.021l-.585-.47zm-.171.418l-.749-.05v.015l.749.035zM6.5 18.29l-.75-.035a.75.75 0 00.004.112l.746-.077zm.787.687l.025.75a.75.75 0 00.148-.02l-.173-.73zm3-.711l.173.73.012-.003-.185-.727zm.385-.244l.579.477.006-.008-.585-.47zm6.625-7.063a.75.75 0 00-1.17-.938l1.17.938zm-5.17-3.938a.75.75 0 001.17.938l-1.17-.938zM14.3 5.51l.585.469a.81.81 0 00.029-.038L14.3 5.51zm1.629-.32l.48-.577a.76.76 0 00-.075-.055l-.405.632zm2.237 1.862l.53-.53a.76.76 0 00-.05-.047l-.48.577zm.337.82l.75.005-.75-.004zm-.346.818l-.525-.536a.771.771 0 00-.06.066l.585.47zm-2.03 1.33a.75.75 0 101.17.94l-1.17-.94zM13.454 7.38a.75.75 0 10-1.484.222l1.484-.222zm3.359 3.854a.75.75 0 10-.202-1.486l.202 1.486zm-4.69-4.212L6.227 14.38l1.17.938 5.898-7.36-1.17-.937zm-5.88 7.338c-.207.24-.33.542-.351.859l1.496.098a.039.039 0 01-.009.022l-1.136-.979zm-.352.873l-.14 3.023 1.498.07.14-3.023-1.498-.07zm-.137 3.135a1.516 1.516 0 001.558 1.36l-.05-1.5h-.005a.016.016 0 01-.006-.004.018.018 0 01-.003-.005.015.015 0 01-.002-.005l-1.492.154zm1.706 1.34l3-.712-.346-1.459-3 .711.346 1.46zm3.012-.714c.305-.078.578-.25.779-.494l-1.158-.954a.018.018 0 01.01-.006l.369 1.454zm.785-.502l6.04-7.532-1.17-.938-6.04 7.532 1.17.938zm2.04-10.532l1.588-1.98-1.17-.938-1.588 1.98 1.17.938zm1.617-2.018a.45.45 0 01.61-.12l.81-1.263a1.95 1.95 0 00-2.647.52l1.227.863zm.535-.175l2.237 1.862.96-1.153-2.237-1.862-.96 1.153zm2.186 1.816c.076.076.118.179.118.287l1.5.008a1.903 1.903 0 00-.556-1.355l-1.062 1.06zm.118.287c0 .107-.044.21-.121.285l1.05 1.071c.363-.355.568-.84.57-1.348l-1.5-.008zm-.18.351l-1.446 1.8 1.17.94 1.445-1.8-1.17-.94zM11.97 7.6a4.31 4.31 0 004.843 3.633l-.202-1.486a2.81 2.81 0 01-3.157-2.368L11.97 7.6z"
          />
        </svg>
      ),
      description: 'Select the draw tool',
      action: () => {
        onToolChange('brush');
      },
    },
    {
      name: 'Erase tool',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-black dark:fill-white">
          <path d="M5.505 11.41l.53.53-.53-.53zM3 14.952h-.75H3zM9.048 21v.75V21zM11.41 5.505l-.53-.53.53.53zm1.831 12.34a.75.75 0 001.06-1.061l-1.06 1.06zM7.216 9.697a.75.75 0 10-1.06 1.061l1.06-1.06zm10.749 2.362l-5.905 5.905 1.06 1.06 5.905-5.904-1.06-1.06zm-11.93-.12l5.905-5.905-1.06-1.06-5.905 5.904 1.06 1.06zm0 6.025c-.85-.85-1.433-1.436-1.812-1.933-.367-.481-.473-.79-.473-1.08h-1.5c0 .749.312 1.375.78 1.99.455.596 1.125 1.263 1.945 2.083l1.06-1.06zm-1.06-7.086c-.82.82-1.49 1.488-1.945 2.084-.468.614-.78 1.24-.78 1.99h1.5c0-.29.106-.6.473-1.08.38-.498.962-1.083 1.812-1.933l-1.06-1.06zm7.085 7.086c-.85.85-1.435 1.433-1.933 1.813-.48.366-.79.472-1.08.472v1.5c.75 0 1.376-.312 1.99-.78.596-.455 1.264-1.125 2.084-1.945l-1.06-1.06zm-7.085 1.06c.82.82 1.487 1.49 2.084 1.945.614.468 1.24.78 1.989.78v-1.5c-.29 0-.599-.106-1.08-.473-.497-.38-1.083-.962-1.933-1.812l-1.06 1.06zm12.99-12.99c.85.85 1.433 1.436 1.813 1.933.366.481.472.79.472 1.08h1.5c0-.749-.312-1.375-.78-1.99-.455-.596-1.125-1.263-1.945-2.083l-1.06 1.06zm1.06 7.086c.82-.82 1.49-1.488 1.945-2.084.468-.614.78-1.24.78-1.99h-1.5c0 .29-.106.6-.473 1.08-.38.498-.962 1.083-1.812 1.933l1.06 1.06zm0-8.146c-.82-.82-1.487-1.49-2.084-1.945-.614-.468-1.24-.78-1.989-.78v1.5c.29 0 .599.106 1.08.473.497.38 1.083.962 1.933 1.812l1.06-1.06zm-7.085 1.06c.85-.85 1.435-1.433 1.933-1.812.48-.367.79-.473 1.08-.473v-1.5c-.75 0-1.376.312-1.99.78-.596.455-1.264 1.125-2.084 1.945l1.06 1.06zm2.362 10.749L7.216 9.698l-1.06 1.061 7.085 7.085 1.06-1.06z" />
        </svg>
      ),
      description: 'Select the erase tool',
      action: () => {
        onToolChange('erase');
      },
    },
    {
      name: `Toggle debug [${showDebug ? 'off' : 'on'}]`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="w-4 h-4 stroke-black dark:stroke-white"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 8h16M4 16h16"
          ></path>
        </svg>
      ),
      description: 'Toggle debug info',
      action: () => {
        setShowDebug((prev) => !prev);
      },
    },
    {
      name: `Toggle safezone [${showSafezone ? 'off' : 'on'}]`,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="w-4 h-4 stroke-black dark:stroke-white"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 8h16M4 16h16"
          ></path>
        </svg>
      ),
      description: 'Toggle safezone',
      action: () => {
        setShowSafezone((prev) => !prev);
      },
    },
  ];

  const onImageDrop = (image: HTMLImageElement) => {
    const item = new Image({
      id: crypto.randomUUID(),
      x: mousePositionRef.current.x - image.width / 2,
      y: mousePositionRef.current.y - image.height / 2,
      width: image.width,
      height: image.height,
      rotation: 0,
      zIndex: 0,
      canvas: null,
      image,
      effects: [],
    });

    // Add the new item to the layer
    layers[layers.findIndex((layer) => layer.id === selectedLayer)].items.push(item);

    // Mark the item as selected
    selectedItemsRef.current.add(item.id);

    // Switch to the move tool
    setActiveTool('move');
  };

  const tools: Tool[] = [
    {
      name: 'move',
      icon: <MoveIcon />,
      helpText: 'To move items around the canvas click and drag them, hold ctrl to select multiple items',
      shortcut: '1',
      isActive: activeTool === 'move',
      onClick() {
        setActiveTool('move');
      },
    },
    {
      name: 'rectangle',
      icon: <SquareIcon />,
      helpText: 'Click and drag to draw a rectangle, hold shift to draw a square',
      shortcut: '2',
      isActive: activeTool === 'shape' && shape === 'rectangle',
      onClick() {
        setActiveTool('shape');
        setShape('rectangle');
      },
      properties() {
        return (
          <div className="flex flex-row justify-between gap-2">
            <span>Colour</span>
            <input
              type="color"
              value={shapeColour}
              onChange={(e) => {
                setShapeColour(e.target.value);
              }}
            />
          </div>
        );
      },
    },
    // @TODO: Implement triangle and line tools
    // {
    //   name: 'triangle',
    //   icon: <TriangleIcon />,
    //   description: 'Select the triangle tool',
    //   shortcut: '3',
    //   isActive: activeTool === 'shape' && shape === 'triangle',
    //   onClick() {
    //     setActiveTool('shape');
    //     setShape('triangle');
    //   },
    // },
    {
      name: 'circle',
      icon: <CircleIcon />,
      helpText: 'Click and drag to draw a circle',
      shortcut: '4',
      isActive: activeTool === 'shape' && shape === 'circle',
      onClick() {
        setActiveTool('shape');
        setShape('circle');
      },
      properties() {
        return (
          <div className="flex flex-row justify-between gap-2">
            <span>Colour</span>
            <input
              type="color"
              value={shapeColour}
              onChange={(e) => {
                setShapeColour(e.target.value);
              }}
            />
          </div>
        );
      },
    },
    // {
    //   name: 'line',
    //   icon: <LineIcon />,
    //   description: 'Select the line tool',
    //   shortcut: '6',
    //   isActive: activeTool === 'shape' && shape === 'line',
    //   onClick() {
    //     setActiveTool('shape');
    //     setShape('line');
    //   },
    // },
    {
      name: 'brush',
      icon: <PencilIcon />,
      helpText: 'Click and drag to draw on the canvas',
      shortcut: '7',
      isActive: activeTool === 'brush',
      onClick() {
        setActiveTool('brush');
      },
      properties() {
        return (
          <div className="flex flex-row justify-between gap-2">
            <span>Colour</span>
            <input
              type="color"
              value={brushColour}
              onChange={(e) => {
                setBrushColour(e.target.value);
              }}
            />
          </div>
        );
      },
    },
    // {
    //   name: 'text',
    //   icon: <TextIcon />,
    //   helpText: 'Click to add text to the canvas',
    //   shortcut: '8',
    //   isActive: activeTool === 'text',
    //   onClick() {
    //     setActiveTool('text');
    //   },
    // },
    {
      name: 'image',
      icon: <ImageIcon />,
      helpText: 'Click to add an image to the canvas',
      shortcut: '9',
      isActive: activeTool === 'image',
      onClick() {
        // Clear the selected items
        selectedItemsRef.current.clear();

        // Open file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';

        // If the user selects an image, add it to the canvas
        input.onchange = (inputEvent) => {
          const files = (inputEvent.target as HTMLInputElement).files ?? [];
          if (files.length === 0) return;

          // Add each image to the canvas
          for (const file of files) {
            const fileIndex = [...files].indexOf(file);
            const reader = new FileReader();
            reader.onload = (fileReaderEvent) => {
              const image = new globalThis.Image();
              image.src = fileReaderEvent.target?.result as string;
              image.onload = () => {
                const item = new Image({
                  id: crypto.randomUUID(),
                  // Offset the image a little from each other using the index
                  x: mousePositionRef.current.x - image.width / 2 + fileIndex * 10,
                  y: mousePositionRef.current.y - image.height / 2 + fileIndex * 10,
                  width: image.width,
                  height: image.height,
                  rotation: 0,
                  zIndex: 0,
                  canvas: null,
                  image,
                  effects: [],
                });

                // Add the new item to the layer
                layers[layers.findIndex((layer) => layer.id === selectedLayer)].items.push(item);

                // Mark the item as selected
                selectedItemsRef.current.add(item.id);

                // Remove the input from the DOM
                input.remove();

                // Switch to the move tool
                setActiveTool('move');
              };
            };
            reader.readAsDataURL(file);
          }
        };

        // Trigger the file picker
        input.click();
      },
      // @TODO: Implement erase tool
      // {
      //   name: 'erase',
      //   icon: <EraserIcon />,
      //   description: 'Select the erase tool',
      //   shortcut: '0',
      //   isActive: activeTool === 'erase',
      //   onClick() {
      //     setActiveTool('erase');
      //   },
      // },
    },
  ];

  // Render canvas on the client
  return (
    <>
      {layers.length >= 1 && (
        <RenderMenu
          showDebug={showDebug}
          layers={layers}
          selectedLayer={selectedLayer}
          onLayerUpdate={onLayerUpdate}
          selectedItemsRef={selectedItemsRef}
        />
      )}
      <CommandMenu commands={commands} />
      {showDebug && <FPSStats />}
      <Dropzone
        hoverChildren={
          // Show the image as a preview when dragging
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-50 dark:bg-black dark:bg-opacity-50">
            <p>Drop the image here</p>
          </div>
        }
        onImageDrop={onImageDrop}
      >
        <Canvas
          canvasRef={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />
      </Dropzone>
      {layers.length >= 1 && (
        <Tools
          className="z-10"
          tools={tools}
          activeTool={activeTool}
          onToolChange={(tool) => {
            onToolChange(tool);
          }}
        />
      )}
      <Layers
        className="z-10"
        layers={layers}
        selectedLayer={selectedLayer}
        onLayerSelect={onLayerSelect}
        onLayerCreate={onLayerCreate}
        onLayerUpdate={onLayerUpdate}
        onLayerDelete={onLayerDelete}
        onLayerReorder={onLayerReorder}
      />
    </>
  );
};

const useCanvasZooming = () => {
  const scaleRef = useRef(1);

  // If im using a mouse wheel allow me to zoom in and out while holding ctrl
  // If im using a trackpad allow me to zoom in and out via pinch to zoom
  // If im using a touch screen allow me to zoom in and out via pinch to zoom

  // Zoom in and out using the mouse wheel
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // If the canvas isnt focused ignore the event
      if (!isCanvasInFocus()) return;

      // If the user is holding ctrl allow them to zoom in and out
      if (e.ctrlKey) {
        e.preventDefault();

        // Get the current scale
        const scale = scaleRef.current;

        // Calculate the new scale
        const newScale = scale - e.deltaY * 0.01;

        // Clamp the scale
        scaleRef.current = Math.min(Math.max(newScale, 0.1), 10);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Zoom in and out using pinch to zoom
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      // If the canvas isnt focused ignore the event
      if (!isCanvasInFocus()) return;

      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const initialScale = scaleRef.current;

        const onTouchMove = (e: TouchEvent) => {
          if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const newDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
            const newScale = initialScale - (distance - newDistance) * 0.01;
            scaleRef.current = Math.min(Math.max(newScale, 0.1), 10);
          }
        };

        const onTouchEnd = () => {
          window.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('touchend', onTouchEnd);
        };

        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);
      }
    };
    window.addEventListener('touchstart', onTouchStart);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  return scaleRef;
};
