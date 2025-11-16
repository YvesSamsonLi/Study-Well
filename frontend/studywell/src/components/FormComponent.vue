<template>
  <div class="form-box">
    <form @submit.prevent="handleSubmit" class="dynamic-form">
      <h2 v-if="formTitle" class="form-title">{{ formTitle }}</h2>
      <p v-if="formDescription" class="form-description">{{ formDescription }}</p>
      <div class="form-grid">
        <div
          v-for="(field, index) in props.formFields.filter(
            (f) => f.type !== 'link' || f.position !== 'bottom',
          )"
          :key="index"
          class="form-group"
          :style="{ gridColumn: field.gridColumn || 'span 2' }"
        >
          <label v-if="field.type !== 'checkbox'" :for="field.id">{{ field.label }}</label>
          <template v-if="['text', 'email', 'password', 'number'].includes(field.type)">
            <input
              :type="field.type"
              :id="field.id"
              :name="field.id"
              v-model="formData[field.id]"
              :placeholder="field.placeholder"
              :required="field.required"
              :min="field.min"
              :max="field.max"
              class="form-control"
            />
          </template>
          <template v-else-if="field.type === 'textarea'">
            <textarea
              :id="field.id"
              :name="field.id"
              v-model="formData[field.id]"
              :placeholder="field.placeholder"
              :required="field.required"
              class="form-control"
            ></textarea>
          </template>
          <template v-else-if="field.type === 'select'">
            <select
              :id="field.id"
              :name="field.id"
              v-model="formData[field.id]"
              :required="field.required"
              class="form-control"
            >
              <option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </template>
          <template v-else-if="field.type === 'checkbox'">
            <label class="form-checkbox-label">
              <input
                type="checkbox"
                :id="field.id"
                :name="field.id"
                v-model="formData[field.id]"
                class="form-check-input"
              />
              {{ field.label }}
            </label>
          </template>
          <span v-if="errors[field.id]" class="error-message">{{ errors[field.id] }}</span>
        </div>
      </div>
      <slot name="actions" />
      <button type="submit" class="submit-button">{{ props.submitButtonText }}</button>
      <div
        v-for="field in props.formFields.filter(
          (f) => f.type === 'link' && f.position === 'bottom',
        )"
        :key="field.id"
        class="form-bottom-link"
      >
        <span v-if="field.prefix">{{ field.prefix }}</span>
        <a
          :href="field.href"
          @click.prevent="field.action ? $emit('bottom-link-click', field.action) : null"
        >
          {{ field.label }}
        </a>
      </div>
    </form>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, reactive, watch } from 'vue'

const props = defineProps({
  formFields: { type: Array, required: true },
  submitButtonText: { type: String, default: 'Submit' },
  formTitle: { type: String, default: '' },
  formDescription: { type: String, default: '' },
})
const emit = defineEmits(['form-submit', 'bottom-link-click'])
const formData = reactive({})
const errors = reactive({})

const initForm = () => {
  props.formFields.forEach((field) => {
    formData[field.id] = field.defaultValue ?? (field.type === 'checkbox' ? false : '')
  })
  Object.keys(errors).forEach((key) => delete errors[key])
}
initForm()
watch(() => props.formFields, initForm)

function validate() {
  let valid = true
  Object.keys(errors).forEach((key) => delete errors[key])
  props.formFields.forEach((field) => {
    if (field.required && !formData[field.id]) {
      errors[field.id] = `${field.label} is required.`
      valid = false
    }
  })
  return valid
}

function handleSubmit() {
  if (!validate()) return
  emit('form-submit', JSON.parse(JSON.stringify(formData)))
}

function resetForm() {
  initForm()
}

defineExpose({ resetForm })
</script>

<style scoped>
.form-box,
.dynamic-form,
.form-control,
.submit-button {
  width: 100%;
  box-sizing: border-box;
}
.form-box {
  background: var(--surface-hover, rgba(255, 255, 255, 0.93));
  backdrop-filter: blur(8px);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: calc(var(--space-8) + var(--space-2)) var(--space-8) var(--space-8);
  max-width: 700px;
  margin: 0 auto;
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.3));
}

.form-title {
  text-align: center;
  font-size: calc(var(--text-xl) * 1.5);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

.form-description {
  text-align: center;
  margin-bottom: var(--space-6);
  color: var(--text-tertiary);
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5);
  margin-bottom: var(--space-4);
}

.form-group {
  margin-bottom: 0;
}

.form-control {
  padding: var(--space-3);
  border: 1.5px solid var(--border-input);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--surface);
  color: var(--text-primary);
  margin-top: var(--space-1);
  transition: all var(--transition-normal);
}
.form-control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-lighter);
  outline: none;
}

label,
.form-checkbox-label {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.form-checkbox-label {
  display: flex;
  align-items: center;
  font-size: var(--text-base);
  color: var(--text-tertiary);
}
.form-check-input {
  margin-right: var(--space-2);
  accent-color: var(--primary);
}

.error-message {
  color: var(--danger, #dc2626);
  font-size: var(--text-sm);
  margin-top: var(--space-1);
  display: block;
}

.submit-button {
  background-color: var(--primary);
  color: var(--text-on-primary);
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-lg);
  margin-top: var(--space-5);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-normal);
}
.submit-button:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.form-bottom-link {
  margin-top: var(--space-6);
  text-align: center;
  font-size: var(--text-base);
}
.form-bottom-link a {
  color: var(--primary);
  text-decoration: underline;
  font-weight: var(--font-medium);
  transition: color var(--transition-normal);
}
.form-bottom-link a:hover {
  color: var(--primary-hover);
}
</style>
