'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';

interface DropdownProps {
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  placeholder,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-0.5 sm:gap-1 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border border-[var(--base-border)] bg-transparent text-xs sm:text-sm font-semibold text-white hover:bg-white/5 transition-colors"
      >
        <span className="truncate max-w-[60px] sm:max-w-none">{selectedOption?.label || label}</span>
        <ChevronDownIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-[#9b9b9b] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 py-1.5 sm:py-2 min-w-[140px] sm:min-w-[160px] max-h-[280px] overflow-y-auto bg-[var(--base-fill-1)] border border-[var(--base-border)] rounded-xl shadow-xl z-50 animate-fade-in">
          {placeholder && (
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
              }}
              className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm hover:bg-white/10 transition-colors ${
                !value ? 'text-[var(--accent-blue)]' : 'text-[var(--text-dark-secondary)]'
              }`}
            >
              {placeholder}
            </button>
          )}
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left text-xs sm:text-sm hover:bg-white/10 transition-colors ${
                value === option.value ? 'text-[var(--accent-blue)]' : 'text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

