import { useState } from 'react';

type DropzoneProps = {
  children: React.ReactNode;
  hoverChildren: React.ReactNode;
  onImageDrop: (image: HTMLImageElement) => void;
};

export const FullscreenDropzone = ({ children, hoverChildren, onImageDrop }: DropzoneProps) => {
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
