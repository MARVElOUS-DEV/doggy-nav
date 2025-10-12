import { Tooltip, Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

interface StarButtonProps {
  isStarred: boolean;
  starCount: number;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'mini' | 'small' | 'default' | 'large';
  variant?: 'button' | 'icon-only';
  className?: string;
  showCount?: boolean;
}

export default function StarButton({
  isStarred,
  starCount,
  onToggle,
  disabled = false,
  size = 'default',
  variant = 'icon-only',
  className = '',
  showCount = true,
}: StarButtonProps) {
  const { t } = useTranslation();

  const activeColor = 'var(--color-primary)';
  const inactiveColor = 'var(--color-muted-foreground)';

  if (variant === 'icon-only') {
    return (
      <Tooltip content={t('like')}>
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`flex items-center cursor-pointer space-x-1 text-sm transition-opacity duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
          } ${className}`}
          title={t('like')}
          style={{ color: isStarred ? activeColor : inactiveColor }}
        >
          <i className="iconfont icon-appreciatefill"></i>
          {showCount && <span>{starCount}</span>}
        </button>
      </Tooltip>
    );
  }

  const baseClassName = `cursor-pointer space-x-1 py-1 rounded text-base shadow-sm hover:shadow-md transition-all duration-200 flex items-center`;

  return (
    <Tooltip content={t('like')}>
      <Button
        onClick={onToggle}
        disabled={disabled}
        size={size}
        className={`${baseClassName} ${className}`}
        title={t('like')}
        style={{
          color: isStarred ? activeColor : inactiveColor,
          backgroundColor: 'transparent',
          borderColor: 'var(--color-border)'
        }}
        icon={<i className="iconfont icon-appreciatefill"></i>}
      >
        {showCount && starCount}
      </Button>
    </Tooltip>
  );
}