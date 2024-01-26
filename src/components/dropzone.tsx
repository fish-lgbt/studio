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
      className="rounded-md p-4 cursor-pointer text-center text-white bg-black w-[250px] aspect-square items-center justify-center flex flex-col bg-opacity-75"
    >
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the files here ...</p> : <p>{"Drag 'n' drop some files here, or click to select files"}</p>}
    </div>
  );
};
