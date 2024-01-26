type DrawImageWithRoundedCornersParams = {
  source: HTMLImageElement | HTMLCanvasElement; // Source image or canvas

  backgroundType?: 'colour' | 'gradient' | 'image' | 'transparent' | null; // Optional background type
  backgroundColour?: string | null; // Optional background colour
  backgroundGradient?: string[] | null; // Optional colour stops for gradient background
  backgroundImage?: HTMLImageElement | HTMLCanvasElement | null; // Optional background image
  cornerRadius?: number | null; // Radius of the corners
  padding?: number | null; // Optional padding
};

const modifyImageOrCanvas = ({
  source,

  backgroundType,
  backgroundColour,
  backgroundGradient,
  backgroundImage,
  cornerRadius = 0,
  padding = 0,
}: DrawImageWithRoundedCornersParams): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Draw rounded rectangle path for clipping
  if (cornerRadius) {
    ctx.beginPath();
    ctx.moveTo(cornerRadius, 0);
    ctx.lineTo(source.width - cornerRadius, 0);
    ctx.quadraticCurveTo(source.width, 0, source.width, cornerRadius);
    ctx.lineTo(source.width, source.height - cornerRadius);
    ctx.quadraticCurveTo(source.width, source.height, source.width - cornerRadius, source.height);
    ctx.lineTo(cornerRadius, source.height);
    ctx.quadraticCurveTo(0, source.height, 0, source.height - cornerRadius);
    ctx.lineTo(0, cornerRadius);
    ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctx.closePath();
    ctx.clip();
  }

  // Default to transparent background
  ctx.fillStyle = 'transparent';

  // Optional background colour
  if (backgroundType === 'colour' && backgroundColour) {
    ctx.fillStyle = backgroundColour;
    ctx.fillRect(0, 0, source.width, source.height);
  }

  // Optional gradient background
  if (backgroundType === 'gradient' && backgroundGradient) {
    const gradient = ctx.createLinearGradient(0, 0, source.width, source.height);
    backgroundGradient.forEach((stop, index) => {
      gradient.addColorStop(index / (backgroundGradient.length - 1), stop);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, source.width, source.height);
  }

  // Optional image background
  if (backgroundType === 'image' && backgroundImage) {
    // Make sure the background covers the whole of the canvas
    // also dont stretch the image make sure it covers the whole canvas
    const scale = Math.max(source.width / backgroundImage.width, source.height / backgroundImage.height);
    const x = source.width / 2 - (backgroundImage.width / 2) * scale;
    const y = source.height / 2 - (backgroundImage.height / 2) * scale;
    ctx.drawImage(backgroundImage, x, y, backgroundImage.width * scale, backgroundImage.height * scale);
  }

  // Draw the source
  if (source instanceof HTMLCanvasElement || source instanceof HTMLImageElement) {
    // Padding is a number of px to add to the image
    if (padding) {
      ctx.drawImage(source, padding, padding, source.width - padding * 2, source.height - padding * 2);
    } else {
      ctx.drawImage(source, 0, 0);
    }
  }

  return canvas;
};

type Pipeline = Omit<DrawImageWithRoundedCornersParams, 'source'>;

export class RenderPipeline {
  constructor(private source: HTMLImageElement | HTMLCanvasElement, private pipeline: Pipeline[]) {}

  render() {
    const result = this.pipeline.reduce((canvas, params) => modifyImageOrCanvas({ ...params, source: canvas }), this.source);
    return result as HTMLCanvasElement;
  }
}
