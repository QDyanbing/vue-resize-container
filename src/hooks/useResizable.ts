import { computed, reactive, watch, type CSSProperties, type Ref } from 'vue-demi';
import {
  CALC_MASK,
  DRAG_CLASS,
  ELEMENT_MASK,
  HANDLE_CLASS_PREFIX,
  HANDLES,
  type DisableAttr,
  type EmitEvent,
} from '../utils/resizableConstants';

type EmitFn = (event: EmitEvent, payload: Record<string, unknown>) => void;

export function useResizable(props: any, emit: EmitFn, rootRef: Ref<HTMLElement | null>) {
  const state = reactive({
    w: props.width as number | string | undefined,
    h: props.height as number | string | undefined,
    minW: props.minWidth,
    minH: props.minHeight,
    maxW: props.maxWidth,
    maxH: props.maxHeight,
    l: props.left as number | string,
    t: props.top as number | string,
    mouseX: 0,
    mouseY: 0,
    offsetX: 0,
    offsetY: 0,
    parent: { width: 0, height: 0 },
    resizeState: 0,
    dragState: false,
    calcMap: 0b1111,
    prevState: null as null | {
      w: number | string;
      h: number | string;
      l: number | string;
      t: number | string;
    },
  });

  const componentStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {};
    if (state.calcMap & CALC_MASK.w) {
      style.width = typeof state.w === 'number' ? `${state.w}px` : state.w;
    }
    if (state.calcMap & CALC_MASK.h) {
      style.height = typeof state.h === 'number' ? `${state.h}px` : state.h;
    }
    if (state.calcMap & CALC_MASK.l) {
      style.left = typeof state.l === 'number' ? `${state.l}px` : state.l;
    }
    if (state.calcMap & CALC_MASK.t) {
      style.top = typeof state.t === 'number' ? `${state.t}px` : state.t;
    }
    return style;
  });

  const activeHandles = computed(() => props.active || [...HANDLES]);

  const getHost = () => rootRef.value;

  const emitEvent = (eventName: EmitEvent, additional: Record<string, unknown> = {}) => {
    emit(eventName, {
      eventName,
      left: state.l,
      top: state.t,
      width: state.w,
      height: state.h,
      cmp: getHost(),
      ...additional,
    });
  };

  const setMaximize = (value: boolean) => {
    const host = getHost();
    const parent = host?.parentElement;
    if (!host || !parent) return;

    if (value) {
      state.prevState = {
        w: state.w ?? parent.clientWidth,
        h: state.h ?? parent.clientHeight,
        l: state.l,
        t: state.t,
      };
      state.t = 0;
      state.l = 0;
      state.w = parent.clientWidth;
      state.h = parent.clientHeight;
    } else if (state.prevState) {
      state.l = state.prevState.l;
      state.t = state.prevState.t;
      state.w = state.prevState.w;
      state.h = state.prevState.h;
      state.prevState = null;
    }
  };

  const setupDragElements = (selector?: string) => {
    const host = getHost();
    if (!host) return;
    const oldList = host.querySelectorAll(`.${DRAG_CLASS}`);
    oldList.forEach(el => el.classList.remove(DRAG_CLASS));
    if (!selector) return;
    const nodes = host.querySelectorAll<HTMLElement>(selector);
    nodes.forEach(el => el.classList.add(DRAG_CLASS));
  };

  const updateCalcMap = (attrs: DisableAttr[] = []) => {
    let map = 0b1111;
    attrs.forEach(attr => {
      map &= ~CALC_MASK[attr];
    });
    state.calcMap = map;
  };

  const pointerFromEvent = (event: MouseEvent | TouchEvent) => {
    if ('touches' in event) {
      const touch = event.touches[0];
      if (!touch) return null;
      return { x: touch.clientX, y: touch.clientY };
    }
    return { x: event.clientX, y: event.clientY };
  };

  const handleMove = (event: MouseEvent | TouchEvent) => {
    const host = getHost();
    if (!host || state.resizeState === 0) return;

    if (!state.dragState) {
      if (typeof state.w !== 'number') state.w = host.clientWidth;
      if (typeof state.h !== 'number') state.h = host.clientHeight;
    }

    const pointer = pointerFromEvent(event);
    if (!pointer) return;

    if (props.maximize && state.prevState) {
      const parentEl = host.parentElement;
      if (parentEl) {
        const parentWidth = parentEl.clientWidth;
        const parentHeight = parentEl.clientHeight;
        state.prevState = null;
        state.t =
          pointer.y > parentHeight / 2
            ? parentHeight - (typeof state.h === 'number' ? state.h : 0)
            : 0;
        state.l =
          pointer.x > parentWidth / 2
            ? parentWidth - (typeof state.w === 'number' ? state.w : 0)
            : 0;
        emitEvent('maximize', { state: false });
      }
    }

    let diffX = pointer.x - state.mouseX + state.offsetX;
    let diffY = pointer.y - state.mouseY + state.offsetY;
    if (host.getBoundingClientRect) {
      const rect = host.getBoundingClientRect();
      const scaleX = rect.width / host.offsetWidth || 1;
      const scaleY = rect.height / host.offsetHeight || 1;
      diffX /= scaleX;
      diffY /= scaleY;
    }
    state.offsetX = 0;
    state.offsetY = 0;

    const parentEl = host.parentElement;
    state.parent.height = parentEl?.clientHeight ?? 0;
    state.parent.width = parentEl?.clientWidth ?? 0;

    if (state.resizeState & ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}r`].bit) {
      if (!state.dragState && typeof state.w === 'number' && state.w + diffX < state.minW) {
        state.offsetX = diffX - (diffX = state.minW - state.w);
      } else if (
        !state.dragState &&
        state.maxW &&
        typeof state.w === 'number' &&
        state.w + diffX > state.maxW &&
        (!props.fitParent ||
          (typeof state.l === 'number' && state.w + state.l < state.parent.width))
      ) {
        state.offsetX = diffX - (diffX = state.maxW - state.w);
      } else if (
        props.fitParent &&
        typeof state.l === 'number' &&
        typeof state.w === 'number' &&
        state.l + state.w + diffX > state.parent.width
      ) {
        state.offsetX = diffX - (diffX = state.parent.width - state.l - state.w);
      }

      if (state.calcMap & CALC_MASK.w && typeof state.w === 'number') {
        state.w += state.dragState ? 0 : diffX;
      }
    }

    if (state.resizeState & ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}b`].bit) {
      if (!state.dragState && typeof state.h === 'number' && state.h + diffY < state.minH) {
        state.offsetY = diffY - (diffY = state.minH - state.h);
      } else if (
        !state.dragState &&
        state.maxH &&
        typeof state.h === 'number' &&
        state.h + diffY > state.maxH &&
        (!props.fitParent ||
          (typeof state.t === 'number' && state.h + state.t < state.parent.height))
      ) {
        state.offsetY = diffY - (diffY = state.maxH - state.h);
      } else if (
        props.fitParent &&
        typeof state.t === 'number' &&
        typeof state.h === 'number' &&
        state.t + state.h + diffY > state.parent.height
      ) {
        state.offsetY = diffY - (diffY = state.parent.height - state.t - state.h);
      }

      if (state.calcMap & CALC_MASK.h && typeof state.h === 'number') {
        state.h += state.dragState ? 0 : diffY;
      }
    }

    if (state.resizeState & ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}l`].bit) {
      if (!state.dragState && typeof state.w === 'number' && state.w - diffX < state.minW) {
        state.offsetX = diffX - (diffX = state.w - state.minW);
      } else if (
        !state.dragState &&
        state.maxW &&
        typeof state.w === 'number' &&
        state.w - diffX > state.maxW &&
        (typeof state.l === 'number' ? state.l >= 0 : true)
      ) {
        state.offsetX = diffX - (diffX = state.w - state.maxW);
      } else if (props.fitParent && typeof state.l === 'number' && state.l + diffX < 0) {
        state.offsetX = diffX - (diffX = -state.l);
      }

      if (state.calcMap & CALC_MASK.l && typeof state.l === 'number') {
        state.l += diffX;
      }
      if (state.calcMap & CALC_MASK.w && typeof state.w === 'number') {
        state.w -= state.dragState ? 0 : diffX;
      }
    }

    if (state.resizeState & ELEMENT_MASK[`${HANDLE_CLASS_PREFIX}t`].bit) {
      if (!state.dragState && typeof state.h === 'number' && state.h - diffY < state.minH) {
        state.offsetY = diffY - (diffY = state.h - state.minH);
      } else if (
        !state.dragState &&
        state.maxH &&
        typeof state.h === 'number' &&
        state.h - diffY > state.maxH &&
        (typeof state.t === 'number' ? state.t >= 0 : true)
      ) {
        state.offsetY = diffY - (diffY = state.h - state.maxH);
      } else if (props.fitParent && typeof state.t === 'number' && state.t + diffY < 0) {
        state.offsetY = diffY - (diffY = -state.t);
      }

      if (state.calcMap & CALC_MASK.t && typeof state.t === 'number') {
        state.t += diffY;
      }
      if (state.calcMap & CALC_MASK.h && typeof state.h === 'number') {
        state.h -= state.dragState ? 0 : diffY;
      }
    }

    state.mouseX = pointer.x;
    state.mouseY = pointer.y;
    emitEvent(state.dragState ? 'drag:move' : 'resize:move');
  };

  const handleDown = (event: MouseEvent | TouchEvent) => {
    const host = getHost();
    if (!host) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest && target.closest('.vrc-container') !== host) return;

    for (const [className, meta] of Object.entries(ELEMENT_MASK)) {
      const maskMeta = meta as { bit: number; cursor: string };
      if (
        host.contains(target) &&
        (target?.closest?.(`.${className}`) || target?.classList.contains(className))
      ) {
        if (className === DRAG_CLASS) state.dragState = true;
        document.body.style.cursor = maskMeta.cursor;
        const pointer = pointerFromEvent(event);
        if (!pointer) return;
        if (!('touches' in event)) event.preventDefault?.();
        state.mouseX = pointer.x;
        state.mouseY = pointer.y;
        state.offsetX = 0;
        state.offsetY = 0;
        state.resizeState = maskMeta.bit;
        const parentEl = host.parentElement;
        state.parent.height = parentEl?.clientHeight ?? 0;
        state.parent.width = parentEl?.clientWidth ?? 0;
        emitEvent(state.dragState ? 'drag:start' : 'resize:start');
        break;
      }
    }
  };

  const handleUp = () => {
    if (state.resizeState === 0) return;
    state.resizeState = 0;
    document.body.style.cursor = '';
    emitEvent(state.dragState ? 'drag:end' : 'resize:end');
    state.dragState = false;
  };

  const syncDimensions = () => {
    const host = getHost();
    const parent = host?.parentElement;
    if (!host || !parent) return;

    if (!props.width) {
      state.w = parent.clientWidth;
    } else if (props.width !== 'auto' && typeof props.width !== 'number') {
      state.w = host.clientWidth;
    }
    if (!props.height) {
      state.h = parent.clientHeight;
    } else if (props.height !== 'auto' && typeof props.height !== 'number') {
      state.h = host.clientHeight;
    }
    if (typeof props.left !== 'number') {
      state.l = host.offsetLeft - parent.offsetLeft;
    }
    if (typeof props.top !== 'number') {
      state.t = host.offsetTop - parent.offsetTop;
    }

    if (state.minW && typeof state.w === 'number' && state.w < state.minW) state.w = state.minW;
    if (state.minH && typeof state.h === 'number' && state.h < state.minH) state.h = state.minH;
    if (state.maxW && typeof state.w === 'number' && state.w > state.maxW) state.w = state.maxW;
    if (state.maxH && typeof state.h === 'number' && state.h > state.maxH) state.h = state.maxH;
  };

  watch(
    () => props.maxWidth,
    value => {
      state.maxW = value;
    },
  );
  watch(
    () => props.maxHeight,
    value => {
      state.maxH = value;
    },
  );
  watch(
    () => props.minWidth,
    value => {
      state.minW = value;
    },
  );
  watch(
    () => props.minHeight,
    value => {
      state.minH = value;
    },
  );
  watch(
    () => props.width,
    value => {
      if (typeof value === 'number') state.w = value;
    },
  );
  watch(
    () => props.height,
    value => {
      if (typeof value === 'number') state.h = value;
    },
  );
  watch(
    () => props.left,
    value => {
      if (typeof value === 'number') state.l = value;
    },
  );
  watch(
    () => props.top,
    value => {
      if (typeof value === 'number') state.t = value;
    },
  );

  watch(
    () => props.dragSelector,
    selector => setupDragElements(selector),
    { immediate: true },
  );
  watch(
    () => props.disableAttributes,
    attrs => updateCalcMap(attrs),
    { immediate: true },
  );
  watch(
    () => props.maximize,
    value => {
      setMaximize(value);
      emitEvent('maximize', { state: value });
    },
    { immediate: true },
  );

  return {
    state,
    componentStyle,
    activeHandles,
    setMaximize,
    handleMove,
    handleDown,
    handleUp,
    syncDimensions,
    setupDragElements,
    updateCalcMap,
    emitEvent,
  };
}
