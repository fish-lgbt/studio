import React from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  DragEndEvent,
  MouseSensor,
  KeyboardSensor,
  TouchSensor,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import { Button } from './button';
import { PlusIcon } from './PlusIcon';
import { Layer } from './beta';
import { SortableLayer } from './SortableLayer';
import { cn } from '@/cn';
import { TrashCanIcon } from './TrashCanIcon';

type LayersProps = {
  layers: Layer[];
  selectedLayer: string | null;
  onLayerCreate: () => void;
  onLayerReorder: (layers: Layer[]) => void;
  onLayerSelect: (id: string | null) => void;
  onLayerUpdate: (layer: Layer) => void;
  onLayerDelete: (id: string | null) => void;
  className?: string;
};

export const Layers = ({
  layers,
  selectedLayer,
  onLayerCreate,
  onLayerReorder,
  onLayerSelect,
  onLayerUpdate,
  onLayerDelete,
  className,
}: LayersProps) => {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 0.01,
    },
  });
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, mouseSensor, touchSensor, keyboardSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layers.findIndex((layer) => layer.id.toString() === active.id);
      const newIndex = layers.findIndex((layer) => layer.id.toString() === over.id);

      const newLayers = arrayMove(layers, oldIndex, newIndex);
      onLayerReorder(newLayers);
    }
  };

  return (
    <div
      className={cn(
        'absolute bottom-1 right-1 rounded bg-white dark:bg-[#181818] border border-[#14141414] p-1 w-[250px]',
        className,
      )}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layers.map((layer) => layer.id.toString())} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {layers
              .slice()
              .reverse()
              .map((layer, index) => {
                return (
                  <SortableLayer
                    key={layer.id}
                    id={layer.id.toString()}
                    layer={layer}
                    selectedLayer={selectedLayer}
                    onLayerSelect={onLayerSelect}
                    onLayerUpdate={onLayerUpdate}
                    onLayerDelete={onLayerDelete}
                  />
                );
              })}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex flex-row gap-1 text-sm p-2 items-center">
        <Button
          className="aspect-square"
          onClick={() => {
            onLayerCreate();
          }}
          title="Add Layer"
        >
          <PlusIcon />
        </Button>
        <Button
          className="aspect-square"
          onClick={() => {
            onLayerDelete(selectedLayer);
          }}
          title="Delete Layer"
        >
          <TrashCanIcon />
        </Button>
      </div>
    </div>
  );
};
