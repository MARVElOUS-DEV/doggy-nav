import { useState, useRef, useEffect } from 'react';
import { Input } from '@arco-design/web-react';
import { IconSearch, IconClose } from '@arco-design/web-react/icon';
import { useRouter } from 'next/router';
import { RefInputType } from '@arco-design/web-react/es/Input/interface';

interface AppSearchProps {
  onClose?: () => void;
}

export default function AppSearch({ onClose }: AppSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<RefInputType>(null);
  const router = useRouter();

  useEffect(() => {
    if (inputRef?.current) {
      inputRef?.current.focus();
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && searchValue.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEsc);
    const targetEl = (inputRef?.current as any)?.dom ?? (inputRef?.current as unknown as HTMLElement);
    if (targetEl) {
      targetEl.addEventListener('keydown', handleEnter as any);
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      if (targetEl) {
        targetEl.removeEventListener('keydown', handleEnter as any);
      }
    };
  }, [onClose, searchValue, router]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = () => {
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      onClose?.();
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      <Input
        ref={inputRef}
        placeholder="搜索网站..."
        value={searchValue}
        onChange={handleSearch}
        prefix={
          <div className="text-blue-500">
            <IconSearch />
          </div>
        }
        suffix={
          <div className="flex items-center">
            {searchValue && (
              <button
                className="cursor-pointer text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setSearchValue('')}
                aria-label="清除搜索"
              >
                <IconClose />
              </button>
            )}
            <button
              className="cursor-pointer text-gray-400 hover:text-gray-600 p-1 ml-2"
              onClick={onClose}
              aria-label="关闭搜索"
            >
              <IconClose />
            </button>
          </div>
        }
        className="w-full py-3 px-6 text-base rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-lg bg-white"
        onPressEnter={handleSearchSubmit}
      />
    </div>
  );
}
