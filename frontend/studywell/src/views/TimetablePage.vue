<template>
  <div class="timetable-page">
    <div class="timetable-shell">
      <CanvasComponent>
        <div class="timetable-canvas-content">
          <h1 class="timetable-title">Upload Your Class Schedule</h1>
          <p class="timetable-desc">
            Your schedule pdf file will be parsed and you can add it to your google calendar
          </p>

          <PdfFilePicker
            :maxSizeMB="5"
            @file-picked="onClassSchedulePicked"
            @removed="onClassScheduleRemoved"
          />

          <div v-if="classScheduleFile" class="upload-confirm-wrapper">
            <button class="confirm-upload-btn" type="button" @click="handleClassScheduleConfirm">
              Confirm Upload
            </button>
          </div>
        </div>
      </CanvasComponent>

      <CanvasComponent>
        <div class="timetable-canvas-content">
          <h1 class="timetable-title">Upload Your Academic Calendar</h1>
          <p class="timetable-desc">
            Your academic calendar will be used to automatically select your study weeks
          </p>

          <PdfFilePicker
            :maxSizeMB="5"
            @file-picked="onAcademicCalendarPicked"
            @removed="onAcademicCalendarRemoved"
          />

          <div v-if="academicCalendarFile" class="upload-confirm-wrapper">
            <button class="confirm-upload-btn" type="button" @click="handleAcademicCalendarConfirm">
              Confirm Upload
            </button>
          </div>
        </div>
      </CanvasComponent>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CanvasComponent from '@/components/CanvasComponent.vue'
import PdfFilePicker from '@/components/PdfFilePicker.vue'
import { ElMessage } from 'element-plus'

// Store both uploaded files separately
const classScheduleFile = ref(null)
const academicCalendarFile = ref(null)

// File picker 1 handlers:
const onClassSchedulePicked = (file) => {
  classScheduleFile.value = file
}
const onClassScheduleRemoved = () => {
  classScheduleFile.value = null
}
const handleClassScheduleConfirm = () => {
  if (classScheduleFile.value) {
    ElMessage.success('Class schedule upload confirmed!')
    // ...handle upload
  }
}

// File picker 2 handlers:
const onAcademicCalendarPicked = (file) => {
  academicCalendarFile.value = file
}
const onAcademicCalendarRemoved = () => {
  academicCalendarFile.value = null
}
const handleAcademicCalendarConfirm = () => {
  if (academicCalendarFile.value) {
    ElMessage.success('Academic calendar upload confirmed!')
    // ...handle upload
  }
}
</script>

<style scoped>
.timetable-page {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--surface-hover);
  box-sizing: border-box;
}
.timetable-shell {
  width: 98vw;
  height: 90vh;

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-10);
  padding: var(--space-5);
  box-sizing: border-box;
  justify-items: center;
  align-items: center;
}
.timetable-shell :deep(.canvas) {
  width: 100%;
  height: 95%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}
.timetable-canvas-content {
  width: 100%;
  height: 100%;
  padding: var(--space-8);
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1.5px solid var(--border-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  box-sizing: border-box;
  text-align: center;
}
.timetable-title {
  font-size: 2.25rem;
  color: var(--text-primary);
  font-weight: var(--font-bold);
  margin: 0;
}
.timetable-desc {
  color: var(--text-tertiary);
  font-size: var(--text-base);
  max-width: 450px;
  line-height: 1.5;
  margin: var(--space-2) 0 var(--space-6) 0;
}
.upload-confirm-wrapper {
  width: 100%;
  max-width: 420px;
  display: flex;
  justify-content: center;
  margin-top: var(--space-3);
}
.confirm-upload-btn {
  background: var(--primary);
  color: var(--text-on-primary);
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-10);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition:
    background var(--transition-normal),
    transform var(--transition-fast);
}
.confirm-upload-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px) scale(1.025);
}
.confirm-upload-btn:active {
  background: var(--primary);
  transform: scale(0.98);
}
</style>
