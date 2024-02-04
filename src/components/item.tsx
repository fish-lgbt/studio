'use client';

import { Position } from '@/common/position';

type ItemParams = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  colour?: string;
  image?: string | HTMLImageElement | null;
  canvas?: HTMLCanvasElement | null;
  zIndex?: number;
};

export class Item {
  #id: number;
  #x: number;
  #y: number;
  #width: number;
  #height: number;
  #rotation: number;
  #colour: string;
  #image: HTMLImageElement | null = null;
  #canvas: HTMLCanvasElement | null = null;
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
    this.#zIndex = params.zIndex ?? 0;

    if (params.image && typeof params.image === 'string') {
      const image = new Image();
      image.src = params.image;
      this.#image = image;
    }
  }

  get id(): number {
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
    });
  }

  public move(x: number, y: number): void {
    this.#x = x;
    this.#y = y;
  }

  public resize(width: number, height: number): void {
    this.#width = width;
    this.#height = height;
  }

  public rotate(degrees: number): void {
    this.#rotation = degrees;
  }

  public render(ctx: CanvasRenderingContext2D, translatePos: { x: number; y: number }, scale: number): void {
    // Save the current state of the context
    ctx.save();

    // Apply transformations for drawing the item
    ctx.translate(this.#x + translatePos.x, this.#y + translatePos.y);
    ctx.scale(scale, scale);
    ctx.rotate((this.#rotation * Math.PI) / 180);

    // Draw the colour
    if (this.#colour) {
      ctx.fillStyle = this.#colour;
      ctx.fillRect(0, 0, this.#width, this.#height);
    }

    // Draw the image
    if (this.#image) {
      ctx.drawImage(this.#image, 0, 0, this.#width, this.#height);
    }

    // Draw the canvas
    if (this.#canvas) {
      ctx.drawImage(this.#canvas, 0, 0, this.#width, this.#height);
    }

    // Clear the erased pixels
    for (const position of this.#erasedPixels) {
      ctx.clearRect(position.x, position.y, 1, 1);
    }

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
