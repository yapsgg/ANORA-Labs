'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type NodeWrapperProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  selected?: boolean;
  setIsHovered: (isHovered: boolean) => void;
  width?: number;
  minHeight?: number; 
  maxHeight?: number;
};

const NodeWrapper = React.forwardRef<HTMLDivElement, NodeWrapperProps>(
  (
    {
      children,
      selected,
      setIsHovered,
      width = 320,
      minHeight = 320,
      maxHeight = 320,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Click-outside + global mouse-leave handler (canvas pattern)
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsHovered(false);
        }
      };

      const handleGlobalMouseLeave = () => {
        setIsHovered(false);
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('mouseleave', handleGlobalMouseLeave);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('mouseleave', handleGlobalMouseLeave);
      };
    }, [setIsHovered]);

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
      const relatedTarget = e.relatedTarget;
      if (
        !relatedTarget ||
        !containerRef.current ||
        !(relatedTarget instanceof Node) ||
        !containerRef.current.contains(relatedTarget)
      ) {
        setIsHovered(false);
      }
    };

    return (
      <div
        ref={containerRef}
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Extended hover area for plus handles */}
        <div className="absolute -inset-10 z-0" />

        {/* Main node content */}
        <div
          ref={ref}
          className={cn(
            'relative rounded-lg shadow-lg bg-card dark:bg-card border',
            selected
              ? 'ring-1 ring-muted-foreground dark:ring-muted-foreground border-muted-foreground dark:border-muted-foreground transition-all ease-in-out duration-300'
              : 'border-border dark:border-border',
            'flex flex-col transition-all duration-300 ease-in-out',
            'z-10',
            className,
          )}
          style={{
            width: `${width}px`,
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            ...style,
          }}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  },
);

NodeWrapper.displayName = 'NodeWrapper';

export default NodeWrapper;
