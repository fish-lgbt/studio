'use client';
import { Button } from './button';
import { cn } from '@/cn';

type Tool = {
  /**
   * Name of the tool
   */
  name: string;
  /**
   * Icon for the tool
   */
  icon: React.ReactNode;
  /**
   * Function to call when the tool is clicked
   */
  onClick: () => void;
  /**
   * Description of the tool
   */
  description?: string;
  /*
   * Keyboard shortcut for the tool
   */
  shortcut?: string;
  /**
   * Whether the tool is active
   */
  isActive?: boolean;
  /**
   * Properties panel for the tool
   */
  properties?: React.ReactNode;
};

type MenuBarProps<Tools extends Tool[]> = {
  tools: Tools;
  activeTool: string;
  onToolChange: (tool: string) => void;
};

const MenuBar = <Tools extends Tool[]>({ tools, activeTool, onToolChange }: MenuBarProps<Tools>) => {
  return (
    <div className="absolute md:top-1 flex justify-center w-full">
      <div className="relative flex flex-row gap-2 w-full md:w-fit overflow-x-scroll justify-center bg-white dark:bg-[#181818] border border-[#14141414] md:rounded p-2">
        {tools.map((tool) => (
          <Button
            key={tool.name}
            onClick={() => {
              // Update the active tool
              onToolChange(tool.name);

              // Call the tool's onClick function
              tool.onClick();
            }}
            active={tool.isActive}
            className="relative rounded"
          >
            <div className="p-2">
              {tool.icon}
              {tool.shortcut !== undefined && <sub className="bottom-2 right-2 text-[10px] absolute">{tool.shortcut}</sub>}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

type ToolPropertiesProps = {
  tools: Tool[];
  activeTool: string;
};

const ToolProperties = ({ tools, activeTool }: ToolPropertiesProps) => {
  const tool = tools.find((tool) => tool.name === activeTool);
  if (!tool || !tool.properties) return null;

  return (
    <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-[250px]">
      <div className="relative flex flex-row gap-2 w-fit bg-white dark:bg-[#181818] border border-[#14141414] rounded p-2">
        {tool.properties}
      </div>
    </div>
  );
};

type ToolsProps = {
  className?: string;
  tools: Tool[];
  activeTool: string;
  onToolChange: (tool: string) => void;
};

export const Tools = ({ className, tools, activeTool, onToolChange }: ToolsProps) => {
  return (
    <div className={cn(className)}>
      {/* Menu bar */}
      <MenuBar tools={tools} activeTool={activeTool} onToolChange={onToolChange} />
      {/* Tool properties */}
      <ToolProperties tools={tools} activeTool={activeTool} />
    </div>
  );
};
