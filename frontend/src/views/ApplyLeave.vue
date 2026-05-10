<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/employee" class="text-gray-400 hover:text-gray-600 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </RouterLink>
      <h1 class="text-2xl font-bold text-gray-900">Apply for Leave</h1>
    </div>

    <div class="card">
      <!-- Success state -->
      <div v-if="success" class="text-center py-8">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Application Submitted!</h2>
        <p class="text-gray-500 mb-6">Your leave request is pending approval.</p>
        <div class="flex gap-3 justify-center">
          <button @click="resetForm" class="btn-secondary">Apply Another</button>
          <RouterLink to="/employee" class="btn-primary">View My Leaves</RouterLink>
        </div>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Error -->
        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ error }}
        </div>

        <!-- Leave Type -->
        <div>
          <label class="form-label">Leave Type <span class="text-red-500">*</span></label>
          <select v-model="form.leaveType" class="form-input" required>
            <option value="" disabled>Select leave type</option>
            <option v-for="lt in leaveTypes" :key="lt.value" :value="lt.value">{{ lt.label }}</option>
          </select>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Start Date <span class="text-red-500">*</span></label>
            <input
              v-model="form.startDate"
              type="date"
              class="form-input"
              :min="today"
              required
              @change="validateDates"
            />
          </div>
          <div>
            <label class="form-label">End Date <span class="text-red-500">*</span></label>
            <input
              v-model="form.endDate"
              type="date"
              class="form-input"
              :min="form.startDate || today"
              required
              @change="validateDates"
            />
          </div>
        </div>

        <!-- Duration preview -->
        <div v-if="durationDays > 0" class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          📅 Duration: <strong>{{ durationDays }} day{{ durationDays > 1 ? 's' : '' }}</strong>
        </div>

        <!-- Date error -->
        <div v-if="dateError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {{ dateError }}
        </div>

        <!-- Reason -->
        <div>
          <label class="form-label">
            Reason <span class="text-red-500">*</span>
            <span class="text-gray-400 font-normal ml-1">(min. 10 characters)</span>
          </label>
          <textarea
            v-model="form.reason"
            rows="4"
            class="form-input resize-none"
            placeholder="Briefly describe the reason for your leave request…"
            minlength="10"
            required
          ></textarea>
          <p class="text-xs text-gray-400 mt-1">{{ form.reason.length }} characters</p>
        </div>

        <div class="flex gap-3 pt-2">
          <RouterLink to="/employee" class="btn-secondary flex-1 text-center">Cancel</RouterLink>
          <button type="submit" class="btn-primary flex-1" :disabled="loading || !!dateError">
            <span v-if="loading">Submitting…</span>
            <span v-else>Submit Application</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '../api'

const leaveTypes = [
  { value: 'sick', label: '🤒 Sick Leave' },
  { value: 'casual', label: '☀️ Casual Leave' },
  { value: 'earned', label: '⭐ Earned / Annual Leave' },
  { value: 'maternity', label: '🤱 Maternity Leave' },
  { value: 'paternity', label: '👨‍👶 Paternity Leave' },
  { value: 'other', label: '📋 Other' },
]

const today = new Date().toISOString().split('T')[0]

const form = ref({ leaveType: '', startDate: '', endDate: '', reason: '' })
const loading = ref(false)
const error = ref('')
const success = ref(false)
const dateError = ref('')

const durationDays = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 0
  const start = new Date(form.value.startDate)
  const end = new Date(form.value.endDate)
  if (end < start) return 0
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
})

const validateDates = () => {
  dateError.value = ''
  if (form.value.startDate && form.value.endDate) {
    if (new Date(form.value.endDate) < new Date(form.value.startDate)) {
      dateError.value = 'End date cannot be before start date.'
    }
  }
}

const handleSubmit = async () => {
  if (dateError.value) return
  loading.value = true
  error.value = ''
  try {
    await api.post('/leaves', form.value)
    success.value = true
  } catch (err) {
    const errors = err.response?.data?.errors
    error.value = errors ? errors[0].msg : err.response?.data?.message || 'Failed to submit leave.'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = { leaveType: '', startDate: '', endDate: '', reason: '' }
  success.value = false
  error.value = ''
}
</script>
