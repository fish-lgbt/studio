import { cn } from '@/cn';

type FlipHorizontalIconProps = {
  className?: string;
};

export const FlipHorizontalIcon = ({ className }: FlipHorizontalIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    className={cn('stroke-black dark:stroke-white py-1', className)}
  >
    <path
      stroke="currentColour"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 19V5H8L3 19h7zM14 19V5h2l5 14h-7z"
    />
  </svg>
);
