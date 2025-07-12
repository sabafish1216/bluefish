import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDrawerResizeOptions {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
}

export const useDrawerResize = ({ defaultWidth, minWidth, maxWidth }: UseDrawerResizeOptions) => {
  const [drawerWidth, setDrawerWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = drawerWidth;
  }, [drawerWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
    setDrawerWidth(newWidth);
  }, [isResizing, minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setDrawerWidth(defaultWidth);
  }, [defaultWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return {
    drawerWidth,
    isResizing,
    handleMouseDown,
    handleDoubleClick
  };
}; 