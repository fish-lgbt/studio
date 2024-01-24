'use client';
import { useDropzone } from 'react-dropzone';
import { DropzoneProps } from './screenshot-tool';

/**
 * User can drag and drop an image to the canvas
 */
export const Dropzone = ({ onDrop }: DropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className="border-dashed border-4 border-gray-200 rounded-lg p-4 cursor-pointer text-center hover:border-gray-300"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-gray-500">Drop the files here ...</p>
      ) : (
        <p className="text-gray-500">{"Drag 'n' drop some files here, or click to select files"}</p>
      )}
    </div>
  );
};
