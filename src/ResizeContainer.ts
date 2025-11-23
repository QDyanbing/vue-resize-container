/* eslint-disable vue/no-unused-properties */
import { defineComponent, h, onBeforeUnmount, onMounted, ref, type PropType } from 'vue-demi';
import { useResizable } from './hooks/useResizable';
import './resize-container.less';
import {
  EMITS,
  HANDLE_CLASS_PREFIX,
  HANDLES,
  type DisableAttr,
  type ResizeHandle,
} from './utils/resizableConstants';

export default defineComponent({
  name: 'VResizable',
  props: {
    width: { type: [Number, String], default: undefined },
    minWidth: { type: Number, default: 0 },
    maxWidth: { type: Number, default: undefined },
    height: { type: [Number, String], default: undefined },
    minHeight: { type: Number, default: 0 },
    maxHeight: { type: Number, default: undefined },
    left: { type: [Number, String], default: 0 },
    top: { type: [Number, String], default: 0 },
    active: {
      type: Array as PropType<ResizeHandle[]>,
      default: () => [...HANDLES],
      validator: (list: ResizeHandle[]) => list.every(item => HANDLES.includes(item)),
    },
    fitParent: { type: Boolean, default: false },
    dragSelector: { type: String, default: undefined },
    maximize: { type: Boolean, default: false },
    disableAttributes: {
      type: Array as PropType<DisableAttr[]>,
      default: () => [],
    },
  },
  emits: EMITS as unknown as string[],
  setup(props, { emit, slots, expose }) {
    const rootRef = ref<HTMLElement | null>(null);

    const {
      componentStyle,
      activeHandles,
      setMaximize,
      handleMove,
      handleDown,
      handleUp,
      syncDimensions,
      emitEvent,
      setupDragElements,
      updateCalcMap,
    } = useResizable(props, (event, payload) => emit(event, payload), rootRef);

    onMounted(() => {
      syncDimensions();
      setupDragElements(props.dragSelector);
      updateCalcMap(props.disableAttributes);
      setMaximize(props.maximize);
      document.documentElement.addEventListener('mousemove', handleMove, true);
      document.documentElement.addEventListener('mousedown', handleDown, true);
      document.documentElement.addEventListener('mouseup', handleUp, true);
      document.documentElement.addEventListener('touchmove', handleMove, true);
      document.documentElement.addEventListener('touchstart', handleDown, true);
      document.documentElement.addEventListener('touchend', handleUp, true);
      emitEvent('mount', {});
    });

    onBeforeUnmount(() => {
      document.documentElement.removeEventListener('mousemove', handleMove, true);
      document.documentElement.removeEventListener('mousedown', handleDown, true);
      document.documentElement.removeEventListener('mouseup', handleUp, true);
      document.documentElement.removeEventListener('touchmove', handleMove, true);
      document.documentElement.removeEventListener('touchstart', handleDown, true);
      document.documentElement.removeEventListener('touchend', handleUp, true);
      emitEvent('destroy', {});
    });

    expose({ setMaximize });

    return () =>
      h(
        'div',
        {
          ref: rootRef,
          class: 'vrc-container',
          style: componentStyle.value,
        },
        [
          slots.default?.(),
          !props.maximize &&
            activeHandles.value.map((handle: ResizeHandle) =>
              h('div', {
                key: handle,
                class: ['vrc-handle', `${HANDLE_CLASS_PREFIX}${handle}`],
              }),
            ),
        ],
      );
  },
});
