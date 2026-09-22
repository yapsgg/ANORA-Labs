import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid';
import { getCaretPosition } from '../utils/caret-position';
import { useAppStore } from '../store';
import { createEdge, type AppEdge } from '../components/edges';
import type { AppNode } from '../components/nodes';
import type { AppStore } from '../store/app-store';

function truncateLabel(label: string, maxLen = 14): string {
  return label.length > maxLen ? label.slice(0, maxLen).trimEnd() + '…' : label;
}

export type MentionNodeType = 'text' | 'image' | 'video';

export interface MentionItem {
  id: string;
  label: string;
  type: 'source';
  /** What kind of source this is — used for icon prefix in token + dropdown */
  nodeType?: MentionNodeType;
  /** Thumbnail URL when the node has produced an image */
  imageUrl?: string;
  /** True when this source is already connected to the current node's input */
  alreadyConnected?: boolean;
}

interface MentionState {
  isOpen: boolean;
  items: MentionItem[];
  selectedIndex: number;
}

interface DropdownPosition {
  top: number;
  left: number;
}

interface UseMentionOptions {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  currentNodeId: string;
}

interface UseMentionReturn {
  mentionState: MentionState;
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
  handleChange: (newValue: string) => void;
  selectItem: (item: MentionItem) => void;
  closeMention: () => void;
  dropdownPosition: DropdownPosition;
}

const CLOSED_STATE: MentionState = {
  isOpen: false,
  items: [],
  selectedIndex: 0,
};

function getMentionNodeType(node: AppNode): MentionNodeType | null {
  switch (node.type) {
    case 'generate-text-node':
      return 'text';
    case 'generate-image-node':
      return 'image';
    case 'generate-video-node':
      return 'video';
    default:
      return null;
  }
}

function getNodeImageUrl(node: AppNode): string | undefined {
  const data = node.data as { image?: string } | undefined;
  if (!data?.image) return undefined;
  return data.image.startsWith('http')
    ? data.image
    : `data:image/png;base64,${data.image}`;
}

function getNodeLabel(node: AppNode, fallbackPrefix: string): string {
  const raw = (node.data as { label?: string } | undefined)?.label?.trim();
  return raw || `${fallbackPrefix} ${node.id.slice(0, 4)}`;
}

const PREFIX_FALLBACK: Record<MentionNodeType, string> = {
  text: 'Text',
  image: 'Image',
  video: 'Video',
};

const storeSelector = (s: AppStore) => ({
  nodes: s.nodes,
  edges: s.edges,
  addEdge: s.addEdge,
  removeEdge: s.removeEdge,
});

/** Internal record of a mention inserted via the dropdown */
interface MentionRef {
  /** Source nodeId */
  nodeId: string;
  /** The token text inserted (e.g. "@Image abcd") */
  token: string;
  /** Edge created for this mention; null if an edge already existed */
  edgeId: string | null;
}

export function useMention({
  textareaRef,
  value,
  onChange,
  currentNodeId,
}: UseMentionOptions): UseMentionReturn {
  const [mentionState, setMentionState] = useState<MentionState>(CLOSED_STATE);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0 });
  const triggerIndexRef = useRef<number>(-1);

  const {
    nodes,
    edges,
    addEdge: addEdgeAction,
    removeEdge: removeEdgeAction,
  } = useAppStore(useShallow(storeSelector));

  // Refs created by selecting an item from the dropdown — used to remove the
  // auto-created edge when the user deletes the mention from the textarea.
  const mentionRefsRef = useRef<MentionRef[]>([]);

  // Reconcile mention refs against the textarea value. Any ref whose token is
  // no longer present gets dropped, and the edge it created is removed.
  useEffect(() => {
    const refs = mentionRefsRef.current;
    if (refs.length === 0) return;
    const next: MentionRef[] = [];
    let changed = false;
    for (const ref of refs) {
      if (value.includes(ref.token)) {
        next.push(ref);
      } else {
        changed = true;
        if (ref.edgeId) removeEdgeAction(ref.edgeId);
      }
    }
    if (changed) mentionRefsRef.current = next;
  }, [value, removeEdgeAction]);

  // Nodes downstream of currentNodeId — connecting any of these would create a cycle
  const downstreamIds = useMemo(() => {
    const reachable = new Set<string>();
    const stack: string[] = [currentNodeId];
    while (stack.length) {
      const id = stack.pop()!;
      for (const e of edges) {
        if (e.source === id && !reachable.has(e.target)) {
          reachable.add(e.target);
          stack.push(e.target);
        }
      }
    }
    return reachable;
  }, [edges, currentNodeId]);

  const connectedSourceIds = useMemo(() => {
    const set = new Set<string>();
    for (const e of edges) {
      if (e.target === currentNodeId && (e.targetHandle ?? 'input') === 'input') {
        set.add(e.source);
      }
    }
    return set;
  }, [edges, currentNodeId]);

  const candidates = useMemo<MentionItem[]>(() => {
    const items: MentionItem[] = [];
    for (const node of nodes) {
      if (node.id === currentNodeId) continue;
      const nodeType = getMentionNodeType(node);
      if (!nodeType) continue; // skip comment/layer-editor/etc
      if (downstreamIds.has(node.id)) continue; // would create a cycle
      const label = getNodeLabel(node, PREFIX_FALLBACK[nodeType]);
      items.push({
        id: node.id,
        label,
        type: 'source',
        nodeType,
        imageUrl: getNodeImageUrl(node),
        alreadyConnected: connectedSourceIds.has(node.id),
      });
    }
    // Stable order: connected first, then by node-type, then label
    const typeOrder: Record<MentionNodeType, number> = { text: 0, image: 1, video: 2 };
    items.sort((a, b) => {
      if (!!a.alreadyConnected !== !!b.alreadyConnected) {
        return a.alreadyConnected ? -1 : 1;
      }
      const ta = a.nodeType ? typeOrder[a.nodeType] : 99;
      const tb = b.nodeType ? typeOrder[b.nodeType] : 99;
      if (ta !== tb) return ta - tb;
      return a.label.localeCompare(b.label);
    });
    return items;
  }, [nodes, currentNodeId, downstreamIds, connectedSourceIds]);

  const closeMention = useCallback(() => {
    setMentionState(CLOSED_STATE);
    triggerIndexRef.current = -1;
  }, []);

  const updateDropdownPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const caretPos = getCaretPosition(textarea);
    setDropdownPosition(caretPos);
  }, [textareaRef]);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);

      const textarea = textareaRef.current;
      if (!textarea) return;

      // Use setTimeout so selectionStart reflects the new value
      setTimeout(() => {
        const cursorPos = textarea.selectionStart ?? 0;

        // Scan backward from cursor for @ trigger char
        let triggerIdx = -1;

        for (let i = cursorPos - 1; i >= 0; i--) {
          const ch = newValue[i];
          if (ch === ' ' || ch === '\n') break;
          if (ch === '@') {
            if (i === 0 || newValue[i - 1] === ' ' || newValue[i - 1] === '\n') {
              triggerIdx = i;
            }
            break;
          }
        }

        if (triggerIdx === -1) {
          if (mentionState.isOpen) closeMention();
          return;
        }

        const query = newValue.substring(triggerIdx + 1, cursorPos).toLowerCase();
        const filtered = query
          ? candidates.filter((item) => item.label.toLowerCase().includes(query))
          : candidates;

        triggerIndexRef.current = triggerIdx;

        setMentionState({
          isOpen: true,
          items: filtered,
          selectedIndex: 0,
        });

        updateDropdownPosition();
      }, 0);
    },
    [onChange, textareaRef, candidates, mentionState.isOpen, closeMention, updateDropdownPosition],
  );

  const selectItem = useCallback(
    (item: MentionItem) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart ?? 0;
      const triggerIdx = triggerIndexRef.current;
      if (triggerIdx === -1) return;

      const token = `@${truncateLabel(item.label)}`;

      const before = value.substring(0, triggerIdx);
      const after = value.substring(cursorPos);
      const newValue = before + token + ' ' + after;

      onChange(newValue);
      closeMention();

      // Auto-connect the mentioned node to the current node if not already connected.
      // Track the ref so deleting the mention text removes the edge we created.
      const existing = edges.find(
        (e) =>
          e.source === item.id &&
          e.target === currentNodeId &&
          (e.targetHandle ?? 'input') === 'input',
      );
      let edgeId: string | null = null;
      if (!existing) {
        const newEdge: AppEdge = {
          ...createEdge(item.id, currentNodeId, 'output', 'input'),
          id: `edge-${nanoid()}`,
        };
        addEdgeAction(newEdge);
        edgeId = newEdge.id;
      }
      mentionRefsRef.current = [
        ...mentionRefsRef.current,
        { nodeId: item.id, token, edgeId },
      ];

      // Restore focus and cursor position after insertion
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = triggerIdx + token.length + 1;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [textareaRef, value, onChange, closeMention, edges, addEdgeAction, currentNodeId],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!mentionState.isOpen) return false;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionState((prev) => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.items.length - 1),
        }));
        return true;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionState((prev) => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, 0),
        }));
        return true;
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        if (mentionState.items.length > 0) {
          e.preventDefault();
          selectItem(mentionState.items[mentionState.selectedIndex]);
          return true;
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeMention();
        return true;
      }

      return false;
    },
    [mentionState, selectItem, closeMention],
  );

  return {
    mentionState,
    handleKeyDown,
    handleChange,
    selectItem,
    closeMention,
    dropdownPosition,
  };
}
