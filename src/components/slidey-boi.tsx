type SlideyBoiProps = JSX.IntrinsicElements['input'] & {
  label: string;
};

export const SlideyBoi = ({ type: _type, id, label, value, ...passthrough }: SlideyBoiProps) => (
  <div className="flex flex-row gap-2 justify-between">
    <div className="flex gap-2">
      <label htmlFor={id}>{label}</label>
      <span className="font-mono text-[#a0a0a0] bg-[#f1f1f3] dark:bg-[#121212] border border-[#e4e4e7] dark:border-[#2e2e2e] rounded px-2 py-1 text-xs">
        {value}
      </span>
    </div>
    <input className="accent-[#7e7e7e]" id={id} type="range" value={value} {...passthrough} />
  </div>
);
