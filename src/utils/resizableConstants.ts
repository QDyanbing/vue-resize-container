export const HANDLE_CLASS_PREFIX = 'vrc-handle--';
export const DRAG_CLASS = 'vrc-drag-el';

export const ELEMENT_MASK = {
  [`${HANDLE_CLASS_PREFIX}r`]: { bit: 0b0001, cursor: 'e-resize' },
  [`${HANDLE_CLASS_PREFIX}rb`]: { bit: 0b0011, cursor: 'se-resize' },
  [`${HANDLE_CLASS_PREFIX}b`]: { bit: 0b0010, cursor: 's-resize' },
  [`${HANDLE_CLASS_PREFIX}lb`]: { bit: 0b0110, cursor: 'sw-resize' },
  [`${HANDLE_CLASS_PREFIX}l`]: { bit: 0b0100, cursor: 'w-resize' },
  [`${HANDLE_CLASS_PREFIX}lt`]: { bit: 0b1100, cursor: 'nw-resize' },
  [`${HANDLE_CLASS_PREFIX}t`]: { bit: 0b1000, cursor: 'n-resize' },
  [`${HANDLE_CLASS_PREFIX}rt`]: { bit: 0b1001, cursor: 'ne-resize' },
  [DRAG_CLASS]: { bit: 0b1111, cursor: 'pointer' },
} as const;

export const CALC_MASK = {
  l: 0b0001,
  t: 0b0010,
  w: 0b0100,
  h: 0b1000,
} as const;

export const HANDLES = ['r', 'rb', 'b', 'lb', 'l', 'lt', 't', 'rt'] as const;

export type ResizeHandle = (typeof HANDLES)[number];
export type DisableAttr = keyof typeof CALC_MASK;

export const EMITS = [
  'mount',
  'destroy',
  'resize:start',
  'resize:move',
  'resize:end',
  'drag:start',
  'drag:move',
  'drag:end',
  'maximize',
] as const;

export type EmitEvent = (typeof EMITS)[number];
