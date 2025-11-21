import { Tooltip, Button } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { ThumbsUp } from 'lucide-react';

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

  const activeColor = 'var(--color-red-500)';
  const inactiveColor = 'var(--color-muted-foreground)';

  if (variant === 'icon-only') {
    const ButtonContent = (
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`inline-flex items-center cursor-pointer space-x-1 text-sm transition-opacity duration-200 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
        } ${className}`}
        title={t('like')}
        style={{ color: isStarred ? activeColor : inactiveColor }}
      >
        <ThumbsUp size={14} />
        {showCount && <span>{starCount}</span>}
      </button>
    );

    if (disabled) {
      return (
        <Tooltip content={t('like')}>
          <span className="inline-flex items-center">{ButtonContent}</span>
        </Tooltip>
      );
    }

    return <Tooltip content={t('like')}>{ButtonContent}</Tooltip>;
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
          borderColor: 'var(--color-border)',
        }}
        icon={<ThumbsUp size={14} />}
      >
        {showCount && starCount}
      </Button>
    </Tooltip>
  );
}
