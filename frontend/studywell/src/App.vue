<template>
  <div id="app">
    <NavbarComponent
      v-if="!$route.meta.hideNavbar"
      :is-authenticated="isAuthenticated"
      @logout="handleLogout"
    />
    <router-view />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NavbarComponent from './components/NavbarComponent.vue'

// This should be connected to your authentication system
// const isAuthenticated = ref(false)
const isAuthenticated = ref(true) // For testing, assume user is logged in

function handleLogout() {
  // Implement your logout logic here
  isAuthenticated.value = false
  // You might want to redirect to login page
  // router.push('/login')
}
</script>

<style>
@import url('./styles/tokens.css');
/* Global styles here */
html,
body {
  margin: 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  overflow-y: auto;
}

/* Chrome, Safari and Opera */
html::-webkit-scrollbar,
body::-webkit-scrollbar {
  display: none;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding-top: calc(20px + var(--space-6));
  color: var(--text-primary);
  background-color: var(--surface);
}
</style>
