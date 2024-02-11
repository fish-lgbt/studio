import { Item, ItemParams } from '../item';

type DrawingParams = ItemParams;

export class Drawing extends Item {
  public readonly type: string = 'drawing';

  constructor(params: DrawingParams) {
    super(params);
  }
}
