import React from 'react';
import { IconSearch, IconClose } from '@arco-design/web-react/icon';
import type { SearchInputProps } from './types';

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = 'Search...' }) => {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-colors focus-within:border-blue-400"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <IconSearch className="text-sm flex-shrink-0" style={{ color: 'var(--color-muted-foreground)' }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm bg-transparent border-none outline-none"
        style={{ color: 'var(--color-foreground)' }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex-shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <IconClose className="text-xs" style={{ color: 'var(--color-muted-foreground)' }} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
