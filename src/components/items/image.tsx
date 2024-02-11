import { Item, ItemParams } from '../item';

type ImageParams = ItemParams;

export class Image extends Item {
  public readonly type: string = 'image';

  constructor(params: ImageParams) {
    super(params);
  }
}
