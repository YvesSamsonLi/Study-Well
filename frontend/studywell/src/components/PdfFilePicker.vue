<template>
  <div class="pdf-file-picker">
    <transition name="fade">
      <div v-if="sizeError" class="error-message">
        File is too large! Please upload a PDF below {{ maxSizeMB }}MB and try again.
      </div>
    </transition>
    <div
      v-if="!file"
      class="dropzone"
      :class="{ 'dropzone-active': isDragging }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".pdf"
        class="file-input-hidden"
        @change="handleFileSelect"
      />
      <svg class="upload-icon" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 18C4.23858 18 2 15.7614 2 13C2 10.2386 4.23858 8 7 8C7.36064 8 7.71474 8.0357 8.05761 8.10382C8.62863 5.69588 10.6794 4 13.2 4C16.2928 4 18.8 6.50721 18.8 9.6C18.8 9.88118 18.7817 10.1579 18.7465 10.4289C20.6483 10.8598 22 12.5425 22 14.5714C22 16.9189 20.0852 19 17.6 19H7Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M12 12L12 21M12 12L9 15M12 12L15 15"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <div class="dropzone-text">
        <span v-if="isDragging" class="drop-text">Drop PDF here</span>
        <template v-else>
          <span class="main-text">Drop PDF here or </span>
          <span class="link-text">click to upload</span>
        </template>
      </div>
      <p class="dropzone-hint">PDF only • Max {{ maxSizeMB }}MB</p>
    </div>
    <div v-else>
      <div class="pretty-file-card">
        <div class="pretty-file-left">
          <svg class="pdf-icon" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="4"
              fill="#fff"
              stroke="#ef4444"
              stroke-width="2"
            />
            <path
              d="M7 10H10M7 14H9M14 10H17M13 14V13C13 12.4477 13.4477 12 14 12H17M7 14V13C7 12.4477 7.44772 12 8 12H10"
              stroke="#ef4444"
              stroke-width="1.4"
              stroke-linecap="round"
            />
            <rect x="7.75" y="7.75" width="1.5" height="1.5" rx=".4" fill="#ef4444" />
          </svg>
          <div class="pretty-file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
          </div>
        </div>
        <button
          class="pretty-remove-btn"
          @click="removeFile"
          type="button"
          aria-label="Remove file"
        >
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="10" fill="#f2f2f2" />
            <path
              d="M7 13L13 7M13 13L7 7"
              stroke="#667085"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onUnmounted } from 'vue'

const props = defineProps({
  maxSizeMB: { type: Number, default: 5 },
})
const emit = defineEmits(['file-picked', 'removed'])

const file = ref(null)
const isDragging = ref(false)
const fileInput = ref(null)
const sizeError = ref(false)
let errorTimeout = null

const validateFile = (f) => {
  const isPDF = f.type === 'application/pdf'
  const isLtMax = f.size / 1024 / 1024 < props.maxSizeMB
  if (!isPDF) {
    showSizeError()
    return false
  }
  if (!isLtMax) {
    showSizeError()
    return false
  }
  return true
}
const handleDragOver = () => {
  isDragging.value = true
}
const handleDragLeave = () => {
  isDragging.value = false
}
const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    const f = files[0]
    if (validateFile(f)) {
      file.value = f
      emit('file-picked', f)
    }
  }
}
const triggerFileInput = () => {
  fileInput.value.click()
}
const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    const f = files[0]
    if (validateFile(f)) {
      file.value = f
      emit('file-picked', f)
    }
  }
}
const removeFile = () => {
  file.value = null
  if (fileInput.value) fileInput.value.value = ''
  emit('removed')
}
const showSizeError = () => {
  sizeError.value = true
  if (errorTimeout) clearTimeout(errorTimeout)
  errorTimeout = setTimeout(() => (sizeError.value = false), 3000)
}
onUnmounted(() => {
  if (errorTimeout) clearTimeout(errorTimeout)
})
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024,
    sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.pdf-file-picker {
  width: 100%;
}
.file-input-hidden {
  display: none;
}
.dropzone {
  width: 100%;
  max-width: 480px;
  height: 250px;
  border: 2px dashed var(--border-light);
  border-radius: var(--radius-xl);
  background: var(--surface-hover);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  margin: 0 auto;
  padding: var(--space-8);
  box-sizing: border-box;
}
.dropzone:hover,
.dropzone-active {
  border-color: var(--primary);
  background: var(--primary-light);
}
.upload-icon {
  width: 56px;
  height: 56px;
  color: var(--primary);
  margin-bottom: var(--space-3);
}
.dropzone-text {
  font-size: var(--text-base);
  color: var(--text-tertiary);
  margin-bottom: var(--space-2);
}
.main-text {
  color: var(--text-secondary);
}
.link-text,
.drop-text {
  color: var(--primary);
  font-weight: var(--font-semibold);
  cursor: pointer;
}
.drop-text {
  font-size: var(--text-lg);
}
.dropzone-hint {
  font-size: var(--text-sm);
  color: var(--text-disabled);
  margin: 0;
}

.pretty-file-card {
  width: 100%;
  max-width: 680px;
  min-height: 82px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-5) var(--space-10) var(--space-5) var(--space-5);
  gap: var(--space-4);
}
.pretty-file-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.pdf-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1.5px solid var(--primary);
  box-shadow: var(--shadow-sm);
  padding: 2px;
}
.pretty-file-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}
.file-name {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  line-height: 1.38;
  margin-bottom: 3px;
  max-width: 330px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-size {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: 1.3;
}
.pretty-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 50%;
  padding: 0;
  margin-left: var(--space-3);
  transition: background var(--transition-fast);
  color: var(--text-tertiary);
}
.pretty-remove-btn:hover {
  background: var(--primary-light);
}
.pretty-remove-btn svg {
  display: block;
}
.error-message {
  margin: var(--space-2) auto var(--space-6) auto;
  max-width: 480px;
  background: var(--primary-light);
  color: var(--primary);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  border: 2px solid var(--primary);
  text-align: center;
  box-shadow: var(--shadow-sm);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-slow);
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .pretty-file-card {
    max-width: 97vw;
    padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  }
  .file-name {
    max-width: 80vw;
  }
}
</style>
