import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue-demi';
import ResizeContainer from '../ResizeContainer';

type MountOptions = {
  attachTo?: HTMLElement;
};

const mountComponent = (
  props: Record<string, unknown> = {},
  slots = {},
  options: MountOptions = {},
) =>
  mount(ResizeContainer, {
    props: {
      width: 200,
      height: 120,
      left: 10,
      top: 5,
      ...props,
    },
    slots,
    attachTo: options.attachTo ?? document.body,
  });

const mockElementMetrics = (element: HTMLElement, size: { width: number; height: number }) => {
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
  Object.defineProperty(element, 'offsetLeft', {
    configurable: true,
    get: () => 0,
  });
  Object.defineProperty(element, 'offsetTop', {
    configurable: true,
    get: () => 0,
  });

  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    width: size.width,
    height: size.height,
    left: 0,
    top: 0,
    right: size.width,
    bottom: size.height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('ResizeContainer', () => {
  it('renders handles according to the active prop and applies inline styles', () => {
    const wrapper = mountComponent({ active: ['r', 'b'] });
    const handles = wrapper.findAll('.vrc-handle');

    expect(handles).toHaveLength(2);
    expect(handles[0].classes()).toContain('vrc-handle--r');
    expect(handles[1].classes()).toContain('vrc-handle--b');
    expect(wrapper.element.style.width).toBe('200px');
    expect(wrapper.element.style.height).toBe('120px');
    wrapper.unmount();
  });

  it('omits disabled dimensions from inline style when disableAttributes is provided', async () => {
    const wrapper = mountComponent({ disableAttributes: ['w', 'h'] });

    await nextTick();
    expect(wrapper.element.style.width).toBe('');
    expect(wrapper.element.style.height).toBe('');
    expect(wrapper.element.style.left).toBe('10px');
    expect(wrapper.element.style.top).toBe('5px');
    wrapper.unmount();
  });

  it('hides handles and emits maximize when maximize prop is toggled', async () => {
    const wrapper = mountComponent({ maximize: false });

    await wrapper.setProps({ maximize: true });
    await nextTick();

    expect(wrapper.findAll('.vrc-handle')).toHaveLength(0);
    const maximizeEvents = wrapper.emitted('maximize') ?? [];
    expect(maximizeEvents.some(args => args?.[0]?.state === true)).toBe(true);
    wrapper.unmount();
  });

  it('flags drag elements using dragSelector', async () => {
    const wrapper = mountComponent(
      { dragSelector: '.drag-header' },
      {
        default: () => h('div', { class: 'drag-header' }, 'drag me'),
      },
    );

    await nextTick();
    expect(wrapper.find('.drag-header').classes()).toContain('vrc-drag-el');
    wrapper.unmount();
  });

  it('emits mount and destroy lifecycle events', () => {
    const wrapper = mountComponent();

    expect(wrapper.emitted('mount')).toBeTruthy();
    wrapper.unmount();
    expect(wrapper.emitted('destroy')).toBeTruthy();
  });

  it('emits drag lifecycle events when using drag selector', async () => {
    const wrapper = mountComponent(
      { dragSelector: '.drag-header' },
      {
        default: () => h('div', { class: 'drag-header' }, 'drag me'),
      },
    );
    mockElementMetrics(wrapper.element as HTMLElement, { width: 200, height: 120 });

    const dragHeader = wrapper.find('.drag-header');
    await dragHeader.trigger('mousedown', { clientX: 80, clientY: 40 });
    document.documentElement.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 110, clientY: 90, bubbles: true }),
    );
    document.documentElement.dispatchEvent(
      new MouseEvent('mouseup', { clientX: 110, clientY: 90, bubbles: true }),
    );

    expect(wrapper.emitted('drag:start')).toBeTruthy();
    expect(wrapper.emitted('drag:move')).toBeTruthy();
    expect(wrapper.emitted('drag:end')).toBeTruthy();
    wrapper.unmount();
  });

  it('responds to runtime prop updates for coordinates and size', async () => {
    const wrapper = mountComponent({ width: 150, height: 90, left: 20, top: 15 });

    await wrapper.setProps({ width: 210, height: 160, left: 30, top: 40 });
    await nextTick();

    expect(wrapper.element.style.width).toBe('210px');
    expect(wrapper.element.style.height).toBe('160px');
    expect(wrapper.element.style.left).toBe('30px');
    expect(wrapper.element.style.top).toBe('40px');
    wrapper.unmount();
  });
});
