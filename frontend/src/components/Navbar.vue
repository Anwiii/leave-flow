<template>
  <nav class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <RouterLink
          :to="auth.isEmployee ? '/employee' : '/employer'"
          class="flex items-center gap-2 font-bold text-blue-600 text-lg"
        >
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          LeaveFlow
        </RouterLink>

        <!-- Nav links -->
        <div class="flex items-center gap-4">
          <template v-if="auth.isEmployee">
            <RouterLink to="/employee" class="nav-link">My Leaves</RouterLink>
            <RouterLink to="/employee/apply" class="btn-primary text-sm">+ Apply Leave</RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/employer" class="nav-link">All Requests</RouterLink>
          </template>

          <!-- User menu -->
          <div class="relative ml-2">
            <button
              @click="menuOpen = !menuOpen"
              class="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                {{ auth.user?.name?.charAt(0).toUpperCase() }}
              </div>
              <span class="hidden sm:block text-sm font-medium">{{ auth.user?.name }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              v-if="menuOpen"
              v-click-outside="() => (menuOpen = false)"
              class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50"
            >
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="text-sm font-medium text-gray-900">{{ auth.user?.name }}</p>
                <p class="text-xs text-gray-500">{{ auth.user?.email }}</p>
                <span class="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize">
                  {{ auth.user?.role }}
                </span>
              </div>
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}

// Simple click-outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => {
      if (!el.contains(e.target)) binding.value(e)
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  },
}
</script>

<style scoped>
.nav-link {
  @apply text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors;
}
.router-link-active.nav-link {
  @apply text-blue-600;
}
</style>
