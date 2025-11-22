# vue-resize-container

一个兼容 Vue 2.7（需搭配 `@vue/composition-api`）与 Vue 3 的最小化容器组件骨架，使用 `vue-demi`、Vite lib mode 与 `vite-plugin-dts` 构建。

## 本地开发

```bash
pnpm install
pnpm dev
```

## 构建与发布

```bash
pnpm build    # 生成 dist 与 types
pnpm preview  # 预览 UMD/IIFE 产物
```

## 使用示例

### Vue 3

```ts
import { createApp } from 'vue';
import App from './App.vue';
import ResizeContainer from 'vue-resize-container';

const app = createApp(App);
app.use(ResizeContainer);
app.mount('#app');
```

### Vue 2.7

```ts
import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import VueResizeContainer from 'vue-resize-container';

Vue.use(VueCompositionAPI);
Vue.use(VueResizeContainer);
```
