import { Tooltip, Button } from '@arco-design/web-react';

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

  if (variant === 'icon-only') {
    return (
      <Tooltip content={"点赞"}>
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`flex items-center cursor-pointer space-x-1 text-sm transition-colors duration-200 ${
            isStarred ? 'text-purple-500' : 'text-gray-500 hover:text-purple-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          title={"点赞"}
        >
          <i className="iconfont icon-appreciatefill"></i>
          {showCount && <span>{starCount}</span>}
        </button>
      </Tooltip>
    );
  }

  const baseClassName = `${
    isStarred ? 'text-purple-500' : 'text-gray-500 hover:text-purple-600'
  } cursor-pointer space-x-1 py-1 rounded text-base shadow-sm hover:shadow-md transition-all duration-200 flex items-center`;

  return (
    <Tooltip content={"点赞"}>
      <Button
        onClick={onToggle}
        disabled={disabled}
        size={size}
        className={`${baseClassName} ${className}`}
        title={"点赞"}
        icon={<i className="iconfont icon-appreciatefill"></i>}
      >
        {showCount && starCount}
      </Button>
    </Tooltip>
  );
}