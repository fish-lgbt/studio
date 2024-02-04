import { Effect } from '../effect';
import { Item } from '../item';

type GlowParams = {
  colour: string;
  blur: number;
  offsetX: number;
  offsetY: number;
};

export class Glow extends Effect {
  public readonly stage = 'before' as const;
  #item: Item | null = null;

  constructor(private options: GlowParams) {
    super();
  }

  setItem(item: Item) {
    this.#item = item;
  }

  render(ctx: CanvasRenderingContext2D, translatePos: { x: number; y: number }, scale: number) {
    // Don't render if there's no item
    if (!this.#item) return;

    const { x, y, rotation } = this.#item;

    // Save the current state of the context
    ctx.save();

    // Apply transformations
    ctx.translate(x + translatePos.x, y + translatePos.y);
    ctx.scale(scale, scale);
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw the effect
    this.#renderEffect(ctx);

    // Restore the state of the context
    ctx.restore();
  }

  #renderEffect(ctx: CanvasRenderingContext2D) {
    // Don't render if there's no item
    if (!this.#item) return;

    const { colour, blur, offsetX, offsetY } = this.options;

    // Draw a glow effect
    ctx.shadowColor = colour;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = offsetX;
    ctx.shadowOffsetY = offsetY;

    // Draw the item
    ctx.fillRect(0, 0, this.#item.width, this.#item.height);
  }
}
