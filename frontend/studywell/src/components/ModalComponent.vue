<template>
  <transition name="modal-fade">
    <div class="modal-backdrop" v-if="visible" @click.self="close">
      <div class="modal modern-modal">
        <header class="modal-header clean-modal-header">
          <slot name="header"></slot>
          <button type="button" class="btn-close clean-btn-close" @click="close" aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" :fill="getVar('--surface-hover')" />
              <path
                d="M7 7l8 8M15 7l-8 8"
                :stroke="getVar('--text-primary')"
                stroke-width="2.2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </header>
        <section class="modal-body clean-modal-body">
          <slot name="body"></slot>
        </section>
        <footer class="modal-footer clean-modal-footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineEmits } from 'vue'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])
function close() {
  emit('close')
}
// helper for dynamic svg color from css variables:
function getVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name) || undefined
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(238, 240, 249, 0.55); /* fallback for old themes */
  background: var(--modal-backdrop-bg, rgba(238, 240, 249, 0.55));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.modern-modal {
  background: var(--surface, #fbfbfd);
  border-radius: var(--radius-xl, 18px);
  box-shadow: var(--shadow-lg, 0 8px 30px rgba(18, 20, 32, 0.15));
  max-width: 385px;
  width: 100%;
  overflow: hidden;
  font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
  color: var(--text-primary);
}

/* Header Styling */
.clean-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5, 1.25rem) var(--space-6, 1.5rem) var(--space-3, 0.75rem)
    var(--space-6, 1.5rem);
  border: none;
  background: transparent;
}

/* X Button Styling */
.clean-btn-close {
  background: none;
  border: none;
  padding: 0;
  margin-left: var(--space-5, 1.25rem);
  align-self: flex-start;
  cursor: pointer;
  transition: box-shadow var(--transition-fast, 150ms ease);
  border-radius: var(--radius-md, 0.5rem);
  height: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.clean-btn-close:hover {
  box-shadow: 0 0 0 2px var(--border-light, #e7e9f3);
  background: var(--surface-hover, #ececf1);
}

/* Body Styling */
.clean-modal-body {
  padding: var(--space-3, 0.75rem) var(--space-6, 1.5rem) var(--space-6, 1.5rem)
    var(--space-6, 1.5rem);
  color: var(--text-primary);
}
/* Footer Styling (Optional) */
.clean-modal-footer {
  background: transparent;
  border: none;
  padding-bottom: var(--space-6, 1.5rem);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
