import DoggyImage from '@/components/DoggyImage';
import { NavItem } from '@/types';
import { useTranslation } from 'react-i18next';

export default function FavoriteItem({ item }: { item: NavItem }) {
  const { t } = useTranslation('translation');
  return (
    <div
      className="flex flex-col items-center group cursor-pointer transform transition-all duration-200 hover:scale-110"
      onClick={() => {
        window.open(item.href, '_blank', 'noopener,noreferrer');
      }}
    >
      <div className="w-16 h-16 bg-white rounded-xl shadow-lg p-2 mb-2 flex items-center justify-center group-hover:shadow-xl transition-shadow duration-200">
        {item.logo ? (
          <DoggyImage
            logo={item.logo}
            name={item.name}
            className="rounded-full flex-shrink-0 w-[48px] h-[48px] object-contain"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {item.name?.charAt(0) || 'W'}
          </div>
        )}
      </div>
      <span className="text-sm text-center text-gray-700 font-medium max-w-full truncate">
        {item.name}
      </span>
      <span className="text-xs text-center text-gray-500 mt-1 max-w-full truncate">
        {item.categoryName || t('uncategorized')}
      </span>
    </div>
  );
}
