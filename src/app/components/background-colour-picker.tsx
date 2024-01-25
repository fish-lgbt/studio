'use client';
import { BackgroundColourPickerProps } from './screenshot-tool';

export const BackgroundColourPicker = ({ backgroundColour, onChangeBackgroundColour }: BackgroundColourPickerProps) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="background-colour">Background Colour</label>
      <input
        id="background-colour"
        type="color"
        value={backgroundColour}
        onChange={(event) => onChangeBackgroundColour(event.target.value)}
        className="border border-gray-200 rounded-md"
      />
    </div>
  );
};
