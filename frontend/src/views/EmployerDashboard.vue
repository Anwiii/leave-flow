<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Leave Requests</h1>
      <p class="text-gray-500 text-sm mt-0.5">Manage and review employee leave applications</p>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div v-for="stat in statCards" :key="stat.label" class="card py-4">
        <p class="text-2xl font-bold" :class="stat.color">{{ statData[stat.key] ?? '–' }}</p>
        <p class="text-xs text-gray-500 mt-0.5">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="flex gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          v-for="tab in tabs"
          :key="tab"
          @click="setTab(tab)"
          :class="[
            'px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all',
            activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
          ]"
        >
          {{ tab }}
        </button>
      </div>
      <button @click="fetchLeaves" class="btn-secondary text-sm ml-auto flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <div class="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-gray-500 mt-3">Loading requests…</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="leaves.length === 0" class="card text-center py-16">
      <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="text-gray-500 font-medium">No {{ activeTab === 'all' ? '' : activeTab }} leave requests.</p>
    </div>

    <!-- Leave table (desktop) / Cards (mobile) -->
    <div v-else>
      <!-- Desktop table -->
      <div class="hidden sm:block card p-0 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="leave in leaves" :key="leave._id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs shrink-0">
                    {{ leave.employee?.name?.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ leave.employee?.name }}</p>
                    <p class="text-xs text-gray-400">{{ leave.employee?.department || leave.employee?.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 capitalize">{{ leaveTypeLabel(leave.leaveType) }}</td>
              <td class="px-4 py-4">
                <p class="text-gray-700">{{ formatDate(leave.startDate) }}</p>
                <p class="text-gray-400 text-xs">{{ formatDate(leave.endDate) }} · {{ leave.totalDays }}d</p>
              </td>
              <td class="px-4 py-4 max-w-xs">
                <p class="text-gray-600 truncate" :title="leave.reason">{{ leave.reason }}</p>
              </td>
              <td class="px-4 py-4">
                <span :class="badgeClass(leave.status)">{{ leave.status }}</span>
              </td>
              <td class="px-4 py-4">
                <div v-if="leave.status === 'pending'" class="flex gap-2">
                  <button
                    @click="openReview(leave, 'approved')"
                    class="btn-success"
                    :disabled="reviewingId === leave._id"
                  >✓ Approve</button>
                  <button
                    @click="openReview(leave, 'rejected')"
                    class="btn-danger"
                    :disabled="reviewingId === leave._id"
                  >✕ Reject</button>
                </div>
                <span v-else class="text-xs text-gray-400">
                  {{ leave.reviewedBy ? `by ${leave.reviewedBy.name}` : '–' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="sm:hidden space-y-3">
        <div v-for="leave in leaves" :key="leave._id" class="card">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-semibold text-gray-900">{{ leave.employee?.name }}</p>
              <p class="text-xs text-gray-400">{{ leave.employee?.department || leave.employee?.email }}</p>
            </div>
            <span :class="badgeClass(leave.status)">{{ leave.status }}</span>
          </div>
          <p class="text-sm text-gray-700 capitalize mb-1">{{ leaveTypeLabel(leave.leaveType) }} · {{ leave.totalDays }} days</p>
          <p class="text-xs text-gray-500 mb-2">{{ formatDate(leave.startDate) }} → {{ formatDate(leave.endDate) }}</p>
          <p class="text-sm text-gray-600 mb-3">{{ leave.reason }}</p>
          <div v-if="leave.status === 'pending'" class="flex gap-2">
            <button @click="openReview(leave, 'approved')" class="btn-success flex-1">✓ Approve</button>
            <button @click="openReview(leave, 'rejected')" class="btn-danger flex-1">✕ Reject</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <div v-if="modal.show" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">
          {{ modal.action === 'approved' ? '✅ Approve Leave' : '❌ Reject Leave' }}
        </h2>
        <p class="text-sm text-gray-500 mb-4">
          {{ modal.leave?.employee?.name }}'s {{ leaveTypeLabel(modal.leave?.leaveType) }}
          ({{ formatDate(modal.leave?.startDate) }} → {{ formatDate(modal.leave?.endDate) }})
        </p>

        <div class="mb-4">
          <label class="form-label">Review note <span class="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            v-model="modal.note"
            rows="3"
            class="form-input resize-none"
            :placeholder="modal.action === 'approved' ? 'e.g. Approved. Enjoy your time off!' : 'e.g. Insufficient notice period.'"
          ></textarea>
        </div>

        <div class="flex gap-3">
          <button @click="modal.show = false" class="btn-secondary flex-1">Cancel</button>
          <button
            @click="submitReview"
            :class="modal.action === 'approved' ? 'btn-success flex-1' : 'btn-danger flex-1'"
            :disabled="reviewingId"
          >
            <span v-if="reviewingId">Processing…</span>
            <span v-else>Confirm {{ modal.action === 'approved' ? 'Approval' : 'Rejection' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const leaves = ref([])
const loading = ref(true)
const activeTab = ref('all')
const reviewingId = ref(null)
const statData = ref({})
const tabs = ['all', 'pending', 'approved', 'rejected']

const modal = ref({ show: false, leave: null, action: '', note: '' })

const statCards = [
  { label: 'Total', key: 'total', color: 'text-gray-900' },
  { label: 'Pending', key: 'pending', color: 'text-yellow-600' },
  { label: 'Approved', key: 'approved', color: 'text-green-600' },
  { label: 'Rejected', key: 'rejected', color: 'text-red-600' },
]

const fetchLeaves = async () => {
  loading.value = true
  try {
    const params = activeTab.value !== 'all' ? { status: activeTab.value } : {}
    const [leavesRes, statsRes] = await Promise.all([
      api.get('/leaves', { params }),
      api.get('/leaves/stats'),
    ])
    leaves.value = leavesRes.data.leaves
    statData.value = statsRes.data.stats
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const setTab = (tab) => {
  activeTab.value = tab
  fetchLeaves()
}

const openReview = (leave, action) => {
  modal.value = { show: true, leave, action, note: '' }
}

const submitReview = async () => {
  if (!modal.value.leave) return
  reviewingId.value = modal.value.leave._id
  try {
    await api.patch(`/leaves/${modal.value.leave._id}/review`, {
      status: modal.value.action,
      reviewNote: modal.value.note,
    })
    modal.value.show = false
    await fetchLeaves()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update leave.')
  } finally {
    reviewingId.value = null
  }
}

onMounted(fetchLeaves)

const leaveTypeLabel = (type) => {
  const map = { sick: 'Sick', casual: 'Casual', earned: 'Earned', maternity: 'Maternity', paternity: 'Paternity', other: 'Other' }
  return map[type] || type
}

const badgeClass = (status) => {
  return { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }[status]
}

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
</script>
