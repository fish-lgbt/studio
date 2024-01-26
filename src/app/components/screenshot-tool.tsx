/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dropzone } from './dropzone';
import { DownloadCanvasButton } from './download-canvas-button';
import { BackgroundColourPicker } from './background-colour-picker';
import { RenderPipeline } from './render-pipeline';
import { cn } from '@/cn';

export type DropzoneProps = {
  onDrop: (acceptedFiles: File[]) => void;
};

export type DownloadCanvasButtonProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

type Coordinates = {
  x: number;
  y: number;
};

// Function to generate a random but aesthetically pleasing color
const generateColor = () => {
  const hues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]; // Hue values for pleasing colors
  const hue = hues[Math.floor(Math.random() * hues.length)];
  const saturation = 70 + Math.random() * 30; // Higher saturation for more vivid color
  const lightness = 40 + Math.random() * 20; // Lightness in a middle range for balance
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const drawGridPattern = (canvas: HTMLCanvasElement, gridSize: number, color: string = '#000') => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.beginPath();
  ctx.strokeStyle = color;

  // Draw vertical lines
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }

  // Draw horizontal lines
  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }

  ctx.stroke();
};

function drawWaves(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const lines = 100; // Number of lines you want to draw
  const waveAmplitude = 10; // The amplitude of the wave
  const waveFrequency = 0.1; // The frequency of the wave

  // Set the color of the lines
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;

  ctx.beginPath(); // Begin a new path for the combined lines

  for (let i = 0; i < lines; i++) {
    for (let x = 0; x <= canvas.width; x += 10) {
      // Calculate the y position of the line at point x
      const y = waveAmplitude * Math.sin(x * waveFrequency + i * waveFrequency) + (canvas.height / lines) * i;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  }

  ctx.stroke(); // Stroke the path once after all lines are defined
}

const drawDotPattern = (canvas: HTMLCanvasElement, dotSize: number, colour: string = '#000'): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.beginPath();
  ctx.fillStyle = colour;

  // Draw circles at every 50px
  for (let x = 0; x <= canvas.width; x += 50) {
    for (let y = 0; y <= canvas.height; y += 50) {
      ctx.moveTo(x, y);
      ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
    }
  }

  ctx.fill();
};

type DrawParams = {
  canvas: HTMLCanvasElement | null;
  image: HTMLImageElement | null;
  scale: number;
  position: Coordinates;
  shadowBlur: number;
  shadowColour: string | null;
  backgroundType: 'colour' | 'gradient' | 'image' | null;
  backgroundColour: string | null;
  backgroundGradient: string[] | null;
  backgroundImage: HTMLImageElement | HTMLCanvasElement | null;
  cornerRadius: number;
  frameColour: string | null;
  patterns: {
    grid: boolean;
    dot: boolean;
    waves: boolean;
  };
};

const draw = ({
  canvas,
  image,
  position,
  shadowBlur,
  scale,
  shadowColour,
  backgroundType,
  backgroundColour,
  backgroundGradient,
  backgroundImage,
  cornerRadius,
  frameColour,
  patterns,
}: DrawParams) => {
  const ctx = canvas?.getContext('2d');

  // Do nothing unless we're ready
  if (!canvas || !ctx) return;

  // Clear the main canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Add a background to the main canvas
  const canvasWithBackground = new RenderPipeline(canvas, [
    {
      backgroundType,
      backgroundColour,
      backgroundGradient,
      backgroundImage,
    },
  ]).render();

  // Draw the updated canvas to the main canvas
  ctx.drawImage(canvasWithBackground, 0, 0, canvas.width, canvas.height);

  // Draw the pattern to the main canvas
  if (patterns.grid) drawGridPattern(canvas, 20, 'rgba(255, 255, 255, 0.5)');
  if (patterns.dot) drawDotPattern(canvas, 5, 'rgba(255, 255, 255, 0.5)');
  if (patterns.waves) drawWaves(canvas);

  // Stop here if there's no image
  if (!image) return;

  // Process the image
  const processedImage = new RenderPipeline(image, [
    {
      cornerRadius,
    },
    ...(frameColour
      ? [
          {
            padding: 10,
            backgroundType: 'colour' as const,
            backgroundColour: frameColour === '#FFFFFF' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            cornerRadius,
          },
        ]
      : []),
  ]).render();

  // Setting shadow on the main canvas
  if (shadowColour && shadowBlur) {
    ctx.shadowColor = shadowColour;
    ctx.shadowBlur = shadowBlur;
  }
  // Calculate the aspect ratio of the image
  const imageAspectRatio = image.width / image.height;

  // Calculate the desired scale factor from the user's scale input
  const desiredScaleFactor = scale / 100;

  // Initially apply the scale to the width
  let scaledImageWidth = image.width * desiredScaleFactor;
  // Calculate the height based on the scaled width to maintain the aspect ratio
  let scaledImageHeight = scaledImageWidth / imageAspectRatio;

  // Check if the scaled dimensions exceed the canvas size
  if (scaledImageWidth > canvas.width || scaledImageHeight > canvas.height) {
    // Determine the maximum scale factor that fits the canvas while maintaining the aspect ratio
    const widthScaleFactor = canvas.width / image.width;
    const heightScaleFactor = canvas.height / image.height;
    const scaleFactorToFitCanvas = Math.min(widthScaleFactor, heightScaleFactor);

    // Apply this scale factor to both dimensions
    scaledImageWidth = image.width * scaleFactorToFitCanvas;
    scaledImageHeight = image.height * scaleFactorToFitCanvas;
  }

  // Clamp the image position to the canvas
  position.x = Math.min(Math.max(position.x, 0), canvas.width - scaledImageWidth);
  position.y = Math.min(Math.max(position.y, 0), canvas.height - scaledImageHeight);

  // Draw the processed image to the main canvas
  ctx.drawImage(processedImage, position.x, position.y, scaledImageWidth, scaledImageHeight);
};

const hslToRgb = (h: number, s: number, l: number) => {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hslToHex = (value: string) => {
  if (!value.startsWith('hsl')) return value;
  const [h, s, l] = value
    .replace('hsl(', '')
    .replace(')', '')
    .split(',')
    .map((value) => Number(value.replace('%', '').trim()));

  return hslToRgb(h / 360, s / 100, l / 100);
};

const GradientPicker = ({
  backgroundGradient,
  onChange,
}: {
  backgroundGradient: string[] | null;
  onChange: (backgroundGradient: string[]) => void;
}) => {
  if (!backgroundGradient) return null;
  return (
    <div className="flex flex-row gap-2">
      <label htmlFor="gradient-picker">Gradient</label>
      {backgroundGradient.map((colourStop, index) => (
        <input
          key={index}
          id={`gradient-picker-${index}`}
          type="color"
          value={hslToHex(colourStop)}
          onChange={(event) => {
            onChange(
              backgroundGradient.map((colourStop, colourStopIndex) => {
                if (colourStopIndex === index) {
                  return event.target.value;
                }
                return colourStop;
              }),
            );
          }}
        />
      ))}
    </div>
  );
};

const canvasRatioToSize = (ratio: '16:9' | '4:3' | '1:1') => {
  if (ratio === '16:9') {
    return { width: 1920, height: 1080 };
  }

  if (ratio === '4:3') {
    return { width: 1920, height: 1440 };
  }

  if (ratio === '1:1') {
    return { width: 1080, height: 1080 };
  }

  return null;
};

const centerImage = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  image: HTMLImageElement,
  scale: number,
  position: React.MutableRefObject<Coordinates>,
) => {
  if (!canvasRef.current || !image) return;
  // Take scaling into account
  const scaledImageWidth = Math.min(image.width * (scale / 100), canvasRef.current.width);
  const scaledImageHeight = Math.min(image.height * (scale / 100), canvasRef.current.height);
  position.current = {
    x: (canvasRef.current.width - scaledImageWidth) / 2,
    y: (canvasRef.current.height - scaledImageHeight) / 2,
  };
};

export const ScreenshotTool = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backgroundColour, setBackgroundColour] = useState<string | null>(null);
  const [backgroundGradient, setbackgroundGradient] = useState<string[] | null>(null);
  const backgroundImage = useRef<HTMLImageElement | null>(null);
  const [backgroundImageSrc, setBackgroundImageSrc] = useState<string | null>(null);
  const [shadowColour, setShadowColour] = useState('#000000');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [shadowScale, setShadowScale] = useState(20);
  const [scale, setScale] = useState(50);
  const isDragging = useRef(false);
  const dragStart = useRef<Coordinates>({ x: 0, y: 0 });
  const position = useRef<Coordinates>({ x: 0, y: 0 });
  const requestRef = useRef<number | null>(null);
  const [backgroundType, setBackgroundType] = useState<'colour' | 'gradient' | 'image' | null>('image');
  const [showDropzone, setShowDropzone] = useState(false);
  const [cornerRadius, setCornerRadius] = useState(20);
  const [canvasRatio, setCanvasRatio] = useState<'16:9' | '4:3' | '1:1'>('16:9');
  const [frameColour, setFrameColour] = useState<string>('#FFFFFF');
  const [autoCenter, setAutoCenter] = useState(true);
  const [patterns, setPatterns] = useState<{
    grid: boolean;
    dot: boolean;
    waves: boolean;
  }>({
    grid: false,
    dot: false,
    waves: false,
  });
  const images = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    // Preload the images
    images.current = [
      'imlunahey_3d_wallpapers_of_water_splashes_in_the_ocean_in_the_b327bffc-94c7-4314-a669-c86bfab3a17a_0.png',
      'imlunahey_3d_wallpapers_of_water_splashes_in_the_ocean_in_the_b327bffc-94c7-4314-a669-c86bfab3a17a_1.png',
      'imlunahey_3d_wallpapers_of_water_splashes_in_the_ocean_in_the_b327bffc-94c7-4314-a669-c86bfab3a17a_2.png',
      'imlunahey_3d_wallpapers_of_water_splashes_in_the_ocean_in_the_b327bffc-94c7-4314-a669-c86bfab3a17a_3.png',
      'imlunahey_a_beautiful_image_of_ocean_colors_in_a_watery_view__ef7faa5a-66af-4389-8741-083b07da80ef_0.png',
      'imlunahey_a_beautiful_image_of_ocean_colors_in_a_watery_view__ef7faa5a-66af-4389-8741-083b07da80ef_1.png',
      'imlunahey_a_beautiful_image_of_ocean_colors_in_a_watery_view__ef7faa5a-66af-4389-8741-083b07da80ef_2.png',
      'imlunahey_a_beautiful_image_of_ocean_colors_in_a_watery_view__ef7faa5a-66af-4389-8741-083b07da80ef_3.png',
      'imlunahey_a_splash_of_blue_orange_and_green_over_water_waves__de296173-e858-4410-a040-ff679eff9b17_0.png',
      'imlunahey_a_splash_of_blue_orange_and_green_over_water_waves__de296173-e858-4410-a040-ff679eff9b17_1.png',
      'imlunahey_a_splash_of_blue_orange_and_green_over_water_waves__de296173-e858-4410-a040-ff679eff9b17_2.png',
      'imlunahey_a_splash_of_blue_orange_and_green_over_water_waves__de296173-e858-4410-a040-ff679eff9b17_3.png',
      'imlunahey_abstract_sea_in_blue_and_orange_with_waves_in_the_s_70d32e86-fd8a-4abd-b518-0c2eaf7345a6_0.png',
      'imlunahey_abstract_sea_in_blue_and_orange_with_waves_in_the_s_70d32e86-fd8a-4abd-b518-0c2eaf7345a6_1.png',
      'imlunahey_abstract_sea_in_blue_and_orange_with_waves_in_the_s_70d32e86-fd8a-4abd-b518-0c2eaf7345a6_2.png',
      'imlunahey_abstract_sea_in_blue_and_orange_with_waves_in_the_s_70d32e86-fd8a-4abd-b518-0c2eaf7345a6_3.png',
      'imlunahey_an_abstract_image_of_sea_waves_and_splashes_in_the__6b58323b-7223-4fcd-a0c2-a83442459492_0.png',
      'imlunahey_an_abstract_image_of_sea_waves_and_splashes_in_the__6b58323b-7223-4fcd-a0c2-a83442459492_1.png',
      'imlunahey_an_abstract_image_of_sea_waves_and_splashes_in_the__6b58323b-7223-4fcd-a0c2-a83442459492_2.png',
      'imlunahey_an_abstract_image_of_sea_waves_and_splashes_in_the__6b58323b-7223-4fcd-a0c2-a83442459492_3.png',
      'imlunahey_an_image_of_beautiful_water_wave_in_the_style_of_da_7efdf1ee-8058-4114-9c40-d3f922becb56_0.png',
      'imlunahey_an_image_of_beautiful_water_wave_in_the_style_of_da_7efdf1ee-8058-4114-9c40-d3f922becb56_1.png',
      'imlunahey_an_image_of_beautiful_water_wave_in_the_style_of_da_7efdf1ee-8058-4114-9c40-d3f922becb56_2.png',
      'imlunahey_an_image_of_beautiful_water_wave_in_the_style_of_da_7efdf1ee-8058-4114-9c40-d3f922becb56_3.png',
      'imlunahey_cloud_pattern_wallpaper_2_top_25_android_wallpapers_69a02d2a-9405-4f6a-8a23-ca20f5be8aa6_0.png',
      'imlunahey_cloud_pattern_wallpaper_2_top_25_android_wallpapers_69a02d2a-9405-4f6a-8a23-ca20f5be8aa6_1.png',
      'imlunahey_cloud_pattern_wallpaper_2_top_25_android_wallpapers_69a02d2a-9405-4f6a-8a23-ca20f5be8aa6_2.png',
      'imlunahey_cloud_pattern_wallpaper_2_top_25_android_wallpapers_69a02d2a-9405-4f6a-8a23-ca20f5be8aa6_3.png',
      'imlunahey_cool_images_of_waves_in_the_style_of_colorful_turbu_34f5ad58-7ace-49c5-a007-2c7f554cfde4_0.png',
      'imlunahey_cool_images_of_waves_in_the_style_of_colorful_turbu_34f5ad58-7ace-49c5-a007-2c7f554cfde4_1.png',
      'imlunahey_cool_images_of_waves_in_the_style_of_colorful_turbu_34f5ad58-7ace-49c5-a007-2c7f554cfde4_2.png',
      'imlunahey_cool_images_of_waves_in_the_style_of_colorful_turbu_34f5ad58-7ace-49c5-a007-2c7f554cfde4_3.png',
      'imlunahey_splashing_ocean_waves_in_the_air_desktop_wallpaper__d88c4170-bbf2-4a08-99e1-e40de50e1521_0.png',
      'imlunahey_splashing_ocean_waves_in_the_air_desktop_wallpaper__d88c4170-bbf2-4a08-99e1-e40de50e1521_1.png',
      'imlunahey_splashing_ocean_waves_in_the_air_desktop_wallpaper__d88c4170-bbf2-4a08-99e1-e40de50e1521_2.png',
      'imlunahey_splashing_ocean_waves_in_the_air_desktop_wallpaper__d88c4170-bbf2-4a08-99e1-e40de50e1521_3.png',
      'imlunahey_the_abstract_image_of_pink_and_blue_colors_in_the_s_aa778ece-ee52-4e4f-9d72-9f526a3e3f6b_0.png',
      'imlunahey_the_abstract_image_of_pink_and_blue_colors_in_the_s_aa778ece-ee52-4e4f-9d72-9f526a3e3f6b_1.png',
      'imlunahey_the_abstract_image_of_pink_and_blue_colors_in_the_s_aa778ece-ee52-4e4f-9d72-9f526a3e3f6b_2.png',
      'imlunahey_the_abstract_image_of_pink_and_blue_colors_in_the_s_aa778ece-ee52-4e4f-9d72-9f526a3e3f6b_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_04a6fa6c-ba9e-427c-aef0-0c83a0110d2d_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_04a6fa6c-ba9e-427c-aef0-0c83a0110d2d_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_04a6fa6c-ba9e-427c-aef0-0c83a0110d2d_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_04a6fa6c-ba9e-427c-aef0-0c83a0110d2d_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_0527e128-3775-430f-ad21-ef2e1303192e_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_0527e128-3775-430f-ad21-ef2e1303192e_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_0527e128-3775-430f-ad21-ef2e1303192e_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_0527e128-3775-430f-ad21-ef2e1303192e_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_1b273d1d-8dd1-4d8a-89d4-1b2481fed417_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_1b273d1d-8dd1-4d8a-89d4-1b2481fed417_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_1b273d1d-8dd1-4d8a-89d4-1b2481fed417_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_1b273d1d-8dd1-4d8a-89d4-1b2481fed417_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2479cb68-786b-4b45-bd3b-2d61eb736831_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2479cb68-786b-4b45-bd3b-2d61eb736831_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2479cb68-786b-4b45-bd3b-2d61eb736831_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2479cb68-786b-4b45-bd3b-2d61eb736831_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_25bf7ecb-3ce7-497f-80f1-5d694a3425b2_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_25bf7ecb-3ce7-497f-80f1-5d694a3425b2_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_25bf7ecb-3ce7-497f-80f1-5d694a3425b2_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_25bf7ecb-3ce7-497f-80f1-5d694a3425b2_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2a03da6e-078e-4b70-a90d-0baf6bbb5830_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2a03da6e-078e-4b70-a90d-0baf6bbb5830_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2a03da6e-078e-4b70-a90d-0baf6bbb5830_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2a03da6e-078e-4b70-a90d-0baf6bbb5830_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2e65175c-892a-4cf5-8c8b-77172aaaf300_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2e65175c-892a-4cf5-8c8b-77172aaaf300_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2e65175c-892a-4cf5-8c8b-77172aaaf300_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_2e65175c-892a-4cf5-8c8b-77172aaaf300_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_445683ba-6ff5-42b6-8496-895c9b3ed4ee_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_445683ba-6ff5-42b6-8496-895c9b3ed4ee_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_445683ba-6ff5-42b6-8496-895c9b3ed4ee_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_445683ba-6ff5-42b6-8496-895c9b3ed4ee_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_46e72589-4a4e-473a-97a7-e3baef0ada27_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_46e72589-4a4e-473a-97a7-e3baef0ada27_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_46e72589-4a4e-473a-97a7-e3baef0ada27_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_46e72589-4a4e-473a-97a7-e3baef0ada27_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_6609f307-8a2c-4fd1-bbbf-3769e8be1eca_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_6609f307-8a2c-4fd1-bbbf-3769e8be1eca_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_6609f307-8a2c-4fd1-bbbf-3769e8be1eca_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_6609f307-8a2c-4fd1-bbbf-3769e8be1eca_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_683efc08-5e6f-4199-9335-e02ca1acd8ef_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_683efc08-5e6f-4199-9335-e02ca1acd8ef_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_683efc08-5e6f-4199-9335-e02ca1acd8ef_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_683efc08-5e6f-4199-9335-e02ca1acd8ef_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_6b0a1673-c0b2-4eb0-98e4-4fbac039724c_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_6b0a1673-c0b2-4eb0-98e4-4fbac039724c_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_6b0a1673-c0b2-4eb0-98e4-4fbac039724c_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_6b0a1673-c0b2-4eb0-98e4-4fbac039724c_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_7177b260-4622-4e98-8a92-b635a52962c1_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_7177b260-4622-4e98-8a92-b635a52962c1_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_7177b260-4622-4e98-8a92-b635a52962c1_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_7177b260-4622-4e98-8a92-b635a52962c1_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_77326f95-83d2-4dd7-9c5a-0eb82cc87103_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_77326f95-83d2-4dd7-9c5a-0eb82cc87103_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_77326f95-83d2-4dd7-9c5a-0eb82cc87103_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_77326f95-83d2-4dd7-9c5a-0eb82cc87103_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_b26a1cc2-234e-4173-8932-f880b916d29e_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_b26a1cc2-234e-4173-8932-f880b916d29e_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_b26a1cc2-234e-4173-8932-f880b916d29e_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_b26a1cc2-234e-4173-8932-f880b916d29e_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_d2f6a42b-9fa0-4193-bea5-250cbb736ace_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_d2f6a42b-9fa0-4193-bea5-250cbb736ace_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_d2f6a42b-9fa0-4193-bea5-250cbb736ace_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_d2f6a42b-9fa0-4193-bea5-250cbb736ace_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_d3e12350-7e94-4830-9703-88fb4fb63a96_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_d3e12350-7e94-4830-9703-88fb4fb63a96_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_d3e12350-7e94-4830-9703-88fb4fb63a96_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_d3e12350-7e94-4830-9703-88fb4fb63a96_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_db993c2d-5bd2-4e43-bacf-eb71c349b769_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_db993c2d-5bd2-4e43-bacf-eb71c349b769_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_db993c2d-5bd2-4e43-bacf-eb71c349b769_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_db993c2d-5bd2-4e43-bacf-eb71c349b769_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_ed98f4ad-6222-4439-8407-5c93d6ed538a_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_ed98f4ad-6222-4439-8407-5c93d6ed538a_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_ed98f4ad-6222-4439-8407-5c93d6ed538a_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_ed98f4ad-6222-4439-8407-5c93d6ed538a_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_f5e93809-6a21-4094-bf47-34eec6d1cef2_0.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_f5e93809-6a21-4094-bf47-34eec6d1cef2_1.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_f5e93809-6a21-4094-bf47-34eec6d1cef2_2.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_th_f5e93809-6a21-4094-bf47-34eec6d1cef2_3.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_the__0b00e323-4137-44b0-914c-c3a89e8b3b0f.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_the__0b00e323-4137-44b0-914c-c3a89e8b3b0f.webp',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_the__50e358ee-16df-4474-999d-aedb4118bd91.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_the__50e358ee-16df-4474-999d-aedb4118bd91.webp',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_the__b53afe4d-76ec-499a-be92-a58f65bbf7bd.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_the__b53afe4d-76ec-499a-be92-a58f65bbf7bd.webp',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_the__e9c05a6a-bcc1-4e7d-9908-90fe3ab11967.png',
      'imlunahey_the_number_of_times_a_tweet_has_been_shared_over_the__e9c05a6a-bcc1-4e7d-9908-90fe3ab11967.webp',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_0da1c8e2-a91f-4d85-8929-8635322dbef2_0.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_0da1c8e2-a91f-4d85-8929-8635322dbef2_1.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_0da1c8e2-a91f-4d85-8929-8635322dbef2_2.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_0da1c8e2-a91f-4d85-8929-8635322dbef2_3.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_11444df2-6dd4-4fb9-b33a-eda37e15f887_0.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_11444df2-6dd4-4fb9-b33a-eda37e15f887_1.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_11444df2-6dd4-4fb9-b33a-eda37e15f887_2.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_11444df2-6dd4-4fb9-b33a-eda37e15f887_3.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_6d10258c-9dee-42f4-b5d9-f11435ace8ad_0.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_6d10258c-9dee-42f4-b5d9-f11435ace8ad_1.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_6d10258c-9dee-42f4-b5d9-f11435ace8ad_2.png',
      'imlunahey_the_water_is_showing_some_pink_tints_in_the_style_o_6d10258c-9dee-42f4-b5d9-f11435ace8ad_3.png',
      'imlunahey_this_photo_shows_the_ripple_of_water_and_colorful_p_f49f5639-d7b8-4ba7-a5ee-92b9f411afb2_0.png',
      'imlunahey_this_photo_shows_the_ripple_of_water_and_colorful_p_f49f5639-d7b8-4ba7-a5ee-92b9f411afb2_1.png',
      'imlunahey_this_photo_shows_the_ripple_of_water_and_colorful_p_f49f5639-d7b8-4ba7-a5ee-92b9f411afb2_2.png',
      'imlunahey_this_photo_shows_the_ripple_of_water_and_colorful_p_f49f5639-d7b8-4ba7-a5ee-92b9f411afb2_3.png',
    ]
      .sort(() => Math.random() - 0.5)
      .slice(0, 20)
      .map((src) => {
        const image = new Image();
        image.src = `/backgrounds/${src}`;
        return image;
      });
  }, []);

  useEffect(() => {
    // Generate a random background colour
    const newBackgroundColour = generateColor();
    setBackgroundColour(newBackgroundColour);

    // Generate a random background gradient
    const newbackgroundGradient = Array.from({ length: 3 }, () => generateColor());
    setbackgroundGradient(newbackgroundGradient);

    // Randomly select a background image
    const randomIndex = Math.floor(Math.random() * images.current.length);
    const image = images.current[randomIndex];
    backgroundImage.current = image;
    setBackgroundImageSrc(image.src);
  }, []);

  const handleChangeBackground = (color: string) => {
    setBackgroundColour(color);
  };

  const onDrop = useCallback(
    (file: File[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      loadImage(URL.createObjectURL(file[0])).then((loadedImage) => {
        setImage(loadedImage);
        centerImage(canvasRef, loadedImage, scale, position);
      });
    },
    [scale],
  );

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    if (canvasRef.current) {
      // Get the displayed size of the canvas
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate the scaling factors based on the canvas size and displayed size
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      // Adjust the initial drag position to account for the scaling
      // This calculates the "true" starting point considering the canvas scaling
      dragStart.current = {
        x: (event.touches[0].clientX - rect.left) * scaleX - position.current.x,
        y: (event.touches[0].clientY - rect.top) * scaleY - position.current.y,
      };

      // Set the dragging flag
      isDragging.current = true;

      // Stop auto centering
      setAutoCenter(false);
    }
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    if (isDragging.current && canvasRef.current) {
      // Get the displayed size of the canvas
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate the scaling factors
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      // Adjust the mouse coordinates with the scaling factor
      // Note: `clientX` and `clientY` are the mouse positions from the event
      const adjustedX = (event.touches[0].clientX - rect.left) * scaleX - dragStart.current.x;
      const adjustedY = (event.touches[0].clientY - rect.top) * scaleY - dragStart.current.y;

      // Update the position taking into account the scaling
      position.current = { x: adjustedX, y: adjustedY };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (canvasRef.current) {
      // Get the displayed size of the canvas
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate the scaling factors based on the canvas size and displayed size
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      // Adjust the initial drag position to account for the scaling
      // This calculates the "true" starting point considering the canvas scaling
      dragStart.current = {
        x: (event.clientX - rect.left) * scaleX - position.current.x,
        y: (event.clientY - rect.top) * scaleY - position.current.y,
      };

      // Set the dragging flag
      isDragging.current = true;

      // Stop auto centering
      setAutoCenter(false);
    }
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isDragging.current && canvasRef.current) {
      // Get the displayed size of the canvas
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate the scaling factors
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      // Adjust the mouse coordinates with the scaling factor
      // Note: `clientX` and `clientY` are the mouse positions from the event
      const adjustedX = (event.clientX - rect.left) * scaleX - dragStart.current.x;
      const adjustedY = (event.clientY - rect.top) * scaleY - dragStart.current.y;

      // Update the position taking into account the scaling
      position.current = { x: adjustedX, y: adjustedY };
    }
  }, []);

  // Reset the dragging flag when the mouse is released
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Redraw the canvas when anything changes
  useEffect(() => {
    const redraw = (_delta: number) => {
      // Center the image if auto center is enabled
      if (image && autoCenter) {
        centerImage(canvasRef, image, scale, position);
      }

      draw({
        canvas: canvasRef.current,
        image,
        position: position.current,
        shadowBlur: shadowScale,
        scale,
        shadowColour,
        backgroundType,
        backgroundColour,
        backgroundGradient,
        backgroundImage: backgroundImage.current,
        cornerRadius,
        frameColour,
        patterns,
      });
      requestRef.current = requestAnimationFrame(redraw);
    };
    requestRef.current = requestAnimationFrame(redraw);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [
    backgroundType,
    backgroundColour,
    backgroundGradient,
    backgroundImage,
    image,
    shadowScale,
    scale,
    shadowColour,
    cornerRadius,
    frameColour,
    canvasRef.current?.width,
    canvasRef.current?.height,
    autoCenter,
    patterns,
  ]);

  // Add event listeners for mouse up and mouse leave
  useEffect(() => {
    const handleMouseLeave = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseUp]);

  const canvasSize = canvasRatioToSize(canvasRatio);
  const canvasWidth = canvasSize?.width ?? 1920;
  const canvasHeight = canvasSize?.height ?? 1080;

  const mainCanvas = (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        maxHeight: `${canvasHeight / 2}px`,
        maxWidth: `${canvasWidth / 2}px`,
      }}
      className="border border-white"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
  // Two option boxes for colour or gradient
  const colourOrGradientToggle = (
    <div className="flex flex-row gap-2">
      <button
        className={`${
          backgroundType === 'colour' ? 'bg-blue-500' : 'bg-gray-500'
        } rounded-md px-4 py-2 text-white font-semibold`}
        onClick={() => setBackgroundType('colour')}
      >
        Colour
      </button>
      <button
        className={`${
          backgroundType === 'gradient' ? 'bg-blue-500' : 'bg-gray-500'
        } rounded-md px-4 py-2 text-white font-semibold`}
        onClick={() => setBackgroundType('gradient')}
      >
        Gradient
      </button>
      <button
        className={`${
          backgroundType === 'image' ? 'bg-blue-500' : 'bg-gray-500'
        } rounded-md px-4 py-2 text-white font-semibold`}
        onClick={() => setBackgroundType('image')}
      >
        Image
      </button>
    </div>
  );
  const randomBackgroundButton = (
    <button
      className="bg-blue-500 rounded-md px-4 py-2 text-white font-semibold"
      onClick={() => {
        // Generate a random background colour
        if (backgroundType === 'colour') {
          const newBackgroundColour = generateColor();
          setBackgroundColour(newBackgroundColour);
        }

        // Generate a random gradient
        if (backgroundType === 'gradient') {
          const newbackgroundGradient = Array.from({ length: 3 }, () => generateColor());
          setbackgroundGradient(newbackgroundGradient);
        }

        // Randomly select a background image
        if (backgroundType === 'image') {
          const randomIndex = Math.floor(Math.random() * images.current.length);
          const image = images.current[randomIndex];
          backgroundImage.current = image;
          setBackgroundImageSrc(image.src);
        }
      }}
    >
      Random Background
    </button>
  );
  const backgroundColourPicker = (
    <BackgroundColourPicker backgroundColour={backgroundColour} onChangeBackgroundColour={handleChangeBackground} />
  );
  const backgroundGradientPicker = (
    <GradientPicker
      backgroundGradient={backgroundGradient}
      onChange={(newbackgroundGradient) => {
        setbackgroundGradient(newbackgroundGradient);
      }}
    />
  );
  const backgroundImagePicker = (
    <div className="flex flex-col gap-2">
      <label htmlFor="background-image-picker">Image</label>
      <div className="grid grid-cols-5 gap-2">
        {images.current.map((image, index) => (
          <button
            key={index}
            className="rounded-md text-white font-semibold"
            onClick={() => {
              backgroundImage.current = image;
              setBackgroundImageSrc(image?.src ?? null);
            }}
          >
            <img
              src={image.src}
              alt={`Background image #${index}`}
              className={cn('w-[48px] h-[48px] object-cover', {
                'border border-black': backgroundImageSrc === image.src,
              })}
            />
          </button>
        ))}
      </div>
    </div>
  );
  const shadowColourPicker = (
    <div className="flex flex-row gap-2">
      <label htmlFor="shadow-colour-picker">Shadow Colour</label>
      <input
        id="shadow-colour-picker"
        type="color"
        value={shadowColour}
        onChange={(event) => setShadowColour(event.target.value)}
      />
    </div>
  );
  const shadowSizeSlider = (
    <div className="flex flex-row gap-2">
      <label htmlFor="shadow-size-slider">Shadow Size</label>
      <input
        id="shadow-size-slider"
        type="range"
        min="0"
        max="100"
        value={shadowScale}
        onChange={(event) => setShadowScale(Number(event.target.value))}
      />
    </div>
  );
  const cornerRadiusSlider = (
    <div className="flex flex-row gap-2">
      <label htmlFor="corner-radius-slider">Corner Radius</label>
      <input
        id="corner-radius-slider"
        type="range"
        min="0"
        max="50"
        value={cornerRadius}
        onChange={(event) => setCornerRadius(Number(event.target.value))}
      />
    </div>
  );
  const canvasRatioSelector = (
    <div className="flex flex-row gap-2">
      <label htmlFor="canvas-ratio-selector">Canvas Ratio</label>
      <select
        id="canvas-ratio-selector"
        value={canvasRatio}
        onChange={(event) => setCanvasRatio(event.target.value as '16:9' | '4:3' | '1:1')}
      >
        <option value="16:9">16:9</option>
        <option value="4:3">4:3</option>
        <option value="1:1">1:1</option>
      </select>
    </div>
  );
  const frameColourPicker = (
    <div className="flex flex-row gap-2">
      <label htmlFor="frame-colour-picker">Frame Colour</label>
      <select
        id="frame-colour-picker"
        value={frameColour ?? 'None'}
        onChange={(event) => setFrameColour(event.target.value)}
      >
        <option value="">None</option>
        <option value="#FFFFFF">White</option>
        <option value="#000000">Black</option>
      </select>
    </div>
  );
  const patternPicker = (
    <div className="flex flex-row gap-2">
      <label htmlFor="pattern-picker">Pattern</label>
      {/* // Input checkbox for each pattern type */}
      <div className="flex flex-row gap-2">
        <input
          id="grid"
          type="checkbox"
          checked={patterns.grid}
          onChange={(event) => setPatterns({ ...patterns, grid: event.target.checked })}
        />
        <label htmlFor="grid">Grid</label>
      </div>
      <div className="flex flex-row gap-2">
        <input
          id="dot"
          type="checkbox"
          checked={patterns.dot}
          onChange={(event) => setPatterns({ ...patterns, dot: event.target.checked })}
        />
        <label htmlFor="dot">Dot</label>
      </div>
      {/* <div className="flex flex-row gap-2">
        <input
          id="waves"
          type="checkbox"
          checked={patterns.waves}
          onChange={(event) => setPatterns({ ...patterns, waves: event.target.checked })}
        />
        <label htmlFor="waves">Waves</label>
      </div> */}
    </div>
  );
  const imageSizeSlider = (
    <div className="flex flex-row gap-2">
      <label htmlFor="image-size-slider">Image Size</label>
      <input
        id="image-size-slider"
        type="range"
        min="1"
        max="100"
        value={scale}
        onChange={(event) => setScale(Number(event.target.value))}
      />
    </div>
  );
  const centerImageButton = (
    <button
      className="bg-blue-500 rounded-md px-4 py-2 text-white font-semibold"
      onClick={() => {
        if (!image) return;
        centerImage(canvasRef, image, scale, position);
        setAutoCenter(true);
      }}
    >
      Center Image
    </button>
  );
  const downloadButton = <DownloadCanvasButton canvasRef={canvasRef} />;
  const dropzone = (
    <div className="absolute">
      <Dropzone onDrop={onDrop} />
    </div>
  );

  const sidebarItems = [
    // Background colour
    colourOrGradientToggle,
    randomBackgroundButton,
    backgroundType === 'colour' && backgroundColourPicker,
    backgroundType === 'gradient' && backgroundGradientPicker,
    backgroundType === 'image' && backgroundImagePicker,

    // Shadow
    shadowColourPicker,
    shadowSizeSlider,

    // Corner radius
    cornerRadiusSlider,

    // Canvas ratio
    canvasRatioSelector,

    // Frame colour
    frameColourPicker,

    // Pattern
    patternPicker,

    // Image position
    imageSizeSlider,
    centerImageButton,

    // Download
    downloadButton,
  ];

  const sidebar = (
    <div className="relative h-fit self-center">
      {!image && <div className="z-10 w-full h-full bg-black bg-opacity-80 absolute rounded cursor-not-allowed" />}
      <div className="p-2 bg-white border flex flex-col gap-2 h-fit rounded">
        {sidebarItems.map((item, index) => {
          if (!item) return null;
          return <div key={`item-${index}`}>{item}</div>;
        })}
      </div>
    </div>
  );

  const canShowDropzone = !image || showDropzone;

  return (
    <div
      className="flex flex-row gap-2 justify-center p-4 text-black"
      onDragEnter={() => {
        setShowDropzone(true);
      }}
      onDrop={() => {
        setShowDropzone(false);
      }}
    >
      {/* Sidebar */}
      {sidebar}
      {/* Content */}
      <div className="p-2 relative flex justify-center items-center">
        {canShowDropzone && dropzone}
        {mainCanvas}
      </div>
    </div>
  );
};
