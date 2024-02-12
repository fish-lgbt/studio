import { cn } from '@/cn';

type FlipVerticalIconProps = {
  className?: string;
};

export const FlipVerticalIcon = ({ className }: FlipVerticalIconProps) => (
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
      d="M5 14h14v2L5 21v-7zM5 10h14V8L5 3v7z"
    />
  </svg>
);
