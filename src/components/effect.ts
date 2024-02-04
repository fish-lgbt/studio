import { Item } from './item';

export abstract class Effect {
  public readonly stage: 'before' | 'after' = 'after';
  constructor() {}

  abstract setItem(item: Item): void;
  abstract render(ctx: CanvasRenderingContext2D, translatePos: { x: number; y: number }, scale: number): void;
}
