'use client';
import { Button } from './button';
import { SlideyBoi } from './slidey-boi';
import { cn } from '@/cn';
import { PickyPal } from './picky-pal';

export const toolTypes = ['select', 'move', 'brush', 'erase', 'shape'] as const;
export type ToolsTypes = (typeof toolTypes)[number];
export type ToolType = ToolsTypes;

type ToolsProps = {
  className?: string;

  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;

  brushSize: number;
  onBrushSizeChange: (size: number) => void;

  brushColour: string;
  onBrushColourChange: (colour: string) => void;

  shape: 'rectangle' | 'circle' | 'triangle' | 'line';
  onShapeChange: (shape: 'rectangle' | 'circle' | 'triangle' | 'line') => void;

  shapeColour: string;
  onShapeColourChange: (colour: string) => void;
};

export const Tools = ({
  className,
  activeTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  brushColour,
  onBrushColourChange,
  shape,
  onShapeChange,
  shapeColour,
  onShapeColourChange,
}: ToolsProps) => {
  return (
    <div className={cn('absolute top-1 flex justify-center w-full', className)}>
      <div className="relative flex flex-col gap-2 w-fit  bg-white dark:bg-[#181818] border border-[#14141414] rounded p-2">
        {(activeTool === 'brush' || activeTool === 'erase') && (
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
              <label htmlFor="background-colour">Brush Colour</label>
              <input
                id="brush-colour"
                type="color"
                value={brushColour}
                onChange={(event) => onBrushColourChange(event.target.value)}
                className="border border-gray-200 rounded-md"
              />
            </div>
          </div>
        )}
        {activeTool === 'shape' && (
          <div className="flex flex-col gap-2">
            <PickyPal
              id="shape-selector"
              label="Shape"
              value={shape}
              onChange={(event) => onShapeChange(event.target.value as 'rectangle' | 'circle' | 'triangle' | 'line')}
              options={[
                {
                  key: 'rectangle',
                  value: 'rectangle',
                },
                {
                  key: 'circle',
                  value: 'circle',
                },
                {
                  key: 'triangle',
                  value: 'triangle',
                },
                {
                  key: 'line',
                  value: 'line',
                },
              ]}
            />
            <div className="flex justify-between gap-2">
              <label htmlFor="shape-colour">Shape Colour</label>
              <input
                id="shape-colour"
                type="color"
                value={shapeColour}
                onChange={(event) => onShapeColourChange(event.target.value)}
                className="border border-gray-200 rounded-md"
              />
            </div>
          </div>
        )}
        <div className="flex flex-row gap-2">
          {toolTypes.map((tool) => (
            <Button key={tool} onClick={() => onToolChange(tool)} active={activeTool === tool}>
              {tool}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
