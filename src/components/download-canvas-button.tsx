'use client';
import { DownloadCanvasButtonProps } from './screenshot-tool';

/**
 * User can download the canvas as a PNG file
 */
export const DownloadCanvasButton = ({ canvasRef }: DownloadCanvasButtonProps) => {
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
