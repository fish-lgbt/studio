import { cn } from '@/cn';

type ArrowIconProps = {
  className?: string;
};

export const ArrowIcon = ({ className }: ArrowIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 24 24"
      className={cn('stroke-black dark:stroke-white fill-black dark:fill-white w-6 h-6', className)}
    >
      <path
        stroke="currentColour"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M6 12h12m0 0l-5-5m5 5l-5 5"
      />
    </svg>
  );
};
