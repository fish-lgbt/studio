import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LayerBar } from './LayerBar';
import { Layer } from './beta';

type SortableLayerProps = {
  id: string;
  layer: Layer;
  selectedLayer: number | null;
  onLayerSelect: (id: number) => void;
  onLayerUpdate: (layer: Layer) => void;
  onLayerDelete: (id: number) => void;
};
export const SortableLayer = ({
  id,
  layer,
  selectedLayer,
  onLayerSelect,
  onLayerUpdate,
  onLayerDelete,
}: SortableLayerProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LayerBar
        layer={layer}
        selectedLayer={selectedLayer}
        onLayerSelect={onLayerSelect}
        onLayerUpdate={onLayerUpdate}
        onLayerDelete={onLayerDelete}
      />
    </div>
  );
};
