import DoggyImage from '@/components/DoggyImage';
import { NavItem } from '@/types';
import { useTranslation } from 'react-i18next';

export default function FolderTile({
  items,
  name,
  onClick,
}: {
  items: NavItem[];
  name?: string;
  onClick?: () => void;
}) {
  const { t } = useTranslation('translation');
  const preview = items.slice(0, 4);
  return (
    <div
      className="flex flex-col items-center select-none cursor-pointer hover:scale-105 transition-transform duration-150"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick();
        }
      }}
    >
      <div className="w-16 h-16 bg-white rounded-2xl shadow-lg p-1.5 mb-2 grid grid-cols-2 grid-rows-2 gap-1">
        {preview.map((it, idx) => {
          const key = String((it as any).id ?? (it as any).href ?? `${it.name ?? 'item'}-${idx}`);
          return (
            <div
              key={key}
              className="w-full h-full rounded-md bg-white overflow-hidden flex items-center justify-center"
            >
              {it.logo ? (
                <DoggyImage
                  logo={it.logo}
                  name={it.name}
                  className="flex-shrink-0 w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {it.name?.charAt(0) || 'W'}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className="text-sm text-center text-gray-700 font-medium max-w-full truncate">
        {name || t('folder')}
      </span>
      <span className="text-xs text-center text-gray-500 mt-1 max-w-full truncate">
        {items.length} {t('items')}
      </span>
    </div>
  );
}
