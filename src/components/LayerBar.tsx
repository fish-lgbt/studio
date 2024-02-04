'use client';
import { Button } from './button';
import { EyeClosedIcon } from './EyeClosedIcon';
import { EyeOpenIcon } from './EyeOpenIcon';
import { Layer } from './beta';
import { cn } from '@/cn';
import { TrashCanIcon } from './TrashCanIcon';

type LayerBarProps = {
  layer: Layer;
  selectedLayer: number | null;
  onLayerSelect: (id: number) => void;
  onLayerUpdate: (layer: Layer) => void;
  onLayerDelete: (id: number) => void;
};
export const LayerBar = ({ layer, selectedLayer, onLayerUpdate, onLayerSelect, onLayerDelete }: LayerBarProps) => {
  return (
    <div
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
      <div className="w-full">
        <div className="overflow-y-hidden text-sm">{layer.name}</div>
      </div>
      <Button
        className="aspect-square"
        onClick={() => {
          onLayerDelete(layer.id);
        }}
      >
        <TrashCanIcon />
      </Button>
    </div>
  );
};
