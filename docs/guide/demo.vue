<template>
  <div class="demo-basic">
    <aside class="demo-basic__controls">
      <label>
        Width
        <input v-model.number="width" type="number" min="160" max="600" />
      </label>
      <label>
        Height
        <input v-model.number="height" type="number" min="120" max="480" />
      </label>
      <label>
        <input v-model="fitParent" type="checkbox" />
        Fit parent
      </label>
      <label>
        <input v-model="maximize" type="checkbox" />
        Maximize
      </label>
    </aside>

    <div class="demo-basic__stage">
      <ResizeContainer
        v-model:width="width"
        v-model:height="height"
        :min-width="160"
        :min-height="120"
        :fit-parent="fitParent"
        :maximize="maximize"
        drag-selector=".demo-basic__header"
      >
        <header class="demo-basic__header">拖我试试</header>
        <section class="demo-basic__body">
          <p>{{ width }} × {{ height }}</p>
          <p>fit-parent: {{ fitParent }}</p>
          <p>maximize: {{ maximize }}</p>
        </section>
      </ResizeContainer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ResizeContainer from '@/ResizeContainer';

const width = ref(320);
const height = ref(220);
const fitParent = ref(false);
const maximize = ref(false);
</script>

<style scoped>
.demo-basic {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  padding: 16px;
  border: 1px dashed var(--vp-c-border);
  border-radius: 12px;
}

.demo-basic__controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  font-size: 14px;
}

.demo-basic__controls label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.demo-basic__controls input[type='number'] {
  width: 80px;
}

.demo-basic__stage {
  position: relative;
  min-height: 240px;
}

.demo-basic__header {
  padding: 10px 16px;
  font-weight: 600;
  color: #fff;
  background: var(--vp-c-brand-1);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  cursor: grab;
}

.demo-basic__body {
  padding: 16px;
  color: var(--vp-c-text-1);
}
</style>
