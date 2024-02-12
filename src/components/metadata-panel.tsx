import { useWatchRef } from '@/hooks/use-watch-ref';
import { Layer } from './studio';

type MetadataPanelProps = {
  layers: Layer[];
  selectedLayer: string | null;
  metadataRef: React.MutableRefObject<Set<string>>;
};

export const MetadataPanel = ({ layers, selectedLayer, metadataRef }: MetadataPanelProps) => {
  // Aim for 30fps
  useWatchRef(metadataRef, 1000 / 30);

  const values = [...metadataRef.current.values()];
  const layer = layers.find((layer) => layer.id === selectedLayer);
  if (!layer) return null;

  return (
    <div className="p-2">
      <h1 className="text-xl font-bold">Selected Nodes</h1>
      <ul>
        {values.map((id) => {
          const node = layer.nodes.find((node) => node.id === id);
          if (!node) return null;
          return (
            <li key={node.id}>
              <h2 className="text-lg font-bold">{node.id}</h2>
              <p>X: {node.x}</p>
              <p>Y: {node.y}</p>
              <p>Width: {node.width}</p>
              <p>Height: {node.height}</p>
              <p>Rotation: {node.rotation}</p>
              <p>Colour: {node.colour}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
