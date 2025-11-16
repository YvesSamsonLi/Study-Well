import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@endpoints': resolve(__dirname, '../../shared/endpoints')
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // TODO: update with actual backend server (if local)
        changeOrigin: true,
        secure: false,
      },
    },
  },
})


/*

3. Solution: use the backend’s full URL in fetch()

In your Vue handleSubmit(): ✅ That will send your request straight to the remote backend, skipping the Vite proxy.

const backendBaseUrl = 'http://192.168.1.25:5000'  // or your cloud API URL

const endpoint = mode.value === 'login'
  ? AUTH_ENDPOINTS.login.path
  : AUTH_ENDPOINTS.register.path

const response = await fetch(`${backendBaseUrl}${endpoint}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
})

*/
