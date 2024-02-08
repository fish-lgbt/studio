'use client';

import { Position } from '@/common/position';
import { Effect } from './effect';

export type ItemParams = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  colour?: string;
  image?: string | HTMLImageElement | null;
  canvas?: HTMLCanvasElement | null;
  zIndex?: number;
  effects?: Effect[];
};

const renderedItemCache = new Map<string, HTMLCanvasElement>();

export class Item {
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

  constructor(params: ItemParams) {
    this.#id = params.id;
    this.#x = params.x;
    this.#y = params.y;
    this.#width = params.width;
    this.#height = params.height;
    this.#rotation = params.rotation ?? 0;
    this.#colour = params.colour ?? 'transparent';
    this.#canvas = params.canvas ?? null;
    this.#effects = params.effects ?? [];
    this.#zIndex = params.zIndex ?? 0;

    // Set the effect's item to this item
    for (const effect of this.#effects) {
      effect.setItem(this);
    }

    if (params.image && typeof params.image === 'string') {
      const image = new Image();
      image.src = params.image;
      this.#image = image;
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

  public clone(): Item {
    return new Item({
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
   * Move the item by the given amount (relative to its current position)
   * @param x The amount to move the item on the x-axis
   * @param y The amount to move the item on the y-axis
   * @returns void
   */
  public moveBy(x: number, y: number): void {
    this.#x += x;
    this.#y += y;
  }

  /*
   * Move the item to the given position (absolute position)
   * @param x The x-coordinate to move the item to
   * @param y The y-coordinate to move the item to
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
    if (renderedItemCache.has(this.#id)) {
      ctx.drawImage(
        renderedItemCache.get(this.#id) as HTMLCanvasElement,
        this.#x + translatePos.x,
        this.#y + translatePos.y,
      );
      return;
    }

    // Create a canvas to render the item to
    const canvas = document.createElement('canvas');
    canvas.width = this.#width;
    canvas.height = this.#height;

    // Get the context of the canvas
    const itemCtx = canvas.getContext('2d');
    if (!itemCtx) return;

    // Draw the colour
    if (this.#colour) {
      itemCtx.fillStyle = this.#colour;
      itemCtx.fillRect(0, 0, this.#width, this.#height);
    }

    // Draw the image
    if (this.#image) {
      itemCtx.drawImage(this.#image, 0, 0, this.#width, this.#height);
    }

    // Draw the canvas
    if (this.#canvas) {
      itemCtx.drawImage(this.#canvas, 0, 0, this.#width, this.#height);
    }

    // Clear the erased pixels
    for (const position of this.#erasedPixels) {
      itemCtx.clearRect(position.x, position.y, 1, 1);
    }

    // Cache the rendered item
    renderedItemCache.set(this.#id, canvas);

    // Save the current state of the context
    ctx.save();

    // Apply transformations for drawing the item
    ctx.translate(this.#x + translatePos.x, this.#y + translatePos.y);
    ctx.scale(scale, scale);
    ctx.rotate((this.#rotation * Math.PI) / 180);

    // Draw the item to the context
    ctx.drawImage(canvas, this.#x + translatePos.x, this.#y + translatePos.y);

    // Restore the state of the context
    ctx.restore();
  }

  public renderBorder(ctx: CanvasRenderingContext2D, translatePos: Position, scale: number): void {
    // Save the current state of the context
    ctx.save();

    // Apply transformations for drawing the item
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

    // Apply transformations for drawing the item
    ctx.translate(this.#x + translatePos.x, this.#y + translatePos.y);
    ctx.scale(scale, scale);
    ctx.rotate((this.#rotation * Math.PI) / 180);

    // Draw the handles
    ctx.fillStyle = 'pink';
    ctx.fillRect(0, 0, 10, 10);
    ctx.fillRect(this.#width - 10, 0, 10, 10);
    ctx.fillRect(0, this.#height - 10, 10, 10);
    ctx.fillRect(this.#width - 10, this.#height - 10, 10, 10);

    // Restore the state of the context
    ctx.restore();
  }

  public isWithinPosition({ x, y, width, height }: Position & { width: number; height: number }): boolean {
    // Check if the item is within the given position
    // Is is allowed to be partially within the position
    return this.#x + this.#width > x && this.#x < x + width && this.#y + this.#height > y && this.#y < y + height;
  }
}
