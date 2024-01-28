declare module 'gif-frames/dist/gif-frames' {
  export type FrameInfo = {
    x: number;
    y: number;
    width: number;
    height: number;
    has_local_palette: boolean;
    palette_offset: number;
    palette_size: number;
    data_length: number;
    transparent_index: number;
    interlaced: boolean;
    delay: number;
    disposal: number;
    data: number[];
  };

  export type FrameData = {
    getImage(): HTMLImageElement;
    frameIndex: number;
    frameInfo: FrameInfo;
  };

  export interface Options {
    url: string;
    frames: 'all';
    outputType: 'canvas';
    cumulative?: boolean;
  }

  export default function gifFrames(options: Options): Promise<FrameData[]>;
}
