<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, RefreshCw, X } from 'lucide-vue-next'
import { adminApi, type AuditLogEntry } from '@/services/adminApi'
import { ApiError } from '@/services/api'

const KNOWN_ACTIONS = [
  'auth.login',
  'auth.login_failed',
  'auth.logout',
  'auth.register',
  'auth.password_reset',
  'user.email_changed',
  'user.deleted',
  'user.export',
  'user.consent_given',
  'user.health_consent_withdrawn',
]

const loading = ref(true)
const error = ref<string | null>(null)
const items = ref<AuditLogEntry[]>([])
const total = ref(0)
const page = ref(1)
const limit = 50

const actionFilter = ref('')
const actorFilter = ref('')
const expanded = ref<Set<AuditLogEntry['id']>>(new Set())

let filterTimeout: ReturnType<typeof setTimeout> | null = null

const actorIdParam = computed(() => {
  const v = actorFilter.value.trim()
  if (!v) return undefined
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : undefined
})

const actorFilterInvalid = computed(() => actorFilter.value.trim() !== '' && actorIdParam.value === undefined)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))
const hasFilters = computed(() => actionFilter.value.trim() !== '' || actorFilter.value.trim() !== '')

async function fetchLogs() {
  if (actorFilterInvalid.value) return
  loading.value = true
  error.value = null
  try {
    const res = await adminApi.getAuditLogs({
      page: page.value,
      limit,
      action: actionFilter.value.trim() || undefined,
      actorId: actorIdParam.value,
    })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) {
      error.value = 'Access denied. Superadmin role required.'
    } else {
      error.value = e instanceof Error ? e.message : 'Failed to load audit logs'
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchLogs)
watch(page, fetchLogs)
watch([actionFilter, actorFilter], () => {
  if (filterTimeout) clearTimeout(filterTimeout)
  filterTimeout = setTimeout(() => {
    if (page.value !== 1) page.value = 1 // triggers fetch via page watcher
    else fetchLogs()
  }, 300)
})

function clearFilters() {
  actionFilter.value = ''
  actorFilter.value = ''
}

function filterByActor(entry: AuditLogEntry) {
  if (entry.actorId != null) actorFilter.value = String(entry.actorId)
}

function filterByAction(entry: AuditLogEntry) {
  actionFilter.value = entry.action
}

function toggle(id: AuditLogEntry['id']) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso))
}

function actionTone(action: string) {
  if (action.endsWith('_failed') || action === 'user.deleted' || action.includes('withdrawn')) {
    return 'bg-red-soft text-red'
  }
  if (action.startsWith('admin.')) return 'bg-violet-soft text-violet'
  if (action.startsWith('auth.')) return 'bg-blue-soft text-blue'
  return 'bg-surface-3 text-mute'
}

function target(entry: AuditLogEntry) {
  if (!entry.targetType && entry.targetId == null) return '—'
  return [entry.targetType, entry.targetId != null ? `#${entry.targetId}` : null].filter(Boolean).join(' ')
}

function hasDetails(entry: AuditLogEntry) {
  return !!entry.userAgent || (entry.metadata != null && Object.keys(entry.metadata).length > 0)
}
</script>

<template>
  <div class="page-head">
    <div class="titles">
      <h1>Audit Logs</h1>
      <p>Full event log for authentication, account and admin actions</p>
    </div>
    <div class="flex items-center gap-2">
      <span v-if="!loading && !error" class="text-[12.5px] text-mute bg-surface-2 border border-border px-3 py-1 rounded-pill">
        {{ total.toLocaleString() }} events
      </span>
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border-2 rounded-chip text-[12.5px] text-text-2 hover:bg-surface-3 disabled:opacity-50 transition-colors cursor-pointer"
        :disabled="loading"
        @click="fetchLogs"
      >
        <RefreshCw :size="13" :class="loading ? 'animate-spin' : ''" />
        Refresh
      </button>
    </div>
  </div>

  <div class="flex flex-wrap items-end gap-3 mb-3.5">
    <div class="flex flex-col gap-1">
      <label for="audit-action" class="text-[11.5px] font-semibold text-dim uppercase tracking-widest">Action</label>
      <input
        id="audit-action"
        v-model="actionFilter"
        type="text"
        list="audit-action-options"
        placeholder="e.g. auth.login"
        autocomplete="off"
        class="w-[240px] px-3 py-2 bg-surface border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong placeholder:text-faint transition-colors"
      />
      <datalist id="audit-action-options">
        <option v-for="a in KNOWN_ACTIONS" :key="a" :value="a" />
      </datalist>
    </div>
    <div class="flex flex-col gap-1">
      <label for="audit-actor" class="text-[11.5px] font-semibold text-dim uppercase tracking-widest">Actor ID</label>
      <input
        id="audit-actor"
        v-model="actorFilter"
        type="text"
        inputmode="numeric"
        placeholder="User ID"
        autocomplete="off"
        class="w-[140px] px-3 py-2 bg-surface border rounded-chip text-[13px] text-text outline-none placeholder:text-faint transition-colors"
        :class="actorFilterInvalid ? 'border-red focus:border-red' : 'border-border-2 focus:border-border-strong'"
      />
    </div>
    <button
      v-if="hasFilters"
      type="button"
      class="flex items-center gap-1 px-3 py-2 text-[12.5px] text-mute hover:text-text transition-colors cursor-pointer"
      @click="clearFilters"
    >
      <X :size="13" /> Clear filters
    </button>
    <span v-if="actorFilterInvalid" class="text-[12px] text-red pb-2">Actor ID must be a positive number</span>
  </div>

  <div v-if="error" class="flex items-center gap-2.5 p-6 text-red text-sm">
    <AlertCircle :size="18" />
    <span>{{ error }}</span>
  </div>

  <div v-else class="bg-surface border border-border rounded-card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse min-w-[860px]">
        <thead>
          <tr class="border-b border-border">
            <th class="w-8 px-2 py-2.5" />
            <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Time</th>
            <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Actor</th>
            <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Action</th>
            <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Target</th>
            <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && items.length === 0">
            <td colspan="6" class="px-4 py-8">
              <div class="flex items-center gap-2.5 text-mute text-[13px]">
                <Loader2 :size="18" class="animate-spin" />
                <span>Loading audit logs…</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="6" class="px-4 py-8 text-[13px] text-faint">
              {{ hasFilters ? 'No events match the current filters' : 'No events recorded yet' }}
            </td>
          </tr>
          <template v-else>
          <template v-for="entry in items" :key="entry.id">
            <tr
              class="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
              :class="loading ? 'opacity-60' : ''"
            >
              <td class="px-2 py-2.5 align-middle">
                <button
                  v-if="hasDetails(entry)"
                  type="button"
                  class="flex items-center justify-center w-6 h-6 rounded text-faint hover:text-text hover:bg-surface-3 transition-colors cursor-pointer"
                  :aria-expanded="expanded.has(entry.id)"
                  :aria-label="expanded.has(entry.id) ? 'Hide details' : 'Show details'"
                  @click="toggle(entry.id)"
                >
                  <ChevronDown :size="14" class="transition-transform" :class="expanded.has(entry.id) ? 'rotate-180' : ''" />
                </button>
              </td>
              <td class="px-4 py-2.5 align-middle text-[12.5px] text-dim whitespace-nowrap">{{ formatTime(entry.createdAt) }}</td>
              <td class="px-4 py-2.5 align-middle">
                <button
                  v-if="entry.actorId != null || entry.actorEmail"
                  type="button"
                  class="flex flex-col gap-px text-left cursor-pointer group"
                  :title="entry.actorId != null ? 'Filter by this actor' : undefined"
                  @click="filterByActor(entry)"
                >
                  <span class="text-[13px] text-text group-hover:underline">{{ entry.actorEmail ?? 'Unknown' }}</span>
                  <span v-if="entry.actorId != null" class="text-[11.5px] text-faint font-mono">#{{ entry.actorId }}</span>
                </button>
                <span v-else class="text-[13px] text-ghost">anonymous</span>
              </td>
              <td class="px-4 py-2.5 align-middle">
                <button
                  type="button"
                  class="inline-block px-2 py-0.5 rounded-pill text-[11.5px] font-semibold font-mono cursor-pointer hover:opacity-80"
                  :class="actionTone(entry.action)"
                  title="Filter by this action"
                  @click="filterByAction(entry)"
                >
                  {{ entry.action }}
                </button>
              </td>
              <td class="px-4 py-2.5 align-middle text-[12.5px] text-mute">{{ target(entry) }}</td>
              <td class="px-4 py-2.5 align-middle text-[12px] text-dim font-mono whitespace-nowrap">{{ entry.ip ?? '—' }}</td>
            </tr>
            <tr v-if="expanded.has(entry.id)" class="border-b border-border bg-bg-2">
              <td />
              <td colspan="5" class="px-4 py-3">
                <div v-if="entry.userAgent" class="text-[12px] text-dim mb-2 break-all">
                  <span class="font-semibold text-mute">User agent:</span> {{ entry.userAgent }}
                </div>
                <pre
                  v-if="entry.metadata && Object.keys(entry.metadata).length"
                  class="text-[12px] font-mono text-text-2 bg-surface-2 border border-border-2 rounded-chip p-3 overflow-x-auto whitespace-pre-wrap break-all"
                >{{ JSON.stringify(entry.metadata, null, 2) }}</pre>
              </td>
            </tr>
          </template>
          </template>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 p-3.5 border-t border-border">
      <button
        type="button"
        :disabled="page === 1 || loading"
        aria-label="Previous page"
        class="flex items-center justify-center w-[30px] h-[30px] rounded-chip bg-surface-2 border border-border-2 text-text-2 hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        @click="page--"
      >
        <ChevronLeft :size="15" />
      </button>
      <span class="text-[12.5px] text-mute">Page {{ page }} of {{ totalPages }}</span>
      <button
        type="button"
        :disabled="page >= totalPages || loading"
        aria-label="Next page"
        class="flex items-center justify-center w-[30px] h-[30px] rounded-chip bg-surface-2 border border-border-2 text-text-2 hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        @click="page++"
      >
        <ChevronRight :size="15" />
      </button>
    </div>
  </div>
</template>
