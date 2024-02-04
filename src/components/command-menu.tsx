import { useEffect, useState } from 'react';
import Fuse from 'fuse.js';
import FocusTrap from 'focus-trap-react';
import { cn } from '@/cn';

const DefaultIcon = () => {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
};

type Command = {
  name: string;
  icon?: JSX.Element;
  description: string;
  action: () => void;
};

const useCommandMenu = (commands: Command[]) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [filteredCommands, setFilteredCommands] = useState<Command[]>(commands);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Open/close the command menu
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(!isOpen);

        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const fuse = new Fuse(commands, {
      keys: ['name', 'description'],
      includeScore: true,
      threshold: 0.3,
    });

    if (!inputValue) {
      setFilteredCommands(commands);
      return;
    }

    const results = fuse.search(inputValue).map((result) => result.item);
    setFilteredCommands(results);
  }, [commands, inputValue]);

  return { isOpen, setIsOpen, inputValue, setInputValue, filteredCommands };
};

type CommandMenuProps = {
  commands: Command[];
};

export const CommandMenu = ({ commands }: CommandMenuProps) => {
  const { isOpen, setIsOpen, inputValue, setInputValue, filteredCommands } = useCommandMenu(commands);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedCommandIndex(0); // Reset selection when menu opens
    }
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent page scrolling
      setSelectedCommandIndex((prevIndex) => (prevIndex + 1) % filteredCommands.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent page scrolling
      setSelectedCommandIndex((prevIndex) => (prevIndex - 1 + filteredCommands.length) % filteredCommands.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      filteredCommands[selectedCommandIndex].action();
      setIsOpen(false);
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40" />}
      <FocusTrap>
        <div
          className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50"
          onKeyDown={handleKeyDown} // Handle key down events here
        >
          <div className="bg-white dark:bg-[#181818] border border-[#14141414] rounded p-4 max-w-md w-full">
            <input
              type="text"
              className="border p-2 w-full rounded text-black"
              placeholder="Search commands"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus // Automatically focus the input when the menu opens
            />
            <ul className="mt-2">
              {filteredCommands.map((command, index) => (
                <li
                  key={index}
                  className={cn(
                    'flex flex-row gap-2 p-2 cursor-pointer items-center',
                    // Highlight the selected command
                    index === selectedCommandIndex && 'bg-[#2c2c2c]',
                  )}
                  onClick={() => {
                    command.action();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedCommandIndex(index)}
                  onFocus={() => setSelectedCommandIndex(index)}
                >
                  {command.icon ?? <DefaultIcon />} {command.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </FocusTrap>
    </>
  );
};
