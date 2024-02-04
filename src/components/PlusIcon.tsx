'use client';
export const PlusIcon = () => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4">
      <path
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M0 0h24v24H0z"
        transform="translate(12 12) translate(-12 -12)"
      ></path>
      <path
        fill="none"
        stroke="#FFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M0 -7L0 7"
        transform="translate(12 12) translate(-.5 -.5)"
      ></path>
      <path
        fill="none"
        stroke="#FFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M-7 0L7 0"
        transform="translate(12 12) translate(-.5 -.5)"
      ></path>
    </svg>
  );
};
