'use client';

import { useEffect, useRef } from 'react';

type SlideyBoiProps = JSX.IntrinsicElements['input'] & {
  label: string;
};

const textToWidth = (text: string) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  ctx.font = '12px monospace';
  return ctx.measureText(text.slice(0, 5)).width;
};

export const SlideyBoi = ({ type: _type, id, label, value, onChange, ...passthrough }: SlideyBoiProps) => {
  const width = useRef(0);

  useEffect(() => {
    width.current = textToWidth(String(value ?? ''));
  }, [value]);

  return (
    <div className="flex flex-row gap-2 justify-between">
      <div className="flex gap-2">
        <label htmlFor={id}>{label}</label>
        <div
          className="text-center max-w-full"
          style={{
            width: `${18 + width.current}px`,
          }}
        >
          <input
            className="font-mono text-[#a0a0a0] bg-[#f1f1f3] dark:bg-[#121212] border border-[#e4e4e7] dark:border-[#2e2e2e] rounded p-1 h-5 text-xs text-center w-full"
            value={value}
            onChange={(e) => {
              e.preventDefault();
              const value = e.target.value;

              // Regular expression to allow only digits to be entered into input
              if (/^\d*$/.test(value)) {
                onChange?.(e);
              } else {
                // Reset to '0' if non-numeric value is entered
                onChange?.({ ...e, target: { ...e.target, value: '0' } });
              }
            }}
            {...passthrough}
          />
        </div>
      </div>
      <input className="accent-[#7e7e7e]" id={id} type="range" value={value} onChange={onChange} {...passthrough} />
    </div>
  );
};
