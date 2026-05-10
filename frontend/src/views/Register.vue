<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Create an account</h1>
        <p class="text-gray-500 mt-1">Join LeaveFlow today</p>
      </div>

      <div class="card">
        <!-- Error alert -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ error }}
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="form-label">Full name</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="John Doe" required />
          </div>

          <div>
            <label class="form-label">Email address</label>
            <input v-model="form.email" type="email" class="form-input" placeholder="you@example.com" required />
          </div>

          <div>
            <label class="form-label">Password <span class="text-gray-400 font-normal">(min. 6 characters)</span></label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input pr-10"
                placeholder="••••••••"
                required
                minlength="6"
              />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Role selection -->
          <div>
            <label class="form-label">I am a…</label>
            <div class="grid grid-cols-2 gap-3 mt-1">
              <button
                v-for="r in ['employee', 'employer']"
                :key="r"
                type="button"
                @click="form.role = r"
                :class="[
                  'py-3 rounded-lg border-2 font-medium text-sm capitalize transition-all',
                  form.role === r
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300',
                ]"
              >
                <span v-if="r === 'employee'">👤 Employee</span>
                <span v-else>🏢 Employer</span>
              </button>
            </div>
          </div>

          <div>
            <label class="form-label">Department <span class="text-gray-400 font-normal">(optional)</span></label>
            <input v-model="form.department" type="text" class="form-input" placeholder="e.g. Engineering" />
          </div>

          <button type="submit" class="btn-primary w-full py-2.5" :disabled="auth.loading">
            <span v-if="auth.loading">Creating account…</span>
            <span v-else>Create account</span>
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-4">
          Already have an account?
          <RouterLink to="/login" class="text-blue-600 hover:underline font-medium">Sign in</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const auth = useAuthStore()
const router = useRouter()

const form = ref({ name: '', email: '', password: '', role: 'employee', department: '' })
const showPassword = ref(false)
const error = ref('')

const handleRegister = async () => {
  error.value = ''
  if (!form.value.role) {
    error.value = 'Please select a role.'
    return
  }
  try {
    await auth.register(form.value)
    router.push(auth.isEmployee ? '/employee' : '/employer')
  } catch (err) {
    const errors = err.response?.data?.errors
    error.value = errors ? errors[0].msg : err.response?.data?.message || 'Registration failed.'
  }
}
</script>
