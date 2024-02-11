import { cn } from '@/cn';

type CircleIconProps = {
  className?: string;
};

export const CircleIcon = ({ className }: CircleIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={cn('stroke-black dark:stroke-white fill-black dark:fill-white w-6 h-6', className)}
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
};
