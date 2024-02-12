import { Node, NodeParams } from '../node';

type ImageParams = NodeParams;

export class Image extends Node {
  public readonly type: string = 'image';

  constructor(params: ImageParams) {
    super(params);
  }
}
