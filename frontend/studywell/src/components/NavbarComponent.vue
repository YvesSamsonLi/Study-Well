<template>
  <header class="navbar">
    <div class="navbar-section navbar-left">
      <slot name="left">
        <router-link to="/" class="logo-link">
          <img src="/logo.png" alt="Logo" class="navbar-logo" />
        </router-link>
      </slot>
    </div>
    <div class="navbar-section navbar-right">
      <slot name="right">
        <nav class="nav-links">
          <router-link to="/dashboard" class="nav-link" active-class="nav-button">Dashboard</router-link>
          <router-link to="/calendar" class="nav-link" active-class="nav-button">Calendar</router-link>
          <router-link to="/timetable" class="nav-link" active-class="nav-button">Timetable</router-link>
          <ProfileButton
            class="nav-link profile-link"
            :name="userName"
            :status-msg="'You are doing well!'"
            :profile-image="'/profile.png'"
            @open-modal="showModal = true"
          />
        </nav>
      </slot>
    </div>

    <div v-if="sessionExpiredMsg" class="error-message">{{ sessionExpiredMsg }}</div>

    <ModalComponent :visible="showModal" @close="handleCloseModal">
      <template #header>
        <div class="modal-title-row">
          <span class="settings-title">Settings</span>
        </div>
      </template>
      <template #body>
        <div class="settings-modal-content">
          <!-- Scheme selection -->
          <div class="section">
            <label class="section-label">Scheme</label>
            <div class="schemes-row">
              <button
                class="scheme-btn"
                :class="{ active: theme === 'light' }"
                @click="setTheme('light')"
              >
                ☀️ Light
              </button>
              <button
                class="scheme-btn"
                :class="{ active: theme === 'dark' }"
                @click="setTheme('dark')"
              >
                🌑 Dark
              </button>
            </div>
          </div>

          <!-- Profile (password reset only) -->
          <div class="section">
            <label class="section-label">Profile</label>
            <div class="profile-row-wrapper">
              <button class="settings-btn" @click="showResetPasswordForm = !showResetPasswordForm">
                {{ showResetPasswordForm ? 'Cancel Reset Password' : 'Reset Password' }}
              </button>
              <transition name="fade-expand">
                <div v-if="showResetPasswordForm" class="reset-password-form">
                  <FormComponent
                    :formFields="resetPasswordFields"
                    submitButtonText="Confirm New Password"
                    @form-submit="handleResetPassword"
                  />
                  <p v-if="resetPasswordError" class="error-message">{{ resetPasswordError }}</p>
                  <p v-if="resetPasswordSuccess" class="success-message">{{ resetPasswordSuccess }}</p>
                </div>
              </transition>
            </div>
          </div>
          <!-- Share -->
          <div class="section">
            <span class="section-label">If you love our app,</span>
            <div class="share-row">
              <button class="settings-btn" @click="handleShare">Share to Friends</button>
            </div>
          </div>
          <!-- Logout -->
          <div class="section">
              <button class="settings-btn logout-btn" @click="handleLogout">Logout</button>
          </div>
        </div>
      </template>
    </ModalComponent>
  </header>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import ProfileButton from './ProfileButton.vue'
import ModalComponent from './ModalComponent.vue'
import FormComponent from './FormComponent.vue'
import { useRouter } from 'vue-router'
import { AUTH_ENDPOINTS } from '@endpoints/auth.ts'

const showModal = ref(false)
const showResetPasswordForm = ref(false)
const userName = ref('...')
const sessionExpiredMsg = ref('')
const router = useRouter()

// Automatic session expiry monitor
const SESSION_PING_INTERVAL = 5000 // 5 seconds

async function checkSessionValid() {
  const stored = localStorage.getItem('userToken')
  let token
  try {
    const parsed = JSON.parse(stored)
    token = parsed.accessToken || parsed.token || parsed
  } catch {
    token = stored
  }
  if (!token || token === '[object Object]') {
    userName.value = 'User'
    return
  }
  try {
    const response = await fetch('http://localhost:3000/v1/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.status === 401 || response.status === 403) {
      sessionExpiredMsg.value = "Session expired due to inactivity. Redirecting to login..."
      setTimeout(() => {
        localStorage.removeItem('userToken')
        router.push('/login')
        sessionExpiredMsg.value = ''
      }, 2000)
      return
    }
    if (!response.ok) {
      // Any non-OK status triggers logout for safety
      sessionExpiredMsg.value = "Could not contact server or session is invalid. Redirecting to login..."
      setTimeout(() => {
        localStorage.removeItem('userToken')
        router.push('/login')
        sessionExpiredMsg.value = ''
      }, 2000)
      return
    }
    const data = await response.json()
    userName.value = data.name || 'User'
  } catch (err) {
    // Any throw (network crash, connection refused) logs out for security
    sessionExpiredMsg.value = "Connection lost or server offline. Please log in again."
    setTimeout(() => {
      localStorage.removeItem('userToken')
      router.push('/login')
      sessionExpiredMsg.value = ''
    }, 2000)
  }
}


onMounted(() => {
  checkSessionValid() // initial
  setInterval(checkSessionValid, SESSION_PING_INTERVAL)
})

// Theme logic
const theme = ref('light')
function setTheme(val) {
  theme.value = val
}
const themeClass = computed(() => `theme-${theme.value}`)
function applyTheme() {
  document.documentElement.classList.remove('theme-light', 'theme-dark')
  document.documentElement.classList.add(themeClass.value)
}
watch(theme, applyTheme)
onMounted(applyTheme)

// Browser Share logic
function handleShare() {
  const shareUrl = window.location.origin + '/login'
  if (navigator.share) {
    navigator
      .share({
        title: 'Join StudyWell!',
        text: 'We will keep in track for success',
        url: shareUrl,
      })
      .catch(() => {})
  } else {
    window.prompt('Sharing is not supported on this browser. Copy this link!', shareUrl)
  }
}

function handleCloseModal() {
  showModal.value = false
  showResetPasswordForm.value = false
}

async function handleLogout() {
  const stored = localStorage.getItem('userToken');
  let token;
  try {
    const parsed = JSON.parse(stored);
    token = parsed.accessToken || parsed.token || parsed;
  } catch {
    token = stored;
  }
  if (!token || token === '[object Object]') {
    console.error('❌ Invalid token in localStorage');
    return;
  }
  try {
    const response = await fetch('http://localhost:3000' + AUTH_ENDPOINTS.logout.path, {
      method: AUTH_ENDPOINTS.logout.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      const err = await response.json();
      console.error('❌ Logout failed:', err);
      return;
    }
    const data = await response.json();
    localStorage.removeItem('userToken');
    router.push('/login');
  } catch (err) {
    console.error('🔥 Logout error:', err);
  }
}

// --- RESET PASSWORD FORM ---
const resetPasswordFields = [
  {
    id: 'oldPassword',
    type: 'password',
    label: 'Old Password',
    placeholder: 'Enter old password',
    required: true,
    gridColumn: 'span 2'
  },
  {
    id: 'newPassword',
    type: 'password',
    label: 'New Password',
    placeholder: 'Enter new password',
    required: true,
    gridColumn: 'span 2'
  },
  {
    id: 'confirmNewPassword',
    type: 'password',
    label: 'Confirm New Password',
    placeholder: 'Re-enter new password',
    required: true,
    gridColumn: 'span 2'
  }
]
const resetPasswordError = ref('')
const resetPasswordSuccess = ref('')
function validateNewPassword(password, confirm) {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit'
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one alphabet character'
  if (password !== confirm) return 'Passwords do not match'
  return ''
}
async function handleResetPassword(formData) {
  resetPasswordError.value = ''
  resetPasswordSuccess.value = ''
  const stored = localStorage.getItem('userToken')
  let token
  try {
    const parsed = JSON.parse(stored)
    token = parsed.accessToken || parsed.token || parsed
  } catch {
    token = stored
  }
  if (!token || token === '[object Object]') {
    resetPasswordError.value = 'User not authenticated'
    return
  }
  const validationError = validateNewPassword(formData.newPassword, formData.confirmNewPassword)
  if (validationError) {
    resetPasswordError.value = validationError
    return
  }
  try {
    const response = await fetch('http://localhost:3000' + AUTH_ENDPOINTS.password.path, {
      method: AUTH_ENDPOINTS.password.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
        confirmNewPassword: formData.confirmNewPassword
      })
    })
    if (!response.ok) {
      const err = await response.json()
      resetPasswordError.value = err.message || 'Failed to reset password'
      return
    }
    const data = await response.json()
    resetPasswordSuccess.value = 'Password successfully updated!'
  } catch (err) {
    resetPasswordError.value = 'Network error.'
  }
}
</script>

<style scoped>

.success-message {
  color: var(--success, #16a34a);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
  display: block;
}

.error-message {
  color: var(--danger, #dc2626);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
  display: block;
}
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-10);
  background: var(--surface);
  min-height: 72px;
  border-bottom: 1px solid var(--border-light);
  box-sizing: border-box;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}
.navbar-section {
  display: flex;
  align-items: center;
}
.navbar-left {
  gap: var(--space-8);
}
.navbar-right {
  gap: var(--space-7);
}
.navbar-logo {
  height: 40px;
  width: auto;
}
.logo-link {
  text-decoration: none;
  display: flex;
  align-items: center;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}
.nav-link {
  color: var(--text-tertiary);
  text-decoration: none;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
  position: relative;
}
.nav-link:hover {
  color: var(--text-primary);
  background-color: var(--primary-lighter);
}
.nav-link-active {
  color: var(--primary);
  background-color: var(--primary-light);
}
.nav-link-active:hover {
  color: var(--primary);
  background-color: var(--primary-light);
}
.nav-button {
  background-color: var(--primary);
  color: var(--text-on-primary);
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  text-decoration: none;
  transition: var(--transition-normal);
}
.nav-button:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.profile-link {
  padding: 5px;
}

.settings-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding-top: var(--space-3);
}

.modal-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.section-label {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: 5px;
}

.schemes-row {
  display: flex;
  flex-direction: row;
  gap: var(--space-3);
}

.scheme-btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--surface-hover);
  border: 1px solid var(--border-light);
  color: var(--text-tertiary);
  font-weight: var(--font-medium);
  cursor: pointer;
  font-size: var(--text-base);
  outline: none;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.scheme-btn.active {
  border: 1.5px solid var(--primary);
  background: var(--surface);
  color: var(--primary);
}

.settings-btn {
  width: 100%;
  padding: var(--space-2) 0;
  border-radius: var(--radius-md);
  background: var(--surface-hover);
  border: 1px solid var(--border-light);
  font-size: var(--text-base);
  color: var(--text-tertiary);
  font-weight: var(--font-medium);
  cursor: pointer;
  margin-bottom: 3px;
  outline: none;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}
.settings-btn:active,
.settings-btn:focus {
  border-color: var(--primary);
}

.profile-row,
.privacy-row,
.share-row {
  display: flex;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--modal-backdrop-bg, rgba(238, 240, 249, 0.55));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.modern-modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 385px;
  width: 100%;
  overflow: hidden;
  font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
  color: var(--text-primary);
}
.clean-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5) var(--space-6) var(--space-3) var(--space-6);
  border: none;
  background: transparent;
}
.clean-btn-close {
  background: none;
  border: none;
  padding: 0;
  margin-left: var(--space-5);
  align-self: flex-start;
  cursor: pointer;
  transition: box-shadow var(--transition-fast);
  border-radius: var(--radius-md);
  height: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}
.clean-btn-close:hover {
  box-shadow: 0 0 0 2px var(--border-light);
  background: var(--surface-hover);
}
.clean-modal-body {
  padding: var(--space-3) var(--space-6) var(--space-6) var(--space-6);
  color: var(--text-primary);
}
.clean-modal-footer {
  background: transparent;
  border: none;
  padding-bottom: var(--space-6);
}
.profile-row-wrapper {
  display: flex;
  flex-direction: column;
}

.edit-details-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
  overflow: hidden;
}

/* Styles for Reset Password Form */
.reset-password-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
  overflow: hidden;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.form-control {
  padding: var(--space-2);
  border: 1.5px solid var(--border-input);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--surface);
  color: var(--text-primary);
  transition: all var(--transition-normal);
  width: 100%;
  box-sizing: border-box;
}
.form-control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-lighter);
  outline: none;
}

.confirm-btn {
  background-color: var(--primary);
  color: var(--text-on-primary);
  margin-top: var(--space-2);
}

/* Transition for form */
.fade-expand-enter-active,
.fade-expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 300px; /* Adjust as needed */
}
.fade-expand-enter-from,
.fade-expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.logout-btn {
  background-color: var(--surface-hover);
  color: var(--primary);
  border: 1px solid var(--primary);
  font-weight: var(--font-semibold);
  transition:
  background-color var(--transition-fast),
  color var(--transition-fast),
  border-color var(--transition-fast);
}
.logout-btn:hover {
  background-color: var(--primary-light);
  color: var(--text-on-primary);
  border-color: var(--primary-hover);
}

</style>
