<template>
  <button @click="open = true">打开</button>
  <div v-if="open" class="file-view-overlay">
    <ResizeContainer
      isDraggable
      isResizable
      fitParent
      dragSelector=".modal-header"
      :width="520"
      :height="600"
      top="0"
      left="0"
      class="container"
    >
      <div class="file-view-modal">
        <div class="modal-header">
          <span class="modal-title">{{ '文件预览' }}</span>
          <div class="modal-operate">
            <button link @click="open = false">关闭</button>
          </div>
        </div>
        <div class="modal-content" style="width: 400px; height: 300px"></div>
      </div>
    </ResizeContainer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ResizeContainer } from 'vue-resize-container';

const open = ref(false);
</script>

<style scoped lang="less">
.file-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  pointer-events: none;

  .container {
    pointer-events: auto;
    background: #fff;
    border-radius: 8px;
  }

  .file-view-modal {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e4e7ed;
      background: #ccc;
      border-radius: 8px 8px 0 0;
      cursor: move;
      user-select: none;

      .modal-title {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
      }

      .modal-operate {
        display: flex;
        gap: 8px;

        .el-button {
          color: #000;
          font-size: 16px;
          font-weight: 600;
        }
      }
    }
  }
}
</style>
