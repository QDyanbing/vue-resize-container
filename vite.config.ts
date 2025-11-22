import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const fileNameMap: Record<string, string> = {
  es: 'vue-resize-container.js',
  cjs: 'vue-resize-container.cjs',
  umd: 'vue-resize-container.umd.cjs',
  iife: 'vue-resize-container.iife.js',
};

export default defineConfig({
  plugins: [
    vue(),
    dts({
      beforeWriteFile: (filePath, content) => ({
        filePath,
        content: content.replace(/vue-demi/g, 'vue'),
      }),
    }),
    UnoCSS(),
  ],
  server: {
    port: 5230,
  },
  build: {
    target: 'es2015',
    sourcemap: true,
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueResizeContainer',
      formats: ['es', 'cjs', 'umd', 'iife'],
      fileName: format => fileNameMap[format] ?? `vue-resize-container.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
