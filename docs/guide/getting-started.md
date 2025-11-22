# 快速开始

兼容 Vue 2.7（需 `@vue/composition-api`）与 Vue 3，以下示例以 Vue 3 为例。

## 安装

```bash
pnpm add vue-resize-container
```

## 使用方式

<demo src="./demo.vue" title="基础用法" desc="展开弹出层">
</demo>

::: code-group

```ts [Vue 3]
import { createApp } from 'vue'
import App from './App.vue'
import { ResizeContainer } from 'vue-resize-container'

const app = createApp(App)
app.component('ResizeContainer', ResizeContainer)
app.mount('#app')
```

```ts [Vue 2.7]
import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'
import { ResizeContainer } from 'vue-resize-container'

Vue.use(VueCompositionAPI)
Vue.component('ResizeContainer', ResizeContainer)
```

:::

> 若希望一次性注册全部导出组件，仍可沿用 `app.use(VueResizeContainer)` 的插件写法。

## Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| width | 初始宽度，支持数字或字符串（如 `50%`） | `number \| string` | `-` |
| height | 初始高度 | `number \| string` | `-` |
| min-width | 最小宽 | `number` | `0` |
| max-width | 最大宽 | `number` | `-` |
| min-height | 最小高 | `number` | `0` |
| max-height | 最大高 | `number` | `-` |
| left | 初始横向坐标 | `number \| string` | `0` |
| top | 初始纵向坐标 | `number \| string` | `0` |
| active | 生效的拖拽把手集合 | `ResizeHandle[]` | `['r','rb','b','lb','l','lt','t','rt']` |
| fit-parent | 是否限制在父元素内部 | `boolean` | `false` |
| drag-selector | 允许拖拽的子元素选择器 | `string` | `-` |
| maximize | 是否占满父容器 | `boolean` | `false` |
| disable-attributes | 禁用自动计算的属性，支持 `['l','t','w','h']` | `DisableAttr[]` | `[]` |

## 事件

| 事件名 | 说明 | 载荷 |
| --- | --- | --- |
| mount / destroy | 组件挂载与销毁 | `{ left, top, width, height, cmp }` |
| resize:start / move / end | 调整尺寸的三个阶段 | `{ left, top, width, height, cmp }` |
| drag:start / move / end | 拖拽的三个阶段 | `{ left, top, width, height, cmp }` |
| maximize | 最大化状态变化 | `{ state: boolean, left, top, width, height, cmp }` |
