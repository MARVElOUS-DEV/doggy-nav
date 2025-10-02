interface ViewCounterProps {
  viewCount: number;
  size?: 'small' | 'default' | 'large';
  className?: string;
}

export default function ViewCounter({
  viewCount,
  size = 'default',
  className = '',
}: ViewCounterProps) {
  const sizeClasses = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base',
  };

  return (
    <div className={`flex items-center space-x-1 ${sizeClasses[size]} text-blue-500 ${className}`}>
      <i className="iconfont icon-attentionfill"></i>
      <span>{viewCount}</span>
    </div>
  );
}