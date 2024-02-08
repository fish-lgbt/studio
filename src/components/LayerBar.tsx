/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from './button';
import { EyeClosedIcon } from './EyeClosedIcon';
import { EyeOpenIcon } from './EyeOpenIcon';
import { Layer, cachedRenderedCanvases } from './beta';
import { cn } from '@/cn';
import { Item } from './item';

const LockIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 stroke-black dark:stroke-white">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 14.5v2m-5-6.471C7.471 10 8.053 10 8.8 10h6.4c.747 0 1.329 0 1.8.029m-10 0c-.588.036-1.006.117-1.362.298a3 3 0 00-1.311 1.311C4 12.28 4 13.12 4 14.8v1.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C6.28 21 7.12 21 8.8 21h6.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C20 18.72 20 17.88 20 16.2v-1.4c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311c-.356-.181-.774-.262-1.362-.298m-10 0V8a5 5 0 0110 0v2.029"
      />
    </svg>
  );
};

const UnlockIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 stroke-black dark:stroke-white">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16.584 6A5.001 5.001 0 007 8v2.029m5 4.471v2m-5-6.471C7.471 10 8.053 10 8.8 10h6.4c1.68 0 2.52 0 3.162.327a3 3 0 011.311 1.311C20 12.28 20 13.12 20 14.8v1.4c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C17.72 21 16.88 21 15.2 21H8.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C4 18.72 4 17.88 4 16.2v-1.4c0-1.68 0-2.52.327-3.162a3 3 0 011.311-1.311c.356-.181.774-.262 1.362-.298z"
      />
    </svg>
  );
};

type LayerBarProps = {
  layer: Layer;
  selectedLayer: string | null;
  onLayerSelect: (id: string | null) => void;
  onLayerUpdate: (layer: Layer) => void;
  onLayerDelete: (id: string | null) => void;
};
export const LayerBar = ({ layer, selectedLayer, onLayerUpdate, onLayerSelect, onLayerDelete }: LayerBarProps) => {
  return (
    <div
      key={layer.id}
      className={cn('flex flex-row w-full justify-between bg-[#f1f1f3] dark:bg-[#0e0e0e] p-2 gap-2', {
        'border-l-4 border-[#dadada]': selectedLayer === layer.id,
      })}
      onClick={() => onLayerSelect(layer.id)}
    >
      <Button
        className="aspect-square"
        onClick={() => {
          onLayerUpdate({
            ...layer,
            visible: !layer.visible,
          });
        }}
      >
        {layer.visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </Button>
      <div className="w-full max-h-56 overflow-y-scroll">
        <div className="overflow-y-hidden text-sm">{layer.name}</div>
        <Items items={layer.items} />
      </div>
      <Button
        className="aspect-square"
        onClick={() => {
          onLayerUpdate({
            ...layer,
            locked: !layer.locked,
          });
        }}
      >
        {layer.locked ? <LockIcon /> : <UnlockIcon />}
      </Button>
    </div>
  );
};

type ItemsProps = {
  items: Item[];
};

const Items = ({ items }: ItemsProps) => {
  return (
    <div className="flex flex-col gap-1">
      {/* {items.map((item) => {
        try {
          const existingCanvas = cachedRenderedCanvases.get(item.id);
          if (!existingCanvas) {
            const canvas = document.createElement('canvas');
            canvas.width = item.width + 20;
            canvas.height = item.height + 20;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Fill the background with white
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Render a "transparent" background
            const safezoneCanvas = cachedRenderedCanvases.get('safezone');
            if (safezoneCanvas) ctx.drawImage(safezoneCanvas, 0, 0, safezoneCanvas.width, safezoneCanvas.height);

            // Render the item to its canvas
            item.render(ctx, { x: -item.x + 10, y: -item.y + 10 }, 1);

            // Cache the canvas
            cachedRenderedCanvases.set(item.id, canvas);
          }

          // Convert the canvas to an image
          const image = cachedRenderedCanvases.get(item.id)?.toDataURL();

          return (
            <div key={`item-${item.width}`} className="bg-[#dadada] dark:bg-[#3a3a3a] rounded aspect-square">
              <img src={image} alt="" className="w-full h-full" />
            </div>
          );
        } catch {
          return 'Oops';
        }
      })} */}
    </div>
  );
};
