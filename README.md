# vue-resize-container

一个专注于拖拽 / 缩放 / 最大化场景的容器组件。基于 `vue-demi` 适配 Vue 2.7（需搭配 `@vue/composition-api`）与 Vue 3，并提供 `vrc-*` 命名空间的样式、拖拽选择器、最大化等能力。

## 特性速览

- Vue 2.7 / Vue 3 共用一套源码，按需对外暴露 `ResizeContainer` 组件或 `install` 插件。
- 支持八个方向的缩放、内容拖拽、最大化、限制在父级内移动、禁止某些维度计算。
- 提供 `pnpm dev` 启动的文档 + playground，改动 `src` 或 `docs` 都会热更新。
- 使用 Vite lib mode + `vite-plugin-dts` 构建，可产出 ES/CJS/UMD/IIFE 与类型定义。
- 样式在运行时自动注入，安装组件后无需再单独引入 CSS。

## 更新记录

查看 [CHANGELOG](./CHANGELOG.md) 或文档站点的「更新记录」页面（`pnpm dev` 后访问 `/guide/changelog`）以获取每个版本的详细变更。

## 贡献指南

欢迎通过 Issue / PR 参与建设，请先阅读 [PR 最佳实践](./CONTRIBUTING.md)，按文档流程创建分支、补充 Changeset 与验证结果。

## 开发环境

- Node 18+（项目使用 Volta 固定为 Node 22.14.0 / pnpm 8.6.11）
- 包管理器：pnpm（`preinstall` 会强制）

常用脚本：

| 命令                   | 说明                                                                   |
| ---------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`             | 启动 VitePress 文档与 playground，实时预览组件                         |
| `pnpm watch`           | 监听 `src`，增量构建到 `dist`，便于在其他项目中本地调试                |
| `pnpm docs:build`      | 仅构建文档站静态资源（`docs/.vitepress/dist`）                         |
| `pnpm build`           | 清理并产出库的 `dist` 与 `types`                                       |
| `pnpm preview`         | 以 `DOCS_ENV=preview` 构建并预览文档站（用于检查部署效果）             |
| `pnpm release:prepare` | Changesets 聚合：生成版本号与 `CHANGELOG`，用于 release PR             |
| `pnpm release`         | 构建、`changeset publish` 发布 npm、推送 tag，并串行执行 `docs:deploy` |
| `pnpm docs:deploy`     | （被 `pnpm release` 调用）将最新文档推送到 `gh-pages`                  |

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

## 发布流程（Changesets）

1. 日常 PR 均需运行 `pnpm changeset`，按提示选择 patch/minor/major 并写一句描述，提交生成的 `.changeset/*.md`。
2. 准备发版时，在 release 分支执行 `pnpm release:prepare`（即 `changeset version`）：
   - 汇总所有待发布的 changeset；
   - 更新 `package.json` 版本号及 `CHANGELOG.md`。将这些改动通过 release PR 合入 `master`。
3. 在最新 `master` 上执行 `pnpm release`，它会：
   - 运行 `pnpm build`；
   - 使用 `changeset publish` 发布 npm 包并推送 `vX.Y.Z` tag；
   - 自动调用 `pnpm docs:deploy` 同步文档。

> 发布前请确保已在目标 registry 完成 `npm login`。如需切换 registry，可编辑 `.npmrc` 后重新登录。
