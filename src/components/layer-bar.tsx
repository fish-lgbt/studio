/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from './button';
import { EyeClosedIcon } from './icons/eye-closed-icon';
import { EyeOpenIcon } from './icons/eye-open-icon';
import { Layer } from './studio';
import { cn } from '@/cn';
import { Node } from './node';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { LockIcon } from './icons/lock-icon';
import { UnlockIcon } from './icons/unlock-icon';
import { Nodes } from './nodes';

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
        <Nodes
          nodes={layer.nodes}
          onNodesReorder={(nodes) => {
            onLayerUpdate({
              ...layer,
              nodes,
            });
          }}
        />
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
