<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">My Leave Requests</h1>
        <p class="text-gray-500 text-sm mt-0.5">Welcome back, {{ auth.user?.name }}!</p>
      </div>
      <RouterLink to="/employee/apply" class="btn-primary inline-flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Apply for Leave
      </RouterLink>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div v-for="stat in stats" :key="stat.label" class="card py-4">
        <p class="text-2xl font-bold" :class="stat.color">{{ stat.count }}</p>
        <p class="text-xs text-gray-500 mt-0.5">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-4">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all',
          activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
        ]"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <div class="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-gray-500 mt-3">Loading your leaves…</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredLeaves.length === 0" class="card text-center py-16">
      <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-500 font-medium">No {{ activeTab === 'all' ? '' : activeTab }} leave requests yet.</p>
      <RouterLink v-if="activeTab === 'all'" to="/employee/apply" class="btn-primary inline-block mt-4">
        Apply for Leave
      </RouterLink>
    </div>

    <!-- Leave cards -->
    <div v-else class="space-y-3">
      <div
        v-for="leave in filteredLeaves"
        :key="leave._id"
        class="card hover:shadow-md transition-shadow duration-200"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span :class="badgeClass(leave.status)">{{ leave.status }}</span>
              <span class="text-sm font-medium text-gray-700 capitalize">{{ leaveTypeLabel(leave.leaveType) }}</span>
            </div>
            <p class="text-sm text-gray-500">
              📅 {{ formatDate(leave.startDate) }} → {{ formatDate(leave.endDate) }}
              <span class="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded">{{ leave.totalDays }} day{{ leave.totalDays > 1 ? 's' : '' }}</span>
            </p>
            <p class="text-sm text-gray-600 mt-2">{{ leave.reason }}</p>

            <div v-if="leave.reviewNote" class="mt-2 p-2.5 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span class="font-medium">Review note: </span>{{ leave.reviewNote }}
            </div>
          </div>

          <div class="text-right">
            <p class="text-xs text-gray-400">Applied {{ timeAgo(leave.createdAt) }}</p>
            <p v-if="leave.reviewedBy" class="text-xs text-gray-400 mt-0.5">
              by {{ leave.reviewedBy.name }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import api from '../api'

const auth = useAuthStore()
const leaves = ref([])
const loading = ref(true)
const activeTab = ref('all')
const tabs = ['all', 'pending', 'approved', 'rejected']

const fetchLeaves = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/leaves/my')
    leaves.value = data.leaves
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchLeaves)

const filteredLeaves = computed(() => {
  if (activeTab.value === 'all') return leaves.value
  return leaves.value.filter((l) => l.status === activeTab.value)
})

const stats = computed(() => [
  { label: 'Total', count: leaves.value.length, color: 'text-gray-900' },
  { label: 'Pending', count: leaves.value.filter((l) => l.status === 'pending').length, color: 'text-yellow-600' },
  { label: 'Approved', count: leaves.value.filter((l) => l.status === 'approved').length, color: 'text-green-600' },
  { label: 'Rejected', count: leaves.value.filter((l) => l.status === 'rejected').length, color: 'text-red-600' },
])

const leaveTypeLabel = (type) => {
  const map = { sick: '🤒 Sick', casual: '☀️ Casual', earned: '⭐ Earned', maternity: '🤱 Maternity', paternity: '👨‍👶 Paternity', other: '📋 Other' }
  return map[type] || type
}

const badgeClass = (status) => {
  return { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[status]
}

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const timeAgo = (d) => {
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
</script>
