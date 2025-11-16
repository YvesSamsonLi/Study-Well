<template>
  <div class="login-page-bg">
    <NavbarComponent class="navbar-fixed">
      <template #right>
        <button class="about-button">
          <a href="/about" class="about-text">About Us</a>
        </button>
      </template>
    </NavbarComponent>
    <div class="login-page-center">
      <FormComponent
        :formFields="currentFields"
        :submitButtonText="currentButton"
        :formTitle="currentTitle"
        :formDescription="currentDescription"
        @form-submit="handleSubmit"
        @bottom-link-click="onBottomLinkClick"
        ref="formRef"
      >
        <template #actions>
          <div class="actions-row">
            <!-- not in use -->
          </div>
        </template>
      </FormComponent>
    </div>
  </div>
</template>

<script setup>


import {AUTH_ENDPOINTS} from '@endpoints/auth.ts'
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import FormComponent from '@/components/FormComponent.vue'
import NavbarComponent from '@/components/NavbarComponent.vue'

const mode = ref('login')
const formRef = ref()
const router = useRouter();

function toggleMode() {
  mode.value = mode.value === 'login' ? 'signup' : 'login'
  formRef.value?.resetForm()
}

const loginFields = [
  { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'your@email.com' },
  {
    id: 'password',
    label: 'Password',
    type: 'password',
    required: true,
    placeholder: 'Your password',
  },
  {
    id: 'signup',
    label: 'Click here to sign up.',
    type: 'link',
    href: '#',
    position: 'bottom',
    prefix: "Don't have an account? ",
    action: 'toggle',
  },
]
const signupFields = [
  { id: 'Name', label: 'Name', type: 'text', required: true, gridColumn: 'span 1' },
  { id: 'email', label: 'Email', type: 'email', required: true, gridColumn: 'span 1' },
  { id: 'password', label: 'Password', type: 'password', required: true, gridColumn: 'span 1' },
  {
    id: 'confirmPassword',
    label: 'Confirm password',
    type: 'password',
    required: true,
    gridColumn: 'span 1',
  },
  {
    id: 'terms',
    label: 'I agree with the terms of use',
    type: 'checkbox',
    required: true,
    gridColumn: 'span 2',
  },
  {
    id: 'signin',
    label: 'Sign in',
    type: 'link',
    href: '#',
    position: 'bottom',
    prefix: 'Already have an Account ',
    action: 'toggle',
  },
]

const currentFields = computed(() => (mode.value === 'login' ? loginFields : signupFields))
const currentButton = computed(() => (mode.value === 'login' ? 'Sign In' : 'Sign up'))
const currentTitle = computed(() => (mode.value === 'login' ? 'Sign In' : 'Sign Up'))
const currentDescription = computed(() =>  mode.value === 'login' ? '' : 'Create your StudyWell account',)

async function handleSubmit(formData) {
  console.log('Form data received from child:', formData)

  try {
    const endpoint = mode.value === 'login'
      ? AUTH_ENDPOINTS.login.path
      : AUTH_ENDPOINTS.register.path;

    // Filter the data based on the current mode
    const filteredData = mode.value === 'login'
      ? {
          email: formData.email,
          password: formData.password
        }
      : {
          name: formData.Name, // Note: matches the ID from signupFields
          email: formData.email,
          password: formData.password
        };

    const response = await fetch('http://localhost:3000' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filteredData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Success:', data);
      router.push('/dashboard');
    } else {
      console.error('Error:', await response.text());
      // router.push('/dashboard'); //NIU
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

function onBottomLinkClick(action) {
  if (action === 'toggle') toggleMode()
}

</script>

<style scoped>
.login-page-bg {
  position: fixed; /* Fix the background in place */
  top: 0;
  left: 0;
  min-height: 100vh;
  width: 100vw;
  background: url('/login-bg.jpg') no-repeat center center fixed;
  background-size: cover;
  overflow: hidden; /* Prevent scrolling */
}
.login-page-center {
  position: relative; /* Position relative to the fixed background */
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 10px;
}
.actions-row label {
  font-size: 1.05rem;
}
.actions-row a {
  color: var(--primary);
  font-size: var(--text-base);
  text-decoration: underline;
  cursor: pointer;
  font-weight: var(--font-medium);
}
.navbar-fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  background-color: transparent;
  backdrop-filter: blur(0);
  border-bottom: none;
  box-shadow: none;
}
.about-button {
  background-color: var(--primary);
  color: var(--text-on-primary);
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-base);
  height: 40px;
  width: 100px;
}
.about-text {
  color: var(--text-on-primary);
  text-decoration: none;
  font-weight: var(--font-medium);
  font-size: var(--text-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
