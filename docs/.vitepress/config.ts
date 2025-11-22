import { applyPlugins } from '@ruabick/md-demo-plugins';
import { genTemp } from '@ruabick/vite-plugin-gen-temp';
import { resolve } from 'node:path';
import { defineConfig } from 'vitepress';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  title: 'Vue Resize Container',
  description: '可同时支持 Vue 2/3 的拖拽缩放容器组件',
  themeConfig: {
    nav: [{ text: '指南', link: '/guide/getting-started' }],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [{ text: '快速开始', link: '/guide/getting-started' }],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/QDyanbing/vue-resize-container' }],
  },
  markdown: {
    config: md => {
      applyPlugins(md);
    },
  },
  vite: {
    plugins: isProd ? [genTemp()] : [],
    resolve: {
      alias: {
        'vue-resize-container': resolve(__dirname, '../../src'),
      },
    },
    server: {
      port: 4330,
    },
  },
});
