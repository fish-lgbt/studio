import { Effect } from '../effect';
import { Node } from '../node';
import { greyScale } from '@/components/effects/image-filters/grey-scale';
import { sepia } from '@/components/effects/image-filters/sepia';
import { gingham } from './image-filters/gingham';
import { clarendon } from './image-filters/clarendon';
import { invert } from './image-filters/invert';
import { reyes } from './image-filters/reyes';
import { lofi } from './image-filters/lofi';

export const filters = {
  'grey-scale': greyScale,
  sepia: (imageData: ImageData) => sepia(imageData, 1),
  gingham,
  clarendon,
  invert,
  reyes,
  lofi,
};

type Filter = keyof typeof filters;

export class ImageFilter extends Effect {
  public stage = 'before' as const;
  #node: Node | null = null;
  #previousImage: HTMLImageElement | null = null;

  constructor(private filter: Filter) {
    super();
  }

  setNode(node: Node) {
    this.#node = node;

    // Only apply the effect to images
    const { image } = this.#node;
    if (!image) return;

    // Save the previous image
    this.#previousImage = image;

    // Create a temp canvas to draw the image
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the existing image to the temp canvas
    ctx.drawImage(image, 0, 0);

    // Apple the filter
    const imageData = this.applyFilter(ctx, canvas);
    if (!imageData) return;

    // Draw the updated image data to the temp canvas
    ctx.putImageData(imageData, 0, 0);
    const filteredImage = new Image();
    filteredImage.src = canvas.toDataURL();
    filteredImage.onload = () => {
      // Override the node's existing image
      this.#node?.setImage(filteredImage);

      // Redraw the node
      this.#node?.redraw();
    };
  }

  applyFilter(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const filter = filters[this.filter];
    if (filter) {
      return filter(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
  }

  cleanup() {
    // Restore the previous image
    if (this.#previousImage) this.#node?.setImage(this.#previousImage);

    // Clear render cache
    this.#node?.clearCache();

    // Clear the node
    this.#node = null;
  }

  render() {
    return;
  }
}
