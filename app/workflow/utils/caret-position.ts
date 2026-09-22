/**
 * Get the pixel position of the caret within a textarea.
 * Creates a hidden mirror div with identical styles, copies text up to cursor,
 * measures a marker span's offset. Returns { top, left } relative to the textarea.
 */
export function getCaretPosition(
  textarea: HTMLTextAreaElement,
): { top: number; left: number } {
  const mirror = document.createElement('div');
  const style = getComputedStyle(textarea);

  // Copy relevant styles to the mirror
  const props = [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
    'letterSpacing', 'lineHeight', 'textTransform', 'wordSpacing',
    'textIndent', 'whiteSpace', 'wordWrap', 'overflowWrap',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'boxSizing', 'width',
  ] as const;

  mirror.style.position = 'absolute';
  mirror.style.top = '-9999px';
  mirror.style.left = '-9999px';
  mirror.style.visibility = 'hidden';
  mirror.style.overflow = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';

  for (const prop of props) {
    (mirror.style as unknown as Record<string, string>)[prop] = style[prop];
  }

  document.body.appendChild(mirror);

  const cursorPos = textarea.selectionStart ?? 0;
  const textBeforeCursor = textarea.value.substring(0, cursorPos);

  // Use a text node for the content before cursor and a span as marker
  mirror.textContent = textBeforeCursor;
  const marker = document.createElement('span');
  marker.textContent = '\u200b'; // zero-width space
  mirror.appendChild(marker);

  const top = marker.offsetTop - textarea.scrollTop;
  const left = marker.offsetLeft;

  document.body.removeChild(mirror);

  return { top, left };
}
