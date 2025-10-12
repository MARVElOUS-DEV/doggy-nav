import { useState, useRef, useEffect } from 'react';
import { Input } from '@arco-design/web-react';
import { IconSearch, IconClose } from '@arco-design/web-react/icon';
import { useRouter } from 'next/router';
import { RefInputType } from '@arco-design/web-react/es/Input/interface';
import { useTranslation } from 'react-i18next';

interface AppSearchProps {
  onClose?: () => void;
}

export default function AppSearch({ onClose }: AppSearchProps) {
  const { t } = useTranslation();
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
        placeholder={t('search_placeholder')}
        value={searchValue}
        onChange={handleSearch}
        prefix={
          <div
            className="transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            <IconSearch />
          </div>
        }
        suffix={
          <div className="flex items-center">
            {searchValue && (
              <button
                className="cursor-pointer p-1 transition-opacity"
                style={{ color: 'var(--color-muted-foreground)' }}
                onClick={() => setSearchValue('')}
                aria-label={t('clear_search')}
              >
                <IconClose />
              </button>
            )}
            <button
              className="cursor-pointer p-1 ml-2 transition-opacity"
              onClick={onClose}
              aria-label={t('close_search')}
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <IconClose />
            </button>
          </div>
        }
        className="w-full py-3 px-6 text-base rounded-2xl transition-all shadow-lg"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-foreground)'
        }}
        onPressEnter={handleSearchSubmit}
      />
    </div>
  );
}
