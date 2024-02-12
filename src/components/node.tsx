import { Position } from '@/common/position';
import { Effect } from './effect';

export type NodeParams = {
  id: string;
  width: number;
  height: number;

  x?: number;
  y?: number;
  rotation?: number;
  colour?: string;
  image?: string | HTMLImageElement | null;
  canvas?: HTMLCanvasElement | null;
  zIndex?: number;
  effects?: Effect[];
};

const renderedNodeCache = new Map<string, HTMLCanvasElement>();

export class Node {
  public readonly type: string = 'node';

  #id: string;
  #x: number;
  #y: number;
  #width: number;
  #height: number;
  #rotation: number;
  #colour: string;
  #image: HTMLImageElement | null = null;
  #canvas: HTMLCanvasElement | null = null;
  #effects: Effect[] = [];
  #zIndex: number;
  #erasedPixels: Position[] = [];

  // protected history = history();

  constructor(params: NodeParams) {
    this.#id = params.id;
    this.#x = params.x ?? 0;
    this.#y = params.y ?? 0;
    this.#width = params.width;
    this.#height = params.height;
    this.#rotation = params.rotation ?? 0;
    this.#colour = params.colour ?? 'transparent';
    this.#canvas = params.canvas ?? null;
    this.#effects = params.effects ?? [];
    this.#zIndex = params.zIndex ?? 0;

    // Set the effect's node to this node
    for (const effect of this.#effects) {
      effect.setNode(this);
    }

    if (params.image && typeof params.image === 'string') {
      const image = new Image();
      image.src = params.image;
      this.#image = image;
    }

    if (params.image && typeof params.image !== 'string') {
      this.#image = params.image;
    }
  }

  get id(): string {
    return this.#id;
  }

  get x(): number {
    return this.#x;
  }

  get y(): number {
    return this.#y;
  }

  get width(): number {
    return this.#width;
  }

  get height(): number {
    return this.#height;
  }

  get rotation(): number {
    return this.#rotation;
  }

  get colour(): string {
    return this.#colour;
  }

  get image(): HTMLImageElement | null {
    return this.#image;
  }

  get canvas(): HTMLCanvasElement | null {
    return this.#canvas;
  }

  get effects(): Effect[] {
    return this.#effects;
  }

  erase(position: Position): void {
    this.#erasedPixels.push(position);
  }

  public clone(): Node {
    return new Node({
      id: this.#id,
      x: this.#x,
      y: this.#y,
      width: this.#width,
      height: this.#height,
      rotation: this.#rotation,
      colour: this.#colour,
      image: this.#image,
      zIndex: this.#zIndex,
      effects: this.#effects,
    });
  }

  /**
   * Move the node by the given amount (relative to its current position)
   * @param x The amount to move the node on the x-axis
   * @param y The amount to move the node on the y-axis
   * @returns void
   */
  public moveBy(x: number, y: number): void {
    this.#x += x;
    this.#y += y;
  }

  /*
   * Move the node to the given position (absolute position)
   * @param x The x-coordinate to move the node to
   * @param y The y-coordinate to move the node to
   * @returns void
   */
  public moveTo(x: number, y: number): void {
    this.#x = x;
    this.#y = y;
  }

  public resize(width: number, height: number): void {
    this.#width = Math.max(1, width);
    this.#height = Math.max(1, height);
  }

  public rotate(degrees: number): void {
    this.#rotation = degrees;
  }

  public setColour(colour: string): void {
    this.#colour = colour;
  }

  public setImage(image: HTMLImageElement | null): void {
    this.#image = image;
  }

  public setCanvas(canvas: HTMLCanvasElement | null): void {
    this.#canvas = canvas;
  }

  public render(ctx: CanvasRenderingContext2D, translatePos: { x: number; y: number }, scale: number): void {
    if (renderedNodeCache.has(this.#id)) {
      ctx.drawImage(
        renderedNodeCache.get(this.#id) as HTMLCanvasElement,
        this.#x + translatePos.x,
        this.#y + translatePos.y,
      );
      return;
    }

    // Create a canvas to render the node to
    const canvas = document.createElement('canvas');
    canvas.width = this.#width;
    canvas.height = this.#height;

    // Get the context of the canvas
    const nodeCtx = canvas.getContext('2d');
    if (!nodeCtx) return;

    // Draw the colour
    if (this.#colour) {
      nodeCtx.fillStyle = this.#colour;
      nodeCtx.fillRect(0, 0, this.#width, this.#height);
    }

    // Draw the image
    if (this.#image) {
      nodeCtx.drawImage(this.#image, 0, 0, this.#width, this.#height);
    }

    // Draw the canvas
    if (this.#canvas) {
      nodeCtx.drawImage(this.#canvas, 0, 0, this.#width, this.#height);
    }

    // Clear the erased pixels
    for (const position of this.#erasedPixels) {
      nodeCtx.clearRect(position.x, position.y, 1, 1);
    }

    // Cache the rendered node
    renderedNodeCache.set(this.#id, canvas);

    // Save the current state of the context
    ctx.save();

    // Apply transformations for drawing the node
    ctx.translate(this.#x + translatePos.x, this.#y + translatePos.y);
    ctx.scale(scale, scale);
    ctx.rotate((this.#rotation * Math.PI) / 180);

    // Draw the node to the context
    ctx.drawImage(canvas, this.#x + translatePos.x, this.#y + translatePos.y);

    // Restore the state of the context
    ctx.restore();
  }

  public renderBorder(ctx: CanvasRenderingContext2D, translatePos: Position, scale: number): void {
    // Save the current state of the context
    ctx.save();

    // Apply transformations for drawing the node
    ctx.translate(this.#x + translatePos.x, this.#y + translatePos.y);
    ctx.scale(scale, scale);
    ctx.rotate((this.#rotation * Math.PI) / 180);

    // Draw the border
    ctx.strokeStyle = 'black';
    ctx.strokeRect(0, 0, this.#width, this.#height);

    // Restore the state of the context
    ctx.restore();
  }

  public renderHandles(ctx: CanvasRenderingContext2D, translatePos: Position, scale: number): void {
    // Save the current state of the context
    ctx.save();

    // Apply transformations for drawing the node
    ctx.translate(this.#x + translatePos.x, this.#y + translatePos.y);
    ctx.scale(scale, scale);
    ctx.rotate((this.#rotation * Math.PI) / 180);

    // Draw the handles
    ctx.fillStyle = 'pink';
    // Offset the handles by 5 pixels
    ctx.fillRect(-5, -5, 10, 10);
    ctx.fillRect(this.#width - 5, -5, 10, 10);
    ctx.fillRect(-5, this.#height - 5, 10, 10);
    ctx.fillRect(this.#width - 5, this.#height - 5, 10, 10);

    // Draw the size in a label below the node
    const labelText = `${this.#width}x${this.#height}`;
    const labelSize = ctx.measureText(labelText);
    ctx.fillRect(this.#width / 2 - labelSize.width / 2 - 5, this.#height + 10, labelSize.width + 10, 20);
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, this.#width / 2, this.#height + 20);

    // Restore the state of the context
    ctx.restore();
  }

  public isWithinPosition({ x, y, width, height }: Position & { width: number; height: number }): boolean {
    // Check if the node is within the given position
    // Is is allowed to be partially within the position
    return this.#x + this.#width > x && this.#x < x + width && this.#y + this.#height > y && this.#y < y + height;
  }
}
