import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, reactive, ref } from 'vue-demi';
import { useResizable } from '../hooks/useResizable';
import {
  CALC_MASK,
  DRAG_CLASS,
  ELEMENT_MASK,
  HANDLE_CLASS_PREFIX,
  HANDLES,
} from '../utils/resizableConstants';

type Size = { width: number; height: number };

const mockElementMetrics = (
  element: HTMLElement,
  size: Size,
  offset: { left: number; top: number } = { left: 0, top: 0 },
) => {
  const defineGetter = (
    prop: 'clientWidth' | 'offsetWidth' | 'clientHeight' | 'offsetHeight',
    value: number,
  ) =>
    Object.defineProperty(element, prop, {
      configurable: true,
      get: () => value,
    });

  defineGetter('clientWidth', size.width);
  defineGetter('offsetWidth', size.width);
  defineGetter('clientHeight', size.height);
  defineGetter('offsetHeight', size.height);

  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    width: size.width,
    height: size.height,
    left: offset.left,
    top: offset.top,
    right: offset.left + size.width,
    bottom: offset.top + size.height,
    x: offset.left,
    y: offset.top,
    toJSON: () => ({}),
  } as DOMRect);
};

const createHost = (sizes: {
  host: Size;
  parent: Size;
  hostOffset?: { left: number; top: number };
}) => {
  const parent = document.createElement('div');
  document.body.appendChild(parent);
  mockElementMetrics(parent, sizes.parent);
  const host = document.createElement('div');
  host.classList.add('vrc-container');
  parent.appendChild(host);
  mockElementMetrics(host, sizes.host, sizes.hostOffset);
  return host;
};

const setupHook = (
  propsOverrides: Record<string, unknown> = {},
  sizes = {
    host: { width: 200, height: 120 },
    parent: { width: 320, height: 240 },
    hostOffset: { left: 0, top: 0 },
  },
) => {
  const host = createHost(sizes);
  const props = reactive({
    width: 200,
    height: 120,
    minWidth: 50,
    minHeight: 50,
    maxWidth: 500,
    maxHeight: 500,
    left: 0,
    top: 0,
    fitParent: false,
    dragSelector: undefined,
    maximize: false,
    disableAttributes: [],
    active: undefined,
    ...propsOverrides,
  });
  const emits: Array<{ event: string; payload: Record<string, unknown> }> = [];
  const emit = (event: string, payload: Record<string, unknown>) => {
    emits.push({ event, payload });
  };
  const rootRef = ref<HTMLElement | null>(host);
  const scope = effectScope();
  let apiReturn!: ReturnType<typeof useResizable>;
  scope.run(() => {
    apiReturn = useResizable(props, emit, rootRef);
  });
  return { api: apiReturn, state: apiReturn.state, emits, scope, props, rootRef };
};

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.cursor = '';
  vi.restoreAllMocks();
});

describe('useResizable', () => {
  it('clamps width within parent bounds when resizing from the right', () => {
    const { api, state, emits, scope } = setupHook(
      { fitParent: true, width: 200 },
      { host: { width: 200, height: 100 }, parent: { width: 240, height: 200 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 100;
    state.mouseY = 50;
    api.handleMove(new MouseEvent('mousemove', { clientX: 400, clientY: 60 }));

    expect(state.w).toBe(240);
    const lastMove = emits.filter(item => item.event === 'resize:move').at(-1);
    expect(lastMove?.payload.width).toBe(240);
    scope.stop();
  });

  it('applies min width constraint when dragging the left handle', () => {
    const { api, state, scope } = setupHook(
      { width: 150, minWidth: 120, left: 40 },
      { host: { width: 150, height: 100 }, parent: { width: 400, height: 300 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}l`].bit;
    state.mouseX = 0;
    state.mouseY = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 80, clientY: 0 }));

    expect(state.w).toBe(120);
    expect(state.l).toBe(70);
    scope.stop();
  });

  it('syncs dimensions from parent when props are undefined and clamps to min/max', () => {
    const { api, state, scope } = setupHook(
      {
        width: undefined,
        height: undefined,
        left: 'auto',
        top: 'auto',
        minWidth: 150,
        maxWidth: 180,
        minHeight: 60,
        maxHeight: 90,
      },
      {
        host: { width: 120, height: 50 },
        parent: { width: 220, height: 200 },
        hostOffset: { left: 25, top: 30 },
      },
    );

    api.syncDimensions();

    expect(state.w).toBe(180);
    expect(state.h).toBe(90);
    expect(state.l).toBe(0);
    expect(state.t).toBe(0);
    scope.stop();
  });

  it('syncDimensions falls back to host size for non-numeric width/height', () => {
    const { api, state, scope } = setupHook(
      {
        width: '50%',
        height: '80%',
        left: 0,
        top: 0,
      },
      {
        host: { width: 180, height: 140 },
        parent: { width: 300, height: 260 },
      },
    );

    api.syncDimensions();

    expect(state.w).toBe(180);
    expect(state.h).toBe(140);
    scope.stop();
  });

  it('componentStyle keeps string values as-is', () => {
    const { api, state, scope } = setupHook();
    state.w = '50%' as any;
    state.h = '75vh' as any;
    state.l = 'calc(10px)' as any;
    state.t = '2rem' as any;
    const style = api.componentStyle.value;
    expect(style.width).toBe('50%');
    expect(style.height).toBe('75vh');
    expect(style.left).toBe('calc(10px)');
    expect(style.top).toBe('2rem');
    scope.stop();
  });

  it('activeHandles falls back to all handles when prop is undefined', () => {
    const { api, scope } = setupHook();
    expect(api.activeHandles.value).toEqual([...HANDLES]);
    scope.stop();
  });

  it('activeHandles respects provided handles array', () => {
    const { api, scope } = setupHook({ active: ['r', 'b'] });
    expect(api.activeHandles.value).toEqual(['r', 'b']);
    scope.stop();
  });

  it('captures parent dimensions when maximizing undefined size', async () => {
    const { state, props, scope } = setupHook({
      width: undefined,
      height: undefined,
    });

    props.maximize = true;
    await nextTick();

    expect(state.prevState?.w).toBe(320);
    expect(state.prevState?.h).toBe(240);
    scope.stop();
  });

  it('exits early when syncDimensions lacks host or parent', () => {
    const { api, rootRef, state, scope } = setupHook();
    rootRef.value = null;

    api.syncDimensions();

    expect(state.w).toBe(200);
    expect(state.h).toBe(120);
    scope.stop();
  });

  it('clamps syncDimensions results to min ranges', () => {
    const { api, state, scope } = setupHook(
      {
        width: undefined,
        height: undefined,
        minWidth: 260,
        minHeight: 180,
      },
      {
        host: { width: 120, height: 80 },
        parent: { width: 220, height: 160 },
        hostOffset: { left: 10, top: 10 },
      },
    );

    api.syncDimensions();

    expect(state.w).toBe(260);
    expect(state.h).toBe(180);
    scope.stop();
  });

  it('ignores handleDown when target is outside container', () => {
    const { api, state, scope } = setupHook();
    const external = document.createElement('div');
    document.body.appendChild(external);
    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', { configurable: true, value: external });

    api.handleDown(event);

    expect(state.resizeState).toBe(0);
    scope.stop();
  });

  it('exits handleDown when pointer cannot be derived', () => {
    const { api, state, scope, rootRef } = setupHook();
    const handle = document.createElement('div');
    handle.classList.add(`${HANDLE_CLASS_PREFIX}r`);
    rootRef.value?.appendChild(handle);
    const event = {
      target: handle,
      touches: [],
      preventDefault: vi.fn(),
    } as unknown as TouchEvent;

    api.handleDown(event);

    expect(state.resizeState).toBe(0);
    scope.stop();
  });

  it('skips handleDown entirely when host element is missing', () => {
    const { api, state, scope, rootRef } = setupHook();
    rootRef.value = null;

    api.handleDown(new MouseEvent('mousedown'));

    expect(state.resizeState).toBe(0);
    scope.stop();
  });

  it('enters resize mode when handle element is pressed', () => {
    const { api, state, emits, scope, rootRef } = setupHook();
    const handle = document.createElement('div');
    handle.classList.add(`${HANDLE_CLASS_PREFIX}r`);
    rootRef.value?.appendChild(handle);
    const event = new MouseEvent('mousedown', { clientX: 40, clientY: 60, bubbles: true });
    Object.defineProperty(event, 'target', { configurable: true, value: handle });

    api.handleDown(event);

    expect(state.resizeState).toBe(ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit);
    expect(state.mouseX).toBe(40);
    expect(state.mouseY).toBe(60);
    expect(state.parent.width).toBeGreaterThan(0);
    expect(state.parent.height).toBeGreaterThan(0);
    expect(emits.some(e => e.event === 'resize:start')).toBe(true);
    api.handleUp();
    expect(emits.some(e => e.event === 'resize:end')).toBe(true);
    scope.stop();
  });

  it('enters drag mode when drag element is pressed', () => {
    const { api, state, emits, scope, rootRef } = setupHook();
    const drag = document.createElement('div');
    drag.classList.add(DRAG_CLASS);
    rootRef.value?.appendChild(drag);
    const event = new MouseEvent('mousedown', { clientX: 15, clientY: 25, bubbles: true });
    Object.defineProperty(event, 'target', { configurable: true, value: drag });

    api.handleDown(event);

    expect(state.dragState).toBe(true);
    expect(emits.some(e => e.event === 'drag:start')).toBe(true);
    api.handleUp();
    expect(emits.some(e => e.event === 'drag:end')).toBe(true);
    scope.stop();
  });

  it('falls back to zero parent size when handleDown has no parent element', () => {
    const { api, state, scope, rootRef } = setupHook();
    const handle = document.createElement('div');
    handle.classList.add(`${HANDLE_CLASS_PREFIX}r`);
    rootRef.value?.appendChild(handle);
    rootRef.value?.remove(); // detach so parentElement becomes null
    const event = new MouseEvent('mousedown', { clientX: 30, clientY: 45, bubbles: true });
    Object.defineProperty(event, 'target', { configurable: true, value: handle });

    api.handleDown(event);

    expect(state.parent.height).toBe(0);
    expect(state.parent.width).toBe(0);
    scope.stop();
  });

  it('handles touch-based resize interactions', () => {
    const { api, state, scope, rootRef } = setupHook();
    const handle = document.createElement('div');
    handle.classList.add(`${HANDLE_CLASS_PREFIX}r`);
    rootRef.value?.appendChild(handle);
    const event = {
      target: handle,
      touches: [{ clientX: 75, clientY: 95 }],
      preventDefault: vi.fn(),
    } as unknown as TouchEvent;

    api.handleDown(event);

    expect(state.mouseX).toBe(75);
    expect(state.mouseY).toBe(95);
    expect(state.resizeState).toBe(ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit);
    scope.stop();
  });

  it('handleMove returns immediately when no active resize', () => {
    const { api, state, scope } = setupHook();
    state.resizeState = 0;

    api.handleMove(new MouseEvent('mousemove', { clientX: 25, clientY: 35 }));

    expect(state.mouseX).toBe(0);
    scope.stop();
  });

  it('normalizes non-numeric width and height before resizing', () => {
    const { api, state, scope } = setupHook();
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}rb`].bit;
    state.w = 'auto' as any;
    state.h = 'auto' as any;
    state.mouseX = 0;
    state.mouseY = 0;

    api.handleMove(new MouseEvent('mousemove', { clientX: 40, clientY: 40 }));

    expect(typeof state.w).toBe('number');
    expect(typeof state.h).toBe('number');
    scope.stop();
  });

  it('handleMove exits when pointer cannot be created', () => {
    const { api, state, scope, rootRef } = setupHook();
    const handle = document.createElement('div');
    handle.classList.add(`${HANDLE_CLASS_PREFIX}r`);
    rootRef.value?.appendChild(handle);
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    const event = {
      target: handle,
      touches: [],
      preventDefault: vi.fn(),
    } as unknown as TouchEvent;

    api.handleMove(event);

    expect(state.mouseX).toBe(0);
    scope.stop();
  });

  it('uses zero offsets when maximizing with string dimensions', async () => {
    const { api, state, props, scope } = setupHook({
      width: undefined,
      height: undefined,
    });
    props.maximize = true;
    await nextTick();
    state.prevState = {
      w: 'auto' as any,
      h: 'auto' as any,
      l: 0,
      t: 0,
    };
    state.w = 'auto' as any;
    state.h = 'auto' as any;
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.dragState = true;
    state.mouseX = 0;
    state.mouseY = 0;

    api.handleMove(new MouseEvent('mousemove', { clientX: 260, clientY: 180 }));

    expect(state.l).toBe(320);
    scope.stop();
  });

  it('falls back to scale factor of 1 when offset size is zero', () => {
    const { api, state, scope, rootRef } = setupHook();
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    state.mouseY = 0;
    Object.defineProperty(rootRef.value as HTMLElement, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          width: 0,
          height: 0,
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    api.handleMove(new MouseEvent('mousemove', { clientX: 30, clientY: 30 }));

    expect(state.w).toBeGreaterThan(0);
    scope.stop();
  });

  it('allows left handle calculations when left is non-numeric', () => {
    const { api, state, scope } = setupHook();
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}l`].bit;
    state.mouseX = 0;
    state.l = 'calc(5%)' as any;
    api.handleMove(new MouseEvent('mousemove', { clientX: 10, clientY: 0 }));
    expect(state.l).toBe('calc(5%)');
    scope.stop();
  });

  it('allows top handle calculations when top is non-numeric', () => {
    const { api, state, scope } = setupHook();
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}t`].bit;
    state.mouseY = 0;
    state.t = 'calc(2%)' as any;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 10 }));
    expect(state.t).toBe('calc(2%)');
    scope.stop();
  });

  it('handles move events even when parent element is missing', () => {
    const { api, state, scope, rootRef } = setupHook();
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    state.mouseY = 0;
    rootRef.value?.remove();

    api.handleMove(new MouseEvent('mousemove', { clientX: 15, clientY: 15 }));

    expect(state.parent.width).toBe(0);
    expect(state.parent.height).toBe(0);
    scope.stop();
  });

  it('skips max width guard when left offset is negative', () => {
    const { api, state, scope } = setupHook(
      { width: 200, maxWidth: 150, left: -5 },
      { host: { width: 200, height: 100 }, parent: { width: 400, height: 300 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}l`].bit;
    state.mouseX = 200;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));

    expect(state.w).toBeGreaterThan(150);
    scope.stop();
  });

  it('applies max width guard when left offset is non-numeric', () => {
    const { api, state, scope } = setupHook(
      { width: 300, maxWidth: 200, left: 10 },
      { host: { width: 300, height: 100 }, parent: { width: 500, height: 300 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}l`].bit;
    state.mouseX = 0;
    state.l = 'calc(10%)' as any;
    api.handleMove(new MouseEvent('mousemove', { clientX: -150, clientY: 0 }));

    expect(state.l).toBe('calc(10%)');
    scope.stop();
  });

  it('handles top max height guard with non-numeric offsets', () => {
    const { api, state, scope } = setupHook(
      { height: 220, maxHeight: 180, top: 15 },
      { host: { width: 150, height: 220 }, parent: { width: 400, height: 500 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}t`].bit;
    state.mouseY = 0;
    state.t = 'calc(3%)' as any;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: -120 }));

    expect(state.t).toBe('calc(3%)');
    scope.stop();
  });

  it('skips bounding-rect scaling when API is unavailable', () => {
    const { api, state, scope, rootRef } = setupHook();
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    state.mouseY = 0;
    Object.defineProperty(rootRef.value as HTMLElement, 'getBoundingClientRect', {
      configurable: true,
      value: undefined,
    });

    api.handleMove(new MouseEvent('mousemove', { clientX: 20, clientY: 20 }));

    expect(state.w).toBeGreaterThan(0);
    scope.stop();
  });

  it('skips max-height guard when component is already above viewport', () => {
    const { api, state, scope } = setupHook(
      { height: 200, maxHeight: 150, top: -10 },
      { host: { width: 150, height: 200 }, parent: { width: 400, height: 400 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}t`].bit;
    state.mouseY = 200;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 50 }));

    expect(state.h).toBeGreaterThan(150);
    scope.stop();
  });

  it('ignores handleUp when no resize is active', () => {
    const { api, state, scope } = setupHook();

    api.handleUp();

    expect(state.resizeState).toBe(0);
    scope.stop();
  });

  it('reacts to prop updates via watchers', async () => {
    const { state, props, scope } = setupHook({ width: 150, height: 80, left: 10, top: 15 });

    props.maxWidth = 260;
    props.maxHeight = 300;
    props.minWidth = 120;
    props.minHeight = 70;
    props.width = 200;
    props.height = 140;
    props.left = 40;
    props.top = 60;
    props.disableAttributes = ['w', 'l'];

    await nextTick();

    expect(state.maxW).toBe(260);
    expect(state.maxH).toBe(300);
    expect(state.minW).toBe(120);
    expect(state.minH).toBe(70);
    expect(state.w).toBe(200);
    expect(state.h).toBe(140);
    expect(state.l).toBe(40);
    expect(state.t).toBe(60);
    expect(state.calcMap & CALC_MASK.w).toBe(0);
    expect(state.calcMap & CALC_MASK.l).toBe(0);
    expect(state.calcMap & CALC_MASK.h).toBeTruthy();
    scope.stop();
  });

  it('restores cached dimensions when maximize toggles off', async () => {
    const { state, props, scope } = setupHook(
      { maximize: false, width: 180, height: 90, left: 25, top: 30 },
      { host: { width: 180, height: 90 }, parent: { width: 320, height: 200 } },
    );

    props.maximize = true;
    await nextTick();
    expect(state.prevState).not.toBeNull();

    props.maximize = false;
    await nextTick();

    expect(state.w).toBe(180);
    expect(state.h).toBe(90);
    expect(state.l).toBe(25);
    expect(state.t).toBe(30);
    scope.stop();
  });

  it('positions maximized element based on cursor quadrant', async () => {
    const { api, state, props, scope } = setupHook(
      { maximize: false, width: 120, height: 80 },
      { host: { width: 120, height: 80 }, parent: { width: 260, height: 180 } },
    );

    props.maximize = true;
    await nextTick();
    expect(state.prevState).not.toBeNull();
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    state.mouseY = 0;

    api.handleMove(new MouseEvent('mousemove', { clientX: 220, clientY: 160 }));

    expect(state.l).toBe(0);
    expect(state.t).toBe(0);
    scope.stop();
  });

  it('keeps maximized element anchored when cursor stays in top-left quadrant', async () => {
    const { api, state, props, scope } = setupHook(
      { maximize: false, width: 120, height: 80 },
      { host: { width: 120, height: 80 }, parent: { width: 260, height: 180 } },
    );

    props.maximize = true;
    await nextTick();
    expect(state.prevState).not.toBeNull();
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    state.mouseY = 0;

    api.handleMove(new MouseEvent('mousemove', { clientX: 30, clientY: 20 }));

    expect(state.l).toBe(0);
    expect(state.t).toBe(0);
    scope.stop();
  });

  it('exits maximize mode on user interaction and emits event', async () => {
    const { api, state, props, emits, scope } = setupHook(
      { maximize: false, width: 150, height: 100 },
      { host: { width: 150, height: 100 }, parent: { width: 300, height: 200 } },
    );

    props.maximize = true;
    await nextTick();
    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    state.mouseY = 0;
    expect(state.prevState).not.toBeNull();
    api.handleMove(new MouseEvent('mousemove', { clientX: 250, clientY: 150 }));

    expect(state.prevState).toBeNull();
    const emitted = emits.filter(item => item.event === 'maximize');
    expect(emitted.some(item => item.payload.state === false)).toBe(true);
    scope.stop();
  });

  it('applies max height guard when dragging the top handle', () => {
    const { api, state, scope } = setupHook(
      { height: 200, maxHeight: 150, top: 20 },
      { host: { width: 150, height: 200 }, parent: { width: 400, height: 400 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}t`].bit;
    state.mouseY = 200;
    state.mouseX = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 50 }));

    expect(state.h).toBe(150);
    scope.stop();
  });

  it('respects min height when dragging the top handle downward', () => {
    const { api, state, scope } = setupHook(
      { height: 120, minHeight: 90 },
      { host: { width: 150, height: 120 }, parent: { width: 400, height: 400 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}t`].bit;
    state.mouseY = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 60 }));

    expect(state.h).toBe(90);
    scope.stop();
  });

  it('prevents moving beyond parent top when fitParent is enabled', () => {
    const { api, state, scope } = setupHook(
      { height: 100, top: 10, fitParent: true },
      { host: { width: 150, height: 100 }, parent: { width: 200, height: 150 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}t`].bit;
    state.mouseY = 50;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: -20 }));

    expect(state.t).toBe(0);
    scope.stop();
  });

  it('applies max width guard when dragging the left handle outward', () => {
    const { api, state, scope } = setupHook(
      { width: 150, maxWidth: 180, left: 20 },
      { host: { width: 150, height: 100 }, parent: { width: 400, height: 300 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}l`].bit;
    state.mouseX = 100;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));

    expect(state.w).toBe(180);
    scope.stop();
  });

  it('prevents left handle from moving outside parent when fitParent is true', () => {
    const { api, state, scope } = setupHook(
      { width: 120, left: 10, fitParent: true },
      { host: { width: 120, height: 100 }, parent: { width: 200, height: 200 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}l`].bit;
    state.mouseX = 20;
    api.handleMove(new MouseEvent('mousemove', { clientX: -40, clientY: 0 }));

    expect(state.l).toBe(0);
    scope.stop();
  });

  it('prevents bottom handle from exceeding parent height when fitParent is true', () => {
    const { api, state, scope } = setupHook(
      { height: 60, top: 40, fitParent: true },
      { host: { width: 150, height: 60 }, parent: { width: 200, height: 120 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}b`].bit;
    state.mouseY = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 120 }));

    expect(state.h).toBe(80);
    scope.stop();
  });

  it('honors max height when dragging the bottom handle', () => {
    const { api, state, scope } = setupHook(
      { height: 100, maxHeight: 140 },
      { host: { width: 150, height: 100 }, parent: { width: 300, height: 400 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}b`].bit;
    state.mouseY = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 80 }));

    expect(state.h).toBe(140);
    scope.stop();
  });

  it('prevents right handle from extending beyond parent when fitParent is true', () => {
    const { api, state, scope } = setupHook(
      { width: 200, left: 20, fitParent: true },
      { host: { width: 200, height: 120 }, parent: { width: 240, height: 200 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 200, clientY: 0 }));

    expect(state.w).toBe(220);
    scope.stop();
  });

  it('respects min height when dragging the bottom handle upward', () => {
    const { api, state, scope } = setupHook(
      { height: 150, minHeight: 120 },
      { host: { width: 150, height: 150 }, parent: { width: 300, height: 400 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}b`].bit;
    state.mouseY = 150;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));

    expect(state.h).toBe(120);
    scope.stop();
  });

  it('honors max width when expanding from the right handle', () => {
    const { api, state, scope } = setupHook(
      { width: 180, maxWidth: 220 },
      { host: { width: 180, height: 120 }, parent: { width: 400, height: 400 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 100, clientY: 0 }));

    expect(state.w).toBe(220);
    scope.stop();
  });

  it('respects min width when shrinking from the right handle', () => {
    const { api, state, scope } = setupHook(
      { width: 160, minWidth: 120 },
      { host: { width: 160, height: 120 }, parent: { width: 400, height: 400 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 200;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));

    expect(state.w).toBe(120);
    scope.stop();
  });

  it('clamps right edge when fitParent width would overflow', () => {
    const { api, state, scope } = setupHook(
      { width: 180, left: 30, fitParent: true },
      { host: { width: 180, height: 120 }, parent: { width: 210, height: 200 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    state.mouseY = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 200, clientY: 0 }));

    expect(state.offsetX).toBeGreaterThan(0);
    expect(state.w).toBe(180);
    scope.stop();
  });

  it('limits width by maxWidth before hitting fitParent constraint', () => {
    const { api, state, scope } = setupHook(
      { width: 150, maxWidth: 180, left: 20, fitParent: true },
      { host: { width: 150, height: 100 }, parent: { width: 400, height: 200 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    state.mouseY = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 500, clientY: 0 }));

    expect(state.w).toBe(180);
    scope.stop();
  });

  it('clamps bottom edge when fitParent height would overflow', () => {
    const { api, state, scope } = setupHook(
      { height: 90, top: 20, fitParent: true },
      { host: { width: 150, height: 90 }, parent: { width: 220, height: 120 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}b`].bit;
    state.mouseY = 0;
    state.mouseX = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 200 }));

    expect(state.offsetY).toBeGreaterThan(0);
    expect(state.h).toBe(100);
    scope.stop();
  });

  it('limits height by maxHeight before hitting fitParent constraint', () => {
    const { api, state, scope } = setupHook(
      { height: 120, maxHeight: 160, top: 10, fitParent: true },
      { host: { width: 150, height: 120 }, parent: { width: 300, height: 400 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}b`].bit;
    state.mouseY = 0;
    state.mouseX = 0;
    api.handleMove(new MouseEvent('mousemove', { clientX: 0, clientY: 400 }));

    expect(state.h).toBe(160);
    scope.stop();
  });

  it('derives pointer coordinates from touch events', () => {
    const { api, state, scope } = setupHook(
      { width: 160 },
      { host: { width: 160, height: 100 }, parent: { width: 260, height: 200 } },
    );

    state.resizeState = ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit;
    state.mouseX = 0;
    state.mouseY = 0;
    api.handleMove({ touches: [{ clientX: 120, clientY: 80 }] } as TouchEvent);

    expect(state.mouseX).toBe(120);
    expect(state.mouseY).toBe(80);
    scope.stop();
  });
});
