'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dropzone } from './dropzone';
import { DownloadCanvasButton } from './download-canvas-button';
import { BackgroundColourPicker } from './background-colour-picker';

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

const draw = (
  canvas: HTMLCanvasElement | null,
  image: CanvasImageSource | null,
  position: Coordinates,
  /**
   * Default background colour is white
   */
  backgroundColor: string,
) => {
  const ctx = canvas?.getContext('2d');

  // Do nothing if the canvas is not ready
  if (!canvas || !ctx) return;

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Do nothing if the image is not ready
  if (!image) return;

  // Draw the image
  ctx.drawImage(image, position.x, position.y);
};

export type BackgroundColourPickerProps = {
  backgroundColour: string;
  onChangeBackgroundColour: (color: string) => void;
};

export const ScreenshotTool = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backgroundColour, setBackgroundColour] = useState('#FFFFFF');
  const [image, setImage] = useState<CanvasImageSource | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef<Coordinates>({ x: 0, y: 0 });
  const position = useRef<Coordinates>({ x: 0, y: 0 });
  const requestRef = useRef<number | null>(null);

  const handleChangeBackground = (color: string) => {
    setBackgroundColour(color);
  };

  const onDrop = useCallback((file: File[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    loadImage(URL.createObjectURL(file[0])).then((loadedImage) => {
      setImage(loadedImage);
      position.current = { x: (canvas.width - loadedImage.width) / 2, y: (canvas.height - loadedImage.height) / 2 };
    });
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
      draw(canvasRef.current, image, position.current, backgroundColour);
      requestRef.current = requestAnimationFrame(redraw);
    };
    requestRef.current = requestAnimationFrame(redraw);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [backgroundColour, image]);

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

  return (
    <>
      <div className="flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="h-[540px] w-[960px] border border-white"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
        <BackgroundColourPicker backgroundColour={backgroundColour} onChangeBackgroundColour={handleChangeBackground} />
        <DownloadCanvasButton canvasRef={canvasRef} />
      </div>
      <Dropzone onDrop={onDrop} />
    </>
  );
};
