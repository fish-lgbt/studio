type SidebarProps = {
  groups: (false | (false | JSX.Element)[])[];
  disabled: boolean;
  name: string;
};

export const Sidebar = ({ disabled, groups, name }: SidebarProps) => {
  return (
    <div className="relative h-fit self-center text-black dark:text-white text-sm w-full">
      {!disabled && <div className="z-10 w-full h-full bg-black bg-opacity-80 absolute rounded cursor-not-allowed" />}
      <div className="bg-white dark:bg-[#181818] border border-[#14141414] flex flex-col gap-2 h-fit w-full rounded">
        <div className="flex flex-row w-full p-2 border-[#dadada] bg-[#f1f1f3] dark:bg-[#0e0e0e]">
          <span className="font-semibold">{name}</span>
        </div>
        {groups.filter(Boolean).map((group, groupIndex) => {
          if (!group) return null;
          const nodes = group.filter(Boolean);

          return (
            <div key={`${name}-${groupIndex}`}>
              {nodes.map((node, index) => (
                <div key={`${name}-${groupIndex}-${index}`} className="p-2 overflow-y-scroll">
                  {node}
                </div>
              ))}
              {groupIndex < groups.filter(Boolean).length - 1 && (
                <hr className="border-[0.5px] border-[#dbdbdb] dark:border-[#2a2a2a]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
