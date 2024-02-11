import { cn } from '@/cn';

type TextIconProps = {
  className?: string;
};

export const TextIcon = ({ className }: TextIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={cn('stroke-black dark:stroke-white w-8 h-8', className)}
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 3v18m-3 0h6m4-15V3H5v3"
      />
    </svg>
  );
};
