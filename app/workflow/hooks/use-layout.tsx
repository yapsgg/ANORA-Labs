'use client';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { layoutGraph } from '@/app/workflow/utils/layout-helper';
import { useAppStore } from '@/app/workflow/store';
import { AppStore } from '@/app/workflow/store/app-store';

const selector = (state: AppStore) => ({
  getNodes: state.getNodes,
  setNodes: state.setNodes,
  getEdges: state.getEdges,
});

export function useLayout() {
  const { getNodes, getEdges, setNodes } = useAppStore(useShallow(selector));

  return useCallback(async () => {
    const layoutedNodes = await layoutGraph(getNodes(), getEdges());
    setNodes(layoutedNodes);
  }, [getEdges, getNodes, setNodes]);
}
