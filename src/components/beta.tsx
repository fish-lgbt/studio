'use client';

import { useCanvasPanning } from '@/hooks/use-canvas-panning';
import { useDrawCanvas } from '@/hooks/use-draw-canvas';
import { useResizeWindow } from '@/hooks/use-resize-window';
import { useEffect, useRef, useState } from 'react';
import FPSStats from 'react-fps-stats';
import { Position } from '@/common/position';
import { Item } from './item';
import { Layers } from './Layers';
import { Button } from './button';
import { SlideyBoi } from './slidey-boi';
import { cn } from '@/cn';
import { Point } from '@/common/point';
import { CommandMenu } from './command-menu';
import { TrashCanIcon } from './TrashCanIcon';

export type Layer = {
  id: number;
  name: string;
  visible: boolean;
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
  activeTool: (typeof tools)[number];
  brushSize: number;
  brushColour: string;
  mousePos: Position;
  brushPoints: Point[];
  selectedItem: Item | null;
  showDebug: boolean;
  showSafezone: boolean;
};

const cachedRenderedCanvases = new Map<string, HTMLCanvasElement>();
const lastknownSafezone = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
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
    selectedItem,
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

  const viewport = {
    x: -translatePos.x / scale,
    y: -translatePos.y / scale,
    width: window.innerWidth / scale,
    height: window.innerHeight / scale,
  };

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
    lastknownSafezone.height !== safezone.height
  ) {
    console.log('Rendering safezone canvas');

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

    // Draw the safezone
    if (showSafezone) {
      // Fill safezone with a "transparent" checkerboard
      const size = 20;
      for (let x = 0; x < safezone.width; x += size) {
        for (let y = 0; y < safezone.height; y += size) {
          safezoneCtx.fillStyle = (x + y) % (size * 2) === 0 ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.2)';
          safezoneCtx.fillRect(x, y, size, size);
        }
      }
    }

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

    // Cache the safezone canvas
    cachedRenderedCanvases.set('safezone', safezoneCanvas);
  }

  // Draw the safezone canvas
  ctx.drawImage(cachedRenderedCanvases.get('safezone')!, 0, 0);

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

  // Render all the layers
  for (const layer of layers.filter((layer) => layer.visible)) {
    // Only render items that are within the viewport
    const itemsWithinViewport = layer.items.filter((item) => item.isWithinPosition(viewport));

    // Render the items
    for (const item of itemsWithinViewport) {
      // Render the item
      item.render(ctx, translatePos, scale);

      // If the item is selected render a border and handles
      if (selectedItem) {
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
  if (activeTool === 'draw') {
    if (brushSize >= 1) {
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, brushSize / 2, 0, 2 * Math.PI);
      ctx.fillStyle = brushColour;
      ctx.fill();
    }
  }
};

const tools = ['select', 'move', 'draw', 'erase'] as const;

type ToolsProps = {
  className?: string;

  activeTool: (typeof tools)[number];
  onToolChange: (tool: (typeof tools)[number]) => void;

  brushSize: number;
  onBrushSizeChange: (size: number) => void;

  brushColour: string;
  onBrushColourChange: (colour: string) => void;
};

const Tools = ({
  className,
  activeTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  brushColour,
  onBrushColourChange,
}: ToolsProps) => {
  return (
    <div className={cn('fixed bottom-1 left-1 bg-white dark:bg-[#181818] border border-[#14141414] rounded p-2', className)}>
      <div className="flex flex-col gap-2">
        {(activeTool === 'draw' || activeTool === 'erase') && (
          <div className="flex flex-col gap-2">
            <SlideyBoi
              label="Brush Size"
              type="range"
              min={1}
              max={200}
              value={brushSize}
              onChange={(e) => {
                onBrushSizeChange(Number(e.target.value));
              }}
            />
            <div className="flex justify-between gap-2">
              <label htmlFor="background-colour">Background Colour</label>
              <input
                id="background-colour"
                type="color"
                value={brushColour}
                onChange={(event) => onBrushColourChange(event.target.value)}
                className="border border-gray-200 rounded-md"
              />
            </div>
          </div>
        )}
        <div className="flex flex-row gap-2">
          {tools.map((tool) => (
            <Button key={tool} onClick={() => onToolChange(tool)} active={activeTool === tool}>
              {tool}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

type CanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
};

const Canvas = ({ canvasRef, onMouseDown, onMouseMove, onMouseUp }: CanvasProps) => (
  <canvas
    className="z-0"
    ref={canvasRef}
    width={window.innerWidth}
    height={window.innerHeight}
    onMouseDown={onMouseDown}
    onMouseMove={onMouseMove}
    onMouseUp={onMouseUp}
  />
);

const RenderMenu = ({ layers }: { layers: Layer[] }) => {
  const onClick = () => {
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
        activeTool: 'select',
        brushSize: 1,
        brushColour: 'black',
        mousePos: { x: 0, y: 0 },
        brushPoints: [],
        selectedItem: null,
        showDebug: false,
        showSafezone: false,
      },
      0,
    );

    const a = document.createElement('a');
    a.href = canvas.toDataURL();
    a.download = 'render.png';
    a.click();
  };

  return (
    <div className="fixed top-1 right-1 bg-white dark:bg-[#181818] border border-[#14141414] rounded p-2 z-10">
      <Button onClick={onClick}>Download</Button>
    </div>
  );
};

export const ShowcaseStudio = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useCanvasZooming(canvasRef);
  const translatePosRef = useCanvasPanning(canvasRef);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<(typeof tools)[number]>('select');
  const [brushSize, setBrushSize] = useState(10);
  const [brushColour, setBrushColour] = useState('black');
  const [showDebug, setShowDebug] = useState(false);
  const [showSafezone, setShowSafezone] = useState(true);

  const isDraggingRef = useRef(false);
  const mousePositionRef = useRef<Position>({ x: 0, y: 0 });
  const drawingPointsRef = useRef<Point[]>([]);
  const selectedItemRef = useRef<Item | null>(null);
  const delta = useRef(0);

  // Reset delta on re-render
  useEffect(() => {
    delta.current = 0;
  }, []);

  // Track mouse position
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

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
        selectedItem: selectedItemRef.current,
        showDebug: showDebug,
        showSafezone: showSafezone,
      },
      delta.current++,
    );
  });

  // Don't render canvas on the server
  if (typeof window === 'undefined') return null;

  const onLayerSelect = (id: number) => {
    setSelectedLayer(id);
  };

  const onLayerCreate = () => {
    setLayers((prev) => [
      ...prev,
      {
        id: prev.length,
        name: `Layer ${prev.length}`,
        visible: true,
        items: [],
      },
    ]);
  };

  const onLayerUpdate = (layer: Layer) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === layer.id);
      const newLayers = [...prev];
      newLayers[index] = layer;
      return newLayers;
    });
  };

  const onLayerDelete = (id: number) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== id));
  };

  const onLayerReorder = (layers: Layer[]) => {
    setLayers(layers);
  };

  const onToolChange = (tool: (typeof tools)[number]) => {
    setActiveTool(tool);
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const layer = layers[selectedLayer];
    if (!layer) {
      // Create a new layer
      onLayerCreate();
    }

    if (activeTool === 'select') {
      const layer = layers[selectedLayer];
      const item = layer.items.find((item) =>
        item.isWithinPosition({
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY,
          width: 0,
          height: 0,
        }),
      );
      if (item) {
        selectedItemRef.current = item;
      }
    }

    if (activeTool === 'erase' || activeTool === 'draw') {
      // Only activate on left click
      if (e.button !== 0) return;
      isDraggingRef.current = true;
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const layer = layers[selectedLayer];
    if (!layer) return;

    // Transform mouse coordinates to canvas space
    const mouseX = e.nativeEvent.offsetX / scaleRef.current - translatePosRef.current.x / scaleRef.current;
    const mouseY = e.nativeEvent.offsetY / scaleRef.current - translatePosRef.current.y / scaleRef.current;

    // Save the drawing points
    if (activeTool === 'draw' && isDraggingRef.current) {
      drawingPointsRef.current.push({ x: mouseX, y: mouseY, colour: `hsl(${(delta.current * 10) % 360}, 100%, 50%)` });
    }

    // Move the item
    if (activeTool === 'move' && selectedItemRef.current) {
      setLayers((prev) => {
        const newLayers = [...prev];
        const item = newLayers[selectedLayer].items.find((item) => item.id === selectedItemRef.current?.id);
        if (item) {
          item.move(mouseX, mouseY);
        }
        return newLayers;
      });
    }
  };

  const onMouseUp = () => {
    const layer = layers[selectedLayer];
    if (!layer) return;

    if (activeTool === 'draw') {
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

      // Create a new item
      const item = new Item({
        id: layer.items.length,
        x,
        y,
        width,
        height,
        rotation: 0,
        zIndex: 0,
        canvas,
      });

      // Add the new item to the layer
      setLayers((prev) => {
        const newLayers = [...prev];
        newLayers[selectedLayer].items.push(item);
        return newLayers;
      });

      // Clear the drawing points
      drawingPointsRef.current = [];
    }
  };

  const onBrushSizeChange = (size: number) => {
    setBrushSize(size);
  };

  const onBrushColourChange = (colour: string) => {
    setBrushColour(colour);
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
      name: 'Select tool',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="w-4 h-4 fill-black dark:fill-white"
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M3.357 3.234a1 1 0 011.103-.122l16.325 8.455a1 1 0 01-.148 1.838l-6.854 2.254-3.41 6.359a1 1 0 01-1.836-.174L3.046 4.3a1 1 0 01.311-1.065zm2.314 2.758l4.064 12.983 2.474-4.614a1 1 0 01.57-.478l4.973-1.635-12.08-6.256z"
            clipRule="evenodd"
          />
        </svg>
      ),
      description: 'Select the select tool',
      action: () => {
        onToolChange('select');
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
      name: 'Draw tool',
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
        onToolChange('draw');
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

  // Render canvas on the client
  return (
    <>
      <RenderMenu layers={layers} />
      <CommandMenu commands={commands} />
      <FPSStats />
      <Canvas canvasRef={canvasRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} />
      <Tools
        className="z-10"
        activeTool={activeTool}
        onToolChange={(tool) => {
          onToolChange(tool as (typeof tools)[number]);
        }}
        brushSize={brushSize}
        onBrushSizeChange={onBrushSizeChange}
        brushColour={brushColour}
        onBrushColourChange={onBrushColourChange}
      />
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

const useCanvasZooming = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const scaleRef = useRef(1);
  return scaleRef;
};
