import { useState, useEffect, useRef } from 'react';

interface FilePathAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  files: Array<{ path: string }>;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function FilePathAutocomplete({
  value,
  onChange,
  files,
  placeholder = 'Start typing to search files...',
  disabled = false,
  loading = false,
}: FilePathAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredFiles, setFilteredFiles] = useState<Array<{ path: string }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter files based on input
  useEffect(() => {
    if (!value.trim()) {
      setFilteredFiles([]);
      setIsOpen(false);
      return;
    }

    const query = value.toLowerCase();
    const matches = files
      .filter((file) => file.path.toLowerCase().includes(query))
      .slice(0, 50); // Limit to 50 results

    setFilteredFiles(matches);
    setIsOpen(matches.length > 0);
    setSelectedIndex(0);
  }, [value, files]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredFiles.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          selectFile(filteredFiles[selectedIndex].path);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Select a file
  const selectFile = (path: string) => {
    onChange(path);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (filteredFiles.length > 0) setIsOpen(true);
        }}
        disabled={disabled || loading}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder={loading ? 'Loading files...' : placeholder}
      />

      {isOpen && filteredFiles.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
        >
          {filteredFiles.map((file, index) => (
            <button
              key={file.path}
              type="button"
              onClick={() => selectFile(file.path)}
              className={`
                w-full text-left px-3 py-2 cursor-pointer
                ${index === selectedIndex ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                hover:bg-blue-50 hover:text-blue-900
              `}
            >
              <span className="block truncate font-mono text-xs">
                {file.path}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
