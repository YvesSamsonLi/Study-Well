<template>
  <div class="quote-card">
    <div class="quote-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
      </svg>
    </div>

    <div class="quote-content">
      <p class="quote-text">{{ quote }}</p>
    </div>

    <div class="quote-author">
      <div class="author-info">
        <h4 class="author-name">{{ authorName }}</h4>
        <p class="author-title">{{ authorTitle }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  quote: {
    type: String,
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorTitle: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.quote-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  max-width: 700px;
  position: relative;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  border: 1px solid var(--border-light);
}

.quote-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.quote-icon {
  width: 40px;
  height: 40px;
  color: var(--text-disabled);
  margin-bottom: var(--space-4);
}

.quote-content {
  margin-bottom: var(--space-6);
}

.quote-text {
  font-size: var(--text-lg);
  line-height: 1.6;
  color: var(--text-primary);
  font-style: italic;
  margin: 0;
}

.quote-author {
  border-top: 1px solid var(--border-light);
  padding-top: var(--space-4);
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.author-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.author-title {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
}
</style>
