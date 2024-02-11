import { Item, ItemParams } from '../item';

type RectangleParams = ItemParams;

export class Rectangle extends Item {
  public readonly type: string = 'rectangle';

  constructor(params: RectangleParams) {
    super(params);
  }

  public render(ctx: CanvasRenderingContext2D, translatePos: { x: number; y: number }, scale: number): void {
    // Save the current state of the context
    ctx.save();

    // Apply transformations for drawing the item
    ctx.translate(translatePos.x, translatePos.y);
    ctx.scale(scale, scale);
    ctx.rotate((this.rotation * Math.PI) / 180);

    ctx.fillStyle = this.colour;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Restore the state of the context
    ctx.restore();
  }
}
