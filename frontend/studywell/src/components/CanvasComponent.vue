<template>
  <div class="canvas">
    <slot />
  </div>
</template>

<script setup>
// No props, purely a dashed border + background
</script>

<style scoped>
.canvas {
  background: #ffffff7e;
  border: 2.5px dashed #bbbbbb;
  border-radius: 14px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
