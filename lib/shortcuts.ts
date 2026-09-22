// Centralized keyboard shortcuts management
// All shortcuts should be defined here and imported where needed

export type ModifierKey = 'meta' | 'ctrl' | 'shift' | 'alt';

export interface ShortcutDefinition {
  key: string;               // The main key (lowercase)
  modifiers?: ModifierKey[]; // Modifier keys required
  display: string;           // Human-readable display (e.g., "⌘Z", "⇧V")
  label: string;             // Action description
}

// Interface for keyboard event properties we need
interface KeyboardEventLike {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

// Check if a keyboard event matches a shortcut definition
// Works with both native KeyboardEvent and React.KeyboardEvent
export function matchesShortcut(e: KeyboardEventLike, shortcut: ShortcutDefinition): boolean {
  const key = e.key.toLowerCase();
  const modifiers = shortcut.modifiers || [];

  // Check main key
  if (key !== shortcut.key.toLowerCase()) return false;

  // Check modifier keys
  const needsMeta = modifiers.includes('meta');
  const needsCtrl = modifiers.includes('ctrl');
  const needsShift = modifiers.includes('shift');
  const needsAlt = modifiers.includes('alt');

  // For cross-platform, treat meta and ctrl as interchangeable for "command" shortcuts
  const hasCommandKey = e.metaKey || e.ctrlKey;
  const needsCommandKey = needsMeta || needsCtrl;

  if (needsCommandKey && !hasCommandKey) return false;
  if (!needsCommandKey && hasCommandKey) return false;
  if (needsShift !== e.shiftKey) return false;
  if (needsAlt !== e.altKey) return false;

  return true;
}

// Check if event target is an input element (should ignore shortcuts)
export function isInputElement(target: EventTarget | null): boolean {
  if (!target) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target as HTMLElement)?.isContentEditable === true
  );
}

// Convert ShortcutDefinition to @xyflow/react KeyCode format
// Returns array for cross-platform (Meta for Mac, Control for Windows)
export function toXYFlowKeyCode(shortcut: ShortcutDefinition): string[] {
  const modifiers = shortcut.modifiers || [];
  const parts: string[] = [];

  // For command shortcuts, return both Meta and Control variants
  const hasMeta = modifiers.includes('meta');
  const hasCtrl = modifiers.includes('ctrl');
  const hasShift = modifiers.includes('shift');
  const hasAlt = modifiers.includes('alt');

  const buildKeyCode = (useMetaOrCtrl: 'Meta' | 'Control'): string => {
    const codeParts: string[] = [];
    if (hasMeta || hasCtrl) codeParts.push(useMetaOrCtrl);
    if (hasShift) codeParts.push('Shift');
    if (hasAlt) codeParts.push('Alt');
    codeParts.push(shortcut.key);
    return codeParts.join('+');
  };

  if (hasMeta || hasCtrl) {
    // Return both variants for cross-platform support
    parts.push(buildKeyCode('Meta'));
    parts.push(buildKeyCode('Control'));
  } else {
    // No command key, just build single variant
    const codeParts: string[] = [];
    if (hasShift) codeParts.push('Shift');
    if (hasAlt) codeParts.push('Alt');
    codeParts.push(shortcut.key);
    parts.push(codeParts.join('+'));
  }

  return parts;
}

// ============================================================================
// SHORTCUT DEFINITIONS
// ============================================================================

// Pointer Tools
export const SHORTCUT_POINTER_CURSOR: ShortcutDefinition = {
  key: 'v',
  display: 'V',
  label: 'Cursor',
};

export const SHORTCUT_POINTER_HAND: ShortcutDefinition = {
  key: 'h',
  display: 'H',
  label: 'Hand tool',
};

// Block Tools (Node Creation)
export const SHORTCUT_BLOCK_TEXT: ShortcutDefinition = {
  key: 't',
  display: 'T',
  label: 'Text Block',
};

export const SHORTCUT_BLOCK_IMAGE: ShortcutDefinition = {
  key: 'i',
  display: 'I',
  label: 'Image Block',
};

export const SHORTCUT_BLOCK_VIDEO: ShortcutDefinition = {
  key: 'v',
  modifiers: ['shift'],
  display: '⇧V',
  label: 'Video Block',
};

export const SHORTCUT_BLOCK_COMMENT: ShortcutDefinition = {
  key: 'c',
  display: 'C',
  label: 'Comment',
};

// Edit Actions
export const SHORTCUT_UNDO: ShortcutDefinition = {
  key: 'z',
  modifiers: ['meta'],
  display: '⌘Z',
  label: 'Undo',
};

export const SHORTCUT_REDO: ShortcutDefinition = {
  key: 'z',
  modifiers: ['meta', 'shift'],
  display: '⌘⇧Z',
  label: 'Redo',
};

export const SHORTCUT_CUT: ShortcutDefinition = {
  key: 'x',
  modifiers: ['meta'],
  display: '⌘X',
  label: 'Cut',
};

export const SHORTCUT_COPY: ShortcutDefinition = {
  key: 'c',
  modifiers: ['meta'],
  display: '⌘C',
  label: 'Copy',
};

export const SHORTCUT_PASTE: ShortcutDefinition = {
  key: 'v',
  modifiers: ['meta'],
  display: '⌘V',
  label: 'Paste',
};

export const SHORTCUT_DELETE: ShortcutDefinition = {
  key: 'backspace',
  display: '⌫',
  label: 'Delete',
};

export const SHORTCUT_DELETE_ALT: ShortcutDefinition = {
  key: 'delete',
  display: 'Del',
  label: 'Delete',
};

export const SHORTCUT_DUPLICATE: ShortcutDefinition = {
  key: 'd',
  modifiers: ['meta'],
  display: '⌘D',
  label: 'Duplicate',
};

// Node Context Menu
export const SHORTCUT_NODE_RUN: ShortcutDefinition = {
  key: 'r',
  display: 'R',
  label: 'Run',
};

// General
export const SHORTCUT_ESCAPE: ShortcutDefinition = {
  key: 'escape',
  display: 'Esc',
  label: 'Cancel / Close',
};

export const SHORTCUT_ENTER: ShortcutDefinition = {
  key: 'enter',
  display: '↵',
  label: 'Submit / Confirm',
};

export const SHORTCUT_ENTER_NEWLINE: ShortcutDefinition = {
  key: 'enter',
  modifiers: ['shift'],
  display: '⇧↵',
  label: 'New line',
};

export const SHORTCUT_SELECT_ALL: ShortcutDefinition = {
  key: 'a',
  modifiers: ['meta'],
  display: '⌘A',
  label: 'Select All',
};

// Canvas Actions
export const SHORTCUT_EXPORT_IMAGE: ShortcutDefinition = {
  key: 'i',
  modifiers: ['meta'],
  display: '⌘I',
  label: 'Export image',
};

export const SHORTCUT_EXPORT_FLOW: ShortcutDefinition = {
  key: 'u',
  modifiers: ['meta'],
  display: '⌘U',
  label: 'Export flow',
};

export const SHORTCUT_CLEAR_CANVAS: ShortcutDefinition = {
  key: 'c',
  modifiers: ['meta', 'shift'],
  display: '⌘⇧C',
  label: 'Clear canvas',
};

export const SHORTCUT_SPOTLIGHT_SEARCH: ShortcutDefinition = {
  key: 'k',
  modifiers: ['meta'],
  display: '⌘K',
  label: 'Spotlight search',
};

export const SHORTCUT_TOGGLE_LAYERS: ShortcutDefinition = {
  key: 'l',
  display: 'L',
  label: 'Toggle layers tree',
};

export const SHORTCUT_CENTER_VIEWPORT: ShortcutDefinition = {
  key: '\\',
  display: '\\',
  label: 'Center viewport',
};

export const SHORTCUT_SHOW_HIDE_UI: ShortcutDefinition = {
  key: '\\',
  modifiers: ['meta'],
  display: '⌘\\',
  label: 'Show/Hide UI',
};

export const SHORTCUT_CHANGE_EDGE_COLOR: ShortcutDefinition = {
  key: 'p',
  display: 'P',
  label: 'Change color',
};

export const SHORTCUT_NEW_BLOCK: ShortcutDefinition = {
  key: 'n',
  display: 'N',
  label: 'New block',
};

export const SHORTCUT_BACK_TO_HOME: ShortcutDefinition = {
  key: 'h',
  modifiers: ['meta'],
  display: '⌘H',
  label: 'Back to home',
};

export const SHORTCUT_NEW_PROJECT: ShortcutDefinition = {
  key: 'n',
  modifiers: ['meta'],
  display: '⌘N',
  label: 'New project',
};

export const SHORTCUT_PERFORMANCE_MODE: ShortcutDefinition = {
  key: 'p',
  modifiers: ['meta', 'shift'],
  display: '⌘⇧P',
  label: 'Performance mode',
};

export const SHORTCUT_HELP: ShortcutDefinition = {
  key: '/',
  modifiers: ['meta'],
  display: '⌘/',
  label: 'Help and resources',
};

export const SHORTCUT_WHATS_NEW: ShortcutDefinition = {
  key: '/',
  modifiers: ['shift'],
  display: '⇧/',
  label: "What's new",
};

export const SHORTCUT_WEBCAM: ShortcutDefinition = {
  key: 'w',
  modifiers: ['alt'],
  display: '⌥W',
  label: 'Webcam',
};

export const SHORTCUT_INTERACTIVE_MOUSE: ShortcutDefinition = {
  key: "'",
  display: "'",
  label: 'Interactive mouse',
};

export const SHORTCUT_CUSTOMIZE_CANVAS: ShortcutDefinition = {
  key: '"',
  display: '"',
  label: 'Customize canvas',
};

export const SHORTCUT_IMAGE_TRANSFORMER: ShortcutDefinition = {
  key: 'j',
  display: 'J',
  label: 'Image transformer',
};

export const SHORTCUT_SAVE: ShortcutDefinition = {
  key: 's',
  modifiers: ['meta'],
  display: '⌘S',
  label: 'Save',
};

// ============================================================================
// SHORTCUT MAPPINGS
// Maps shortcut keys to node types, tool IDs, etc.
// ============================================================================

// Map of node type IDs to their shortcuts
export const NODE_SHORTCUTS: Record<string, ShortcutDefinition> = {
  'generate-text-node': SHORTCUT_BLOCK_TEXT,
  'generate-image-node': SHORTCUT_BLOCK_IMAGE,
  'generate-video-node': SHORTCUT_BLOCK_VIDEO,
};

// Map of pointer tool IDs to their shortcuts
export const POINTER_TOOL_SHORTCUTS: Record<string, ShortcutDefinition> = {
  cursor: SHORTCUT_POINTER_CURSOR,
  hand: SHORTCUT_POINTER_HAND,
};

// Map of block tool IDs to their shortcuts
export const BLOCK_TOOL_SHORTCUTS: Record<string, ShortcutDefinition> = {
  'generate-text-node': SHORTCUT_BLOCK_TEXT,
  'generate-image-node': SHORTCUT_BLOCK_IMAGE,
  'generate-video-node': SHORTCUT_BLOCK_VIDEO,
};

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// These match the old SHORTCUTS and ACTION_LABELS format
// ============================================================================

export const SHORTCUTS = {
  // Canvas actions
  EXPORT_IMAGE: SHORTCUT_EXPORT_IMAGE.display,
  EXPORT_FLOW: SHORTCUT_EXPORT_FLOW.display,
  CLEAR_CANVAS: SHORTCUT_CLEAR_CANVAS.display,
  SPOTLIGHT_SEARCH: SHORTCUT_SPOTLIGHT_SEARCH.display,
  TOGGLE_LAYERS_TREE: SHORTCUT_TOGGLE_LAYERS.display,

  // Edge actions
  CHANGE_COLOR: SHORTCUT_CHANGE_EDGE_COLOR.display,

  // Node actions
  NEW_TEXT_NODE: SHORTCUT_BLOCK_TEXT.display,
  NEW_IMAGE_NODE: SHORTCUT_BLOCK_IMAGE.display,
  NEW_IMAGE_TRANSFORMER_NODE: SHORTCUT_IMAGE_TRANSFORMER.display,
  NEW_VIDEO_NODE: SHORTCUT_BLOCK_VIDEO.display,
  WEBCAM: SHORTCUT_WEBCAM.display,

  // General actions
  UNDO: SHORTCUT_UNDO.display,
  REDO: SHORTCUT_REDO.display,
  SELECT_ALL: SHORTCUT_SELECT_ALL.display,
  CUT: SHORTCUT_CUT.display,
  COPY: SHORTCUT_COPY.display,
  PASTE: SHORTCUT_PASTE.display,
  NEW_BLOCK: SHORTCUT_NEW_BLOCK.display,
  DUPLICATE: SHORTCUT_DUPLICATE.display,
  DELETE: `${SHORTCUT_DELETE.display}, ${SHORTCUT_CUT.display}`,
  CENTER_VIEWPORT: SHORTCUT_CENTER_VIEWPORT.display,
  SHOW_HIDE_UI: SHORTCUT_SHOW_HIDE_UI.display,
  BACK_TO_HOME: SHORTCUT_BACK_TO_HOME.display,
  NEW_PROJECT: SHORTCUT_NEW_PROJECT.display,
  PERFORMANCE_MODE: SHORTCUT_PERFORMANCE_MODE.display,
  CUSTOMIZE_EXPERIENCE: SHORTCUT_HELP.display,
  INTERACTIVE_MOUSE: SHORTCUT_INTERACTIVE_MOUSE.display,
  CUSTOMIZE_CANVAS: SHORTCUT_CUSTOMIZE_CANVAS.display,
  HELP_AND_RESOURCES: SHORTCUT_HELP.display,
  REPORT_A_BUG: SHORTCUT_HELP.display,
  WHATS_NEW: SHORTCUT_WHATS_NEW.display,
};

export const ACTION_LABELS = {
  // Common actions
  CONNECT: 'Connect',
  DELETE: SHORTCUT_DELETE.label,
  CENTER_VIEWPORT: SHORTCUT_CENTER_VIEWPORT.label,
  SHOW_HIDE_UI: SHORTCUT_SHOW_HIDE_UI.label,
  TOGGLE_LAYERS_TREE: SHORTCUT_TOGGLE_LAYERS.label,
  UNDO: SHORTCUT_UNDO.label,
  REDO: SHORTCUT_REDO.label,
  SPOTLIGHT_SEARCH: SHORTCUT_SPOTLIGHT_SEARCH.label,
  BACK_TO_HOME: SHORTCUT_BACK_TO_HOME.label,
  NEW_PROJECT: SHORTCUT_NEW_PROJECT.label,
  PERFORMANCE_MODE: SHORTCUT_PERFORMANCE_MODE.label,
  CUSTOMIZE_EXPERIENCE: 'Customize experience',
  INTERACTIVE_MOUSE: SHORTCUT_INTERACTIVE_MOUSE.label,
  CUSTOMIZE_CANVAS: SHORTCUT_CUSTOMIZE_CANVAS.label,
  HELP_AND_ACCOUNT: 'Help & account',

  // Canvas actions
  NEW_BLOCK: SHORTCUT_NEW_BLOCK.label,
  PASTE: 'Paste here',
  EXPORT_IMAGE: SHORTCUT_EXPORT_IMAGE.label,
  EXPORT_FLOW: SHORTCUT_EXPORT_FLOW.label,
  CLEAR_CANVAS: SHORTCUT_CLEAR_CANVAS.label,

  // Edge actions
  CHANGE_COLOR: SHORTCUT_CHANGE_EDGE_COLOR.label,

  // Node actions
  DUPLICATE: SHORTCUT_DUPLICATE.label,
  WEBCAM: SHORTCUT_WEBCAM.label,
};
