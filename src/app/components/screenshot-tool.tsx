'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type DropzoneProps = {
  onDrop: (acceptedFiles: File[]) => void;
};

/**
 * User can drag and drop an image to the canvas
 */
const Dropzone = ({ onDrop }: DropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className="border-dashed border-4 border-gray-200 rounded-lg p-4 cursor-pointer text-center hover:border-gray-300"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-gray-500">Drop the files here ...</p>
      ) : (
        <p className="text-gray-500">{"Drag 'n' drop some files here, or click to select files"}</p>
      )}
    </div>
  );
};

type DownloadCanvasButtonProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

/**
 * User can download the canvas as a PNG file
 */
const DownloadCanvasButton = ({ canvasRef }: DownloadCanvasButtonProps) => {
  const handleDownload = () => {
    if (canvasRef.current) {
      const image = canvasRef.current.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const link = document.createElement('a');
      link.download = 'canvas-image.png';
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <button onClick={handleDownload} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Download PNG
    </button>
  );
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
  canvas: HTMLCanvasElement,
  image: CanvasImageSource | null,
  position: Coordinates,
  /**
   * Default background colour is white
   */
  backgroundColor: string = '#FFFFFF',
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

type BackgroundColourPickerProps = {
  backgroundColour: string;
  onChangeBackgroundColour: (color: string) => void;
};

const BackgroundColourPicker = ({ backgroundColour, onChangeBackgroundColour }: BackgroundColourPickerProps) => {
  return (
    <div className="absolute top-0 left-0 p-2">
      <div className="flex items-center gap-2">
        <label htmlFor="background-colour">Background Colour</label>
        <input
          id="background-colour"
          type="color"
          value={backgroundColour}
          onChange={(event) => onChangeBackgroundColour(event.target.value)}
          className="border border-gray-200 rounded-md"
        />
      </div>
    </div>
  );
};

export const ScreenshotTool = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backgroundColour, setBackgroundColour] = useState('#FFFFFF');
  const [image, setImage] = useState<CanvasImageSource | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef<Coordinates>({ x: 0, y: 0 });
  const position = useRef<Coordinates>({ x: 0, y: 0 });

  const handleChangeBackground = (color: string) => {
    setBackgroundColour(color);
  };

  const onDrop = useCallback((file: File[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    loadImage(URL.createObjectURL(file[0])).then((loadedImage) => {
      setImage(loadedImage);
      position.current = { x: (canvas.width - loadedImage.width) / 2, y: (canvas.height - loadedImage.height) / 2 };
      draw(canvas, loadedImage, position.current);
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

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
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

        // Redraw the canvas with the new image position
        draw(canvasRef.current, image, position.current);
      }
    },
    [image],
  );

  // Reset the dragging flag when the mouse is released
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Redraw the canvas when the image or background changes
  useEffect(() => {
    if (!canvasRef.current) return;
    draw(canvasRef.current, image, position.current, backgroundColour);
  }, [image, backgroundColour]);

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
