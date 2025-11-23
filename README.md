# vue-resize-container

一个专注于拖拽 / 缩放 / 最大化场景的容器组件。基于 `vue-demi` 适配 Vue 2.7（需搭配 `@vue/composition-api`）与 Vue 3，并提供 `vrc-*` 命名空间的样式、拖拽选择器、最大化等能力。

## 特性速览

- Vue 2.7 / Vue 3 共用一套源码，按需对外暴露 `ResizeContainer` 组件或 `install` 插件。
- 支持八个方向的缩放、内容拖拽、最大化、限制在父级内移动、禁止某些维度计算。
- 提供 `pnpm dev` 启动的文档 + playground，改动 `src` 或 `docs` 都会热更新。
- 使用 Vite lib mode + `vite-plugin-dts` 构建，可产出 ES/CJS/UMD/IIFE 与类型定义。
- 样式在运行时自动注入，安装组件后无需再单独引入 CSS。

## 开发环境

- Node 18+（项目使用 Volta 固定为 Node 22.14.0 / pnpm 8.6.11）
- 包管理器：pnpm（`preinstall` 会强制）

常用脚本：

| 命令                | 说明                                                    |
| ------------------- | ------------------------------------------------------- |
| `pnpm dev`          | 启动 VitePress 文档与 playground，实时预览组件          |
| `pnpm watch`        | 监听 `src`，自动增量构建到 `dist`（开发外部项目时使用） |
| `pnpm docs:build`   | 生成静态文档站（用于 GitHub Pages）                     |
| `pnpm docs:preview` | 以本地 base 预览文档构建结果                            |
| `pnpm build`        | 清理并产出 `dist` 与 `types`                            |
| `pnpm preview`      | 本地预览打包后的 UMD/IIFE                               |
| `pnpm release`      | 通过 `np` 执行 version bump、tag、发布 npm              |
| `pnpm docs:deploy`  | 构建并推送文档到 `gh-pages`                             |

## 使用方式

### Vue 3

```ts
import { createApp } from 'vue';
import App from './App.vue';
import { ResizeContainer } from 'vue-resize-container';

const app = createApp(App);
app.component('ResizeContainer', ResizeContainer);
app.mount('#app');
```

### Vue 2.7

```ts
import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { ResizeContainer } from 'vue-resize-container';

Vue.use(VueCompositionAPI);
Vue.component('ResizeContainer', ResizeContainer);
```

仍旧保留 `app.use(VueResizeContainer)` 的插件写法，方便一次性注册所有导出。

## Props / 事件

完整的 Props、事件、示例可在 VitePress 文档查看：`pnpm dev` 访问 `http://localhost:4330`，或查看线上站点（GitHub Pages `gh-pages` 分支）。常用属性包括 `width`、`height`、`fit-parent`、`drag-selector`、`maximize`、`disable-attributes`，事件涵盖 `resize:*`、`drag:*`、`mount`、`destroy`、`maximize`。

## 发布流程

1. `pnpm build` + `pnpm lint` 确认组件通过检查。
2. `pnpm release` 调用 `np`：自动跑测试（已关闭）、更新版本、打 tag、发布 npm（需先 `npm login` 官方 registry）。
   - 发布命令固定在 `master` 分支执行，np 会推送 tag 并发布包。
3. `pnpm docs:deploy` 将最新文档推送到 `gh-pages`，供 GitHub Pages 使用。

> 若需要自定义 registry，可在 `.npmrc` 中修改，再重新登录。
