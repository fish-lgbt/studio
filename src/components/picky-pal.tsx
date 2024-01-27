type Option = {
  key: string;
  value: string;
};

type PickyPalProps = JSX.IntrinsicElements['select'] & {
  options: Option[];
  label: string;
};

export const PickyPal = ({ options, id, label, ...passthrough }: PickyPalProps) => {
  return (
    <div className="flex flex-row gap-2 justify-between">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="py-1 border bg-[#f1f1f3] dark:bg-[#222327] border-[#e4e4e7] dark:border-[#2e2e2e] rounded-sm text-[#2e2e2e] dark:text-[#f1f1f3]"
        {...passthrough}
      >
        {options.map((option) => (
          <option key={option.key} value={option.value}>
            {option.key}
          </option>
        ))}
      </select>
    </div>
  );
};
