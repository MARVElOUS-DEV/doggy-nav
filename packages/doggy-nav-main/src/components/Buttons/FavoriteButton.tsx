import { Tooltip, Button } from '@arco-design/web-react';
import { IconHeartFill } from '@arco-design/web-react/icon';
import { useAtom } from 'jotai';
import { isAuthenticatedAtom } from '@/store/store';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const activeColor = 'var(--color-red-500)';
  const inactiveColor = 'var(--color-muted-foreground)';

  // Don't render if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const baseClassName = `cursor-pointer space-x-1 py-1 rounded text-base shadow-sm hover:shadow-md transition-all duration-200 flex items-center`;

  const tooltipContent = isFavorite ? t('unfavorite') : t('favorite');

  if (variant === 'icon-only') {
    return (
      <Tooltip content={tooltipContent}>
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`flex cursor-pointer items-center text-sm transition-opacity duration-200 bg-transparent p-1 rounded-full ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
          } ${className}`}
          title={tooltipContent}
          style={{
            color: isFavorite ? activeColor : inactiveColor,
            backgroundColor: isFavorite
              ? `color-mix(in srgb, ${activeColor} 15%, transparent)`
              : 'transparent',
          }}
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
        style={{
          color: isFavorite ? activeColor : inactiveColor,
          backgroundColor: 'transparent',
          borderColor: 'var(--color-border)'
        }}
        title={tooltipContent}
        icon={<IconHeartFill />}
      />
    </Tooltip>
  );
}