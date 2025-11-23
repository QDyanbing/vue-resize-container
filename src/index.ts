import { isVue2, type App, type Plugin } from 'vue-demi';
import ResizeContainer from './ResizeContainer';

type LegacyApp = { component: (name: string, component: any) => void };

const VueResizeContainer: Plugin = {
  install(app: App): void {
    if (isVue2) {
      (app as unknown as LegacyApp).component('ResizeContainer', ResizeContainer);
      return;
    }

    app.component('ResizeContainer', ResizeContainer);
  },
};

export type ResizeContainerInstance = InstanceType<typeof ResizeContainer>;

export { ResizeContainer };
export default VueResizeContainer;
