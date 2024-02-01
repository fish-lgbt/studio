import { useRef, useEffect } from 'react';

export const useCanvasPanning = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const translatePos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startDragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (event: MouseEvent) => {
      // Middle mouse button is pressed
      if (event.button === 1) {
        isDragging.current = true;
        startDragOffset.current = {
          x: event.clientX - translatePos.current.x,
          y: event.clientY - translatePos.current.y,
        };
        event.preventDefault(); // Prevent the default middle mouse button behavior
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaMode === 0) {
        // This is often (but not always) indicative of a trackpad
        const dx = translatePos.current.x - event.deltaX;
        const dy = translatePos.current.y - event.deltaY;
        translatePos.current = { x: dx, y: dy };
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      // Only move if the middle mouse button is being dragged
      if (isDragging.current) {
        const dx = event.clientX - startDragOffset.current.x;
        const dy = event.clientY - startDragOffset.current.y;
        translatePos.current = { x: dx, y: dy };
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      isDragging.current = false;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        isDragging.current = true;
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        startDragOffset.current = {
          x: midX - translatePos.current.x,
          y: midY - translatePos.current.y,
        };
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isDragging.current && event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const midX = (touch1.clientX + touch2.clientX) / 2;
        const midY = (touch1.clientY + touch2.clientY) / 2;
        const dx = midX - startDragOffset.current.x;
        const dy = midY - startDragOffset.current.y;
        translatePos.current = { x: dx, y: dy };
      }
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvasRef]);

  return {
    translatePos,
  };
};
