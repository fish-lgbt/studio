'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dropzone } from './dropzone';
import { DownloadCanvasButton } from './download-canvas-button';
import { BackgroundColourPicker } from './background-colour-picker';
import { RenderPipeline } from './modify-image-or-canvas';

export type DropzoneProps = {
  onDrop: (acceptedFiles: File[]) => void;
};

export type DownloadCanvasButtonProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

type Coordinates = {
  x: number;
  y: number;
};

// Function to generate a random but aesthetically pleasing color
const generateColor = () => {
  const hues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]; // Hue values for pleasing colors
  const hue = hues[Math.floor(Math.random() * hues.length)];
  const saturation = 70 + Math.random() * 30; // Higher saturation for more vivid color
  const lightness = 40 + Math.random() * 20; // Lightness in a middle range for balance
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

type DrawParams = {
  canvas: HTMLCanvasElement | null;
  image: HTMLImageElement | null;
  scale: number;
  position: Coordinates;
  shadowBlur: number;
  colourStops: string[] | null;
  shadowColour: string | null;
  backgroundColour: string | null;
  colourOrGradient: 'colour' | 'gradient';
  cornerRadius: number;
  frameColour: string | null;
  pattern: 'grid' | 'dot' | 'both' | null;
};

function drawGridPattern(canvas: HTMLCanvasElement, gridSize: number, color: string = '#000'): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.beginPath();
  ctx.strokeStyle = color;

  // Draw vertical lines
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }

  // Draw horizontal lines
  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }

  ctx.stroke();
}

const drawDotPattern = (canvas: HTMLCanvasElement, dotSize: number, colour: string = '#000'): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.beginPath();
  ctx.fillStyle = colour;

  // Draw circles at every 50px
  for (let x = 0; x <= canvas.width; x += 50) {
    for (let y = 0; y <= canvas.height; y += 50) {
      ctx.moveTo(x, y);
      ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
    }
  }

  ctx.fill();
};

const draw = ({
  canvas,
  image,
  position,
  shadowBlur,
  scale,
  colourStops,
  shadowColour,
  backgroundColour,
  colourOrGradient,
  cornerRadius,
  frameColour,
  pattern,
}: DrawParams) => {
  const ctx = canvas?.getContext('2d');

  // Do nothing unless we're ready
  if (!canvas || !ctx) return;

  // Clear the main canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Add a background to the main canvas
  const canvasWithBackground = new RenderPipeline(canvas, [
    {
      backgroundColour: colourOrGradient === 'colour' ? backgroundColour : undefined,
      colourStops: colourOrGradient === 'gradient' ? colourStops : undefined,
    },
  ]).render();

  // Draw the updated canvas to the main canvas
  ctx.drawImage(canvasWithBackground, 0, 0, canvas.width, canvas.height);

  // Draw the pattern to the main canvas
  if (pattern === 'grid' || pattern === 'both') drawGridPattern(canvas, 20, 'rgba(255, 255, 255, 0.5)');
  if (pattern === 'dot' || pattern === 'both') drawDotPattern(canvas, 5, 'rgba(255, 255, 255, 0.5)');

  // Stop here if there's no image
  if (!image) return;

  // Process the image
  const processedImage = new RenderPipeline(image, [
    {
      cornerRadius,
    },
    ...(frameColour
      ? [
          {
            padding: 10,
            backgroundColour: frameColour === '#FFFFFF' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            cornerRadius,
          },
        ]
      : []),
  ]).render();

  // Setting shadow on the main canvas
  if (shadowColour && shadowBlur) {
    ctx.shadowColor = shadowColour;
    ctx.shadowBlur = shadowBlur;
  }
  // Calculate the aspect ratio of the image
  const imageAspectRatio = image.width / image.height;

  // Calculate the desired scale factor from the user's scale input
  const desiredScaleFactor = scale / 100;

  // Initially apply the scale to the width
  let scaledImageWidth = image.width * desiredScaleFactor;
  // Calculate the height based on the scaled width to maintain the aspect ratio
  let scaledImageHeight = scaledImageWidth / imageAspectRatio;

  // Check if the scaled dimensions exceed the canvas size
  if (scaledImageWidth > canvas.width || scaledImageHeight > canvas.height) {
    // Determine the maximum scale factor that fits the canvas while maintaining the aspect ratio
    const widthScaleFactor = canvas.width / image.width;
    const heightScaleFactor = canvas.height / image.height;
    const scaleFactorToFitCanvas = Math.min(widthScaleFactor, heightScaleFactor);

    // Apply this scale factor to both dimensions
    scaledImageWidth = image.width * scaleFactorToFitCanvas;
    scaledImageHeight = image.height * scaleFactorToFitCanvas;
  }

  // Clamp the image position to the canvas
  position.x = Math.min(Math.max(position.x, 0), canvas.width - scaledImageWidth);
  position.y = Math.min(Math.max(position.y, 0), canvas.height - scaledImageHeight);

  // Draw the processed image to the main canvas
  ctx.drawImage(processedImage, position.x, position.y, scaledImageWidth, scaledImageHeight);
};

export type BackgroundColourPickerProps = {
  backgroundColour: string;
  onChangeBackgroundColour: (color: string) => void;
};

const hslToRgb = (h: number, s: number, l: number) => {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hslToHex = (value: string) => {
  if (!value.startsWith('hsl')) return value;
  const [h, s, l] = value
    .replace('hsl(', '')
    .replace(')', '')
    .split(',')
    .map((value) => Number(value.replace('%', '').trim()));

  return hslToRgb(h / 360, s / 100, l / 100);
};

const GradientPicker = ({
  colourStops,
  onChange,
}: {
  colourStops: string[] | null;
  onChange: (colourStops: string[]) => void;
}) => {
  if (!colourStops) return null;
  return (
    <div className="flex flex-row gap-2">
      <label htmlFor="gradient-picker">Gradient</label>
      {colourStops.map((colourStop, index) => (
        <input
          key={index}
          id={`gradient-picker-${index}`}
          type="color"
          value={hslToHex(colourStop)}
          onChange={(event) => {
            onChange(
              colourStops.map((colourStop, colourStopIndex) => {
                if (colourStopIndex === index) {
                  return event.target.value;
                }
                return colourStop;
              }),
            );
          }}
        />
      ))}
    </div>
  );
};

const canvasRatioToSize = (ratio: '16:9' | '4:3' | '1:1') => {
  if (ratio === '16:9') {
    return { width: 1920, height: 1080 };
  }

  if (ratio === '4:3') {
    return { width: 1920, height: 1440 };
  }

  if (ratio === '1:1') {
    return { width: 1080, height: 1080 };
  }

  return null;
};

const centerImage = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  image: HTMLImageElement,
  scale: number,
  position: React.MutableRefObject<Coordinates>,
) => {
  if (!canvasRef.current || !image) return;
  // Take scaling into account
  const scaledImageWidth = Math.min(image.width * (scale / 100), canvasRef.current.width);
  const scaledImageHeight = Math.min(image.height * (scale / 100), canvasRef.current.height);
  position.current = {
    x: (canvasRef.current.width - scaledImageWidth) / 2,
    y: (canvasRef.current.height - scaledImageHeight) / 2,
  };
};

export const ScreenshotTool = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backgroundColour, setBackgroundColour] = useState('#1E40AF');
  const [colourStops, setColourStops] = useState<string[] | null>(null);
  const [shadowColour, setShadowColour] = useState('#000000');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [shadowScale, setShadowScale] = useState(20);
  const [scale, setScale] = useState(50);
  const isDragging = useRef(false);
  const dragStart = useRef<Coordinates>({ x: 0, y: 0 });
  const position = useRef<Coordinates>({ x: 0, y: 0 });
  const requestRef = useRef<number | null>(null);
  const [colourOrGradient, setColourOrGradient] = useState<'colour' | 'gradient'>('gradient');
  const [showDropzone, setShowDropzone] = useState(false);
  const [cornerRadius, setCornerRadius] = useState(20);
  const [canvasRatio, setCanvasRatio] = useState<'16:9' | '4:3' | '1:1'>('16:9');
  const [frameColour, setFrameColour] = useState<string>('#FFFFFF');
  const [autoCenter, setAutoCenter] = useState(true);
  const [pattern, setPattern] = useState<'grid' | 'dot' | 'both' | null>('both');

  useEffect(() => {
    const newColourStops = Array.from({ length: 3 }, () => generateColor());
    setColourStops(newColourStops);
  }, []);

  const handleChangeBackground = (color: string) => {
    setBackgroundColour(color);
  };

  const onDrop = useCallback(
    (file: File[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      loadImage(URL.createObjectURL(file[0])).then((loadedImage) => {
        setImage(loadedImage);
        centerImage(canvasRef, loadedImage, scale, position);
      });
    },
    [scale],
  );

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    if (canvasRef.current) {
      // Get the displayed size of the canvas
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate the scaling factors based on the canvas size and displayed size
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      // Adjust the initial drag position to account for the scaling
      // This calculates the "true" starting point considering the canvas scaling
      dragStart.current = {
        x: (event.touches[0].clientX - rect.left) * scaleX - position.current.x,
        y: (event.touches[0].clientY - rect.top) * scaleY - position.current.y,
      };

      // Set the dragging flag
      isDragging.current = true;

      // Stop auto centering
      setAutoCenter(false);
    }
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    if (isDragging.current && canvasRef.current) {
      // Get the displayed size of the canvas
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate the scaling factors
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      // Adjust the mouse coordinates with the scaling factor
      // Note: `clientX` and `clientY` are the mouse positions from the event
      const adjustedX = (event.touches[0].clientX - rect.left) * scaleX - dragStart.current.x;
      const adjustedY = (event.touches[0].clientY - rect.top) * scaleY - dragStart.current.y;

      // Update the position taking into account the scaling
      position.current = { x: adjustedX, y: adjustedY };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (canvasRef.current) {
      // Get the displayed size of the canvas
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate the scaling factors based on the canvas size and displayed size
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      // Adjust the initial drag position to account for the scaling
      // This calculates the "true" starting point considering the canvas scaling
      dragStart.current = {
        x: (event.clientX - rect.left) * scaleX - position.current.x,
        y: (event.clientY - rect.top) * scaleY - position.current.y,
      };

      // Set the dragging flag
      isDragging.current = true;

      // Stop auto centering
      setAutoCenter(false);
    }
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging.current && canvasRef.current) {
      // Get the displayed size of the canvas
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate the scaling factors
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      // Adjust the mouse coordinates with the scaling factor
      // Note: `clientX` and `clientY` are the mouse positions from the event
      const adjustedX = (event.clientX - rect.left) * scaleX - dragStart.current.x;
      const adjustedY = (event.clientY - rect.top) * scaleY - dragStart.current.y;

      // Update the position taking into account the scaling
      position.current = { x: adjustedX, y: adjustedY };
    }
  }, []);

  // Reset the dragging flag when the mouse is released
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Redraw the canvas when anything changes
  useEffect(() => {
    const redraw = (_delta: number) => {
      // Center the image if auto center is enabled
      if (image && autoCenter) {
        centerImage(canvasRef, image, scale, position);
      }

      draw({
        canvas: canvasRef.current,
        image,
        position: position.current,
        shadowBlur: shadowScale,
        scale,
        colourStops,
        shadowColour,
        backgroundColour,
        colourOrGradient,
        cornerRadius,
        frameColour,
        pattern,
      });
      requestRef.current = requestAnimationFrame(redraw);
    };
    requestRef.current = requestAnimationFrame(redraw);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [
    backgroundColour,
    colourStops,
    image,
    shadowScale,
    scale,
    shadowColour,
    colourOrGradient,
    cornerRadius,
    frameColour,
    canvasRef.current?.width,
    canvasRef.current?.height,
    autoCenter,
    pattern,
  ]);

  // Add event listeners for mouse up and mouse leave
  useEffect(() => {
    const handleMouseLeave = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseUp]);

  const canvasSize = canvasRatioToSize(canvasRatio);
  const canvasWidth = canvasSize?.width ?? 1920;
  const canvasHeight = canvasSize?.height ?? 1080;

  const mainCanvas = (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        maxHeight: `${canvasHeight / 2}px`,
        maxWidth: `${canvasWidth / 2}px`,
      }}
      className="border border-white"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
  // Two option boxes for colour or gradient
  const colourOrGradientToggle = (
    <div className="flex flex-row gap-2">
      <button
        className={`${
          colourOrGradient === 'colour' ? 'bg-blue-500' : 'bg-gray-500'
        } rounded-md px-4 py-2 text-white font-semibold`}
        onClick={() => setColourOrGradient('colour')}
      >
        Colour
      </button>
      <button
        className={`${
          colourOrGradient === 'gradient' ? 'bg-blue-500' : 'bg-gray-500'
        } rounded-md px-4 py-2 text-white font-semibold`}
        onClick={() => setColourOrGradient('gradient')}
      >
        Gradient
      </button>
    </div>
  );
  const randomBackgroundButton = (
    <button
      className="bg-blue-500 rounded-md px-4 py-2 text-white font-semibold"
      onClick={() => {
        const newColourStops = Array.from({ length: 3 }, () => generateColor());
        setColourStops(newColourStops);

        const newBackgroundColour = generateColor();
        setBackgroundColour(newBackgroundColour);
      }}
    >
      Random Background
    </button>
  );
  const backgroundColourPicker = (
    <BackgroundColourPicker backgroundColour={backgroundColour} onChangeBackgroundColour={handleChangeBackground} />
  );
  const gradientPicker = (
    <GradientPicker
      colourStops={colourStops}
      onChange={(newColourStops) => {
        setColourStops(newColourStops);
      }}
    />
  );
  const shadowColourPicker = (
    <div className="flex flex-row gap-2">
      <label htmlFor="shadow-colour-picker">Shadow Colour</label>
      <input
        id="shadow-colour-picker"
        type="color"
        value={shadowColour}
        onChange={(event) => setShadowColour(event.target.value)}
      />
    </div>
  );
  const shadowSizeSlider = (
    <div className="flex flex-row gap-2">
      <label htmlFor="shadow-size-slider">Shadow Size</label>
      <input
        id="shadow-size-slider"
        type="range"
        min="0"
        max="100"
        value={shadowScale}
        onChange={(event) => setShadowScale(Number(event.target.value))}
      />
    </div>
  );
  const cornerRadiusSlider = (
    <div className="flex flex-row gap-2">
      <label htmlFor="corner-radius-slider">Corner Radius</label>
      <input
        id="corner-radius-slider"
        type="range"
        min="0"
        max="50"
        value={cornerRadius}
        onChange={(event) => setCornerRadius(Number(event.target.value))}
      />
    </div>
  );
  const canvasRatioSelector = (
    <div className="flex flex-row gap-2">
      <label htmlFor="canvas-ratio-selector">Canvas Ratio</label>
      <select
        id="canvas-ratio-selector"
        value={canvasRatio}
        onChange={(event) => setCanvasRatio(event.target.value as '16:9' | '4:3' | '1:1')}
      >
        <option value="16:9">16:9</option>
        <option value="4:3">4:3</option>
        <option value="1:1">1:1</option>
      </select>
    </div>
  );
  const frameColourPicker = (
    <div className="flex flex-row gap-2">
      <label htmlFor="frame-colour-picker">Frame Colour</label>
      <select
        id="frame-colour-picker"
        value={frameColour ?? 'None'}
        onChange={(event) => setFrameColour(event.target.value)}
      >
        <option value="">None</option>
        <option value="#FFFFFF">White</option>
        <option value="#000000">Black</option>
      </select>
    </div>
  );
  const patternPicker = (
    <div className="flex flex-row gap-2">
      <label htmlFor="pattern-picker">Pattern</label>
      <select
        id="pattern-picker"
        value={pattern ?? 'None'}
        onChange={(event) => {
          if (event.target.value === '') {
            setPattern(null);
          } else {
            setPattern(event.target.value as 'grid' | 'dot' | 'both');
          }
        }}
      >
        <option value="">None</option>
        <option value="grid">Grid</option>
        <option value="dot">Dot</option>
        <option value="both">Both</option>
      </select>
    </div>
  );
  const imageSizeSlider = (
    <div className="flex flex-row gap-2">
      <label htmlFor="image-size-slider">Image Size</label>
      <input
        id="image-size-slider"
        type="range"
        min="1"
        max="100"
        value={scale}
        onChange={(event) => setScale(Number(event.target.value))}
      />
    </div>
  );
  const centerImageButton = (
    <button
      className="bg-blue-500 rounded-md px-4 py-2 text-white font-semibold"
      onClick={() => {
        if (!image) return;
        centerImage(canvasRef, image, scale, position);
        setAutoCenter(true);
      }}
    >
      Center Image
    </button>
  );
  const downloadButton = <DownloadCanvasButton canvasRef={canvasRef} />;
  const dropzone = (
    <div className="absolute">
      <Dropzone onDrop={onDrop} />
    </div>
  );

  const sidebarItems = [
    // Background colour
    colourOrGradientToggle,
    randomBackgroundButton,
    colourOrGradient === 'colour' && backgroundColourPicker,
    colourOrGradient === 'gradient' && gradientPicker,

    // Shadow
    shadowColourPicker,
    shadowSizeSlider,

    // Corner radius
    cornerRadiusSlider,

    // Canvas ratio
    canvasRatioSelector,

    // Frame colour
    frameColourPicker,

    // Pattern
    patternPicker,

    // Image position
    imageSizeSlider,
    centerImageButton,

    // Download
    downloadButton,
  ];

  const sidebar = (
    <div className="relative h-fit self-center">
      {!image && <div className="z-10 w-full h-full bg-black bg-opacity-80 absolute rounded cursor-not-allowed" />}
      <div className="p-2 bg-white border flex flex-col gap-2 h-fit rounded">
        {sidebarItems.map((item, index) => {
          if (!item) return null;
          return <div key={`item-${index}`}>{item}</div>;
        })}
      </div>
    </div>
  );

  const canShowDropzone = !image || showDropzone;

  return (
    <div
      className="flex flex-row gap-2 justify-center p-4 text-black"
      onDragEnter={() => {
        setShowDropzone(true);
      }}
      onDrop={() => {
        setShowDropzone(false);
      }}
    >
      {/* Sidebar */}
      {sidebar}
      {/* Content */}
      <div className="p-2 relative flex justify-center items-center">
        {canShowDropzone && dropzone}
        {mainCanvas}
      </div>
    </div>
  );
};
