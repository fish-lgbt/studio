import { Item, ItemParams } from '../item';

type UIElementParams = ItemParams;

export class UIElement extends Item {
  constructor(params: UIElementParams) {
    super(params);
  }

  public render(ctx: CanvasRenderingContext2D, translatePos: { x: number; y: number }, scale: number): void {
    // Save the current state of the context
    ctx.save();

    // Apply transformations for drawing the item
    ctx.translate(translatePos.x, translatePos.y);
    ctx.scale(scale, scale);
    ctx.rotate((this.rotation * Math.PI) / 180);

    // Restore the state of the context
    ctx.restore();
  }

  public onClick(): void {}

  public onHoverStart(): void {}
  public onHoverStop(): void {}
}
