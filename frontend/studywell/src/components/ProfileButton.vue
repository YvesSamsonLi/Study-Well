<template>
  <div class="profile-button" @click="$emit('open-modal')">
    <img :src="profileImage || '/profile.png'" alt="Profile" class="profile-avatar" />
    <div class="profile-info">
      <div class="profile-name">{{ name || '#name' }}</div>
      <div class="profile-status">{{ statusMsg || '#status_msg' }}</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  name: String,
  statusMsg: String,
  profileImage: String,
})
</script>

<style scoped>
.profile-button {
  display: flex;
  align-items: center;
  background-color: var(--surface);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
}
.profile-button:hover {
  box-shadow: var(--shadow-md);
}
.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  object-fit: cover;
  margin-right: var(--space-3);
  border: 1px solid var(--border-light);
  background: var(--surface-hover);
}
.profile-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.profile-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}
.profile-status {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-top: 2px;
}
</style>
