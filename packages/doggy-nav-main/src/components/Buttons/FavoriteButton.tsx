import { Tooltip, Button } from '@arco-design/web-react';
import { IconHeartFill } from '@arco-design/web-react/icon';
import { useAtom } from 'jotai';
import { isAuthenticatedAtom } from '@/store/store';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'mini' | 'small' | 'default' | 'large';
  variant?: 'button' | 'icon-only';
  className?: string;
}

export default function FavoriteButton({
  isFavorite,
  onToggle,
  disabled = false,
  size = 'default',
  variant = 'button',
  className = '',
}: FavoriteButtonProps) {
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);

  // Don't render if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const baseClassName = `${
    isFavorite ? 'right:text-red-500' : 'right:text-gray-500 hover:right:text-red-600'
  } cursor-pointer space-x-1 py-1 rounded text-base shadow-sm hover:shadow-md transition-all duration-200 flex items-center`;

  const tooltipContent = isFavorite ? "取消收藏" : "收藏";

  if (variant === 'icon-only') {
    return (
      <Tooltip content={tooltipContent}>
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`flex cursor-pointer items-center text-sm transition-colors duration-200 ${
            isFavorite ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          title={tooltipContent}
        >
          <IconHeartFill fontSize={16} />
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={tooltipContent}>
      <Button
        onClick={onToggle}
        disabled={disabled}
        size={size}
        className={`${baseClassName} ${className}`}
        title={tooltipContent}
        icon={<IconHeartFill />}
      />
    </Tooltip>
  );
}