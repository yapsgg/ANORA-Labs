import { useAppStore } from '@/app/workflow/store';

/**
 * Returns true when 2+ non-comment nodes are selected (multi-selection mode).
 * Uses a primitive boolean return so Zustand only triggers re-renders
 * when the value actually changes.
 */
export function useIsMultiSelected(): boolean {
  return useAppStore((s) => {
    let count = 0;
    for (const n of s.nodes) {
      if (n.selected && n.type !== 'comment-node') {
        count++;
        if (count >= 2) return true;
      }
    }
    return false;
  });
}
