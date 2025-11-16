<template>
  <div class="timetable-page">
    <div class="timetable-shell">
      <!-- First PDF Preview CanvasComponent -->
      <CanvasComponent>
        <div class="pdf-canvas-full">
          <button class="close-btn" @click="showClassSchedule = false" v-if="showClassSchedule">
            <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="11" fill="#f2f2f2" />
              <path
                d="M7 15L15 7M15 15L7 7"
                stroke="#223354"
                stroke-width="2.2"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <PDF
            v-if="showClassSchedule"
            :src="classSchedulePdf"
            style="width: 100%; height: 100%; background: #fff; border-radius: 18px"
          />
        </div>
      </CanvasComponent>
      <!-- Second PDF Preview CanvasComponent -->
      <CanvasComponent>
        <div class="pdf-canvas-full">
          <button
            class="close-btn"
            @click="showAcademicCalendar = false"
            v-if="showAcademicCalendar"
          >
            <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="11" fill="#f2f2f2" />
              <path
                d="M7 15L15 7M15 15L7 7"
                stroke="#223354"
                stroke-width="2.2"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <PDF
            v-if="showAcademicCalendar"
            :src="academicCalendarPdf"
            style="width: 100%; height: 100%; background: #fff; border-radius: 18px"
          />
        </div>
      </CanvasComponent>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CanvasComponent from '@/components/CanvasComponent.vue'
import PDF from 'pdf-vue3'

// Sample PDF URLs
const classSchedulePdf = 'ntu_calendar.pdf'
const academicCalendarPdf = 'ntu_calendar.pdf'


const showClassSchedule = ref(true)
const showAcademicCalendar = ref(true)
</script>

<style scoped>
.timetable-page {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f7f8fa;
  box-sizing: border-box;
}
.timetable-shell {
  width: 1600px;
  height: 800px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 20px;
  box-sizing: border-box;
  justify-items: center;
  align-items: center;
}
.pdf-canvas-full {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 32px rgba(33, 39, 47, 0.08);
  overflow: hidden;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}
.close-btn {
  position: absolute;
  top: 20px;
  right: 32px;
  z-index: 22;
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  border-radius: 50%;
  padding: 0;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover {
  background: #eee;
}
</style>
