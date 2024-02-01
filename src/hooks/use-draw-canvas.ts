import { useEffect } from 'react';

export const useDrawCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>, draw: () => void) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Start the animation loop
    const animate = () => {
      draw();
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [canvasRef, draw]);
};
