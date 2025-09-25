import { Card, CardProps } from 'antd';
import React from 'react';
import './style.less';

interface EnhancedCardProps extends CardProps {
  gradient?: 'primary' | 'secondary' | 'accent';
  elevation?: 'low' | 'medium' | 'high';
}

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  gradient = 'primary',
  elevation = 'medium',
  className = '',
  ...props
}) => {
  const gradientClass = `gradient-${gradient}`;
  const elevationClass = `elevation-${elevation}`;

  return (
    <Card
      className={`enhanced-card ${gradientClass} ${elevationClass} ${className}`}
      {...props}
    />
  );
};

export default EnhancedCard;