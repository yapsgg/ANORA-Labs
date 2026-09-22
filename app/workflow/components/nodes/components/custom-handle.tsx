'use client'

import { Handle, type HandleProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

type CustomHandleProps = HandleProps & {
  isVisible?: boolean;
};

export const PureCustomHandle = ({
  type,
  position,
  id,
  isVisible = false,
  style,
  className,
  ...rest
}: CustomHandleProps) => {
  // Use type-based ID if not provided (source/target)
  const handleId = id ?? type;

  return (
    <Handle
      type={type}
      position={position}
      id={handleId}
      isConnectable={true}
      className={cn(
        'opacity-0 transition-opacity duration-300',
        className
      )}
      style={{
        width: 8,
        height: 8,
        minWidth: 8,
        minHeight: 8,
        marginRight: 0,
        marginLeft: 0,
        backgroundColor: 'transparent',
        border: 'none',
        ...style
      }}
      {...rest}
    />
  );
}

export const CustomHandle = memo(PureCustomHandle);