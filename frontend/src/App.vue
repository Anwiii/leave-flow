<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar v-if="auth.isAuthenticated" />
    <main :class="auth.isAuthenticated ? 'pt-4' : ''">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './store/auth'
import Navbar from './components/Navbar.vue'

const auth = useAuthStore()
</script>
