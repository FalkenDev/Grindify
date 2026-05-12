<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Flame } from 'lucide-vue-next'
import { adminApi, type AdminUser } from '@/services/adminApi'
import { ApiError } from '@/services/api'

const loading = ref(true)
const error = ref<string | null>(null)
const users = ref<AdminUser[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const search = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function fetchUsers() {
  loading.value = true
  error.value = null
  try {
    const res = await adminApi.getUsers(page.value, limit, search.value || undefined)
    users.value = res.users
    total.value = res.total
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) {
      error.value = 'Access denied. Superadmin role required.'
    } else {
      error.value = e instanceof Error ? e.message : 'Failed to load users'
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)
watch(page, fetchUsers)
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchUsers() }, 300)
})

const totalPages = () => Math.ceil(total.value / limit)

function initials(u: AdminUser) {
  if (u.firstName || u.lastName) return `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase()
  return u.email[0].toUpperCase()
}

function displayName(u: AdminUser) {
  if (u.firstName || u.lastName) return [u.firstName, u.lastName].filter(Boolean).join(' ')
  return u.email
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}
</script>

<template>
  <div class="page-head">
    <div class="titles">
      <h1>Users</h1>
      <p>Manage user accounts, roles, and access</p>
    </div>
    <span v-if="!loading && !error" class="text-[12.5px] text-mute bg-surface-2 border border-border px-3 py-1 rounded-pill">
      {{ total.toLocaleString() }} users
    </span>
  </div>

  <div class="mb-3.5">
    <div class="relative w-[280px]">
      <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
      <input
        v-model="search"
        type="text"
        placeholder="Search by name or email…"
        autocomplete="off"
        class="w-full pl-8 pr-3 py-2 bg-surface border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong placeholder:text-faint transition-colors"
      />
    </div>
  </div>

  <div v-if="error" class="flex items-center gap-2.5 p-6 text-red text-sm">
    <AlertCircle :size="18" />
    <span>{{ error }}</span>
  </div>

  <div v-else class="bg-surface border border-border rounded-card overflow-hidden">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-border">
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">User</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Role</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Streak</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Verified</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Onboarded</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Joined</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="6" class="px-4 py-8">
            <div class="flex items-center gap-2.5 text-mute text-[13px]">
              <Loader2 :size="18" class="animate-spin" />
              <span>Loading users…</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="users.length === 0">
          <td colspan="6" class="px-4 py-8 text-[13px] text-faint">No users found</td>
        </tr>
        <tr
          v-else
          v-for="user in users"
          :key="user.id"
          class="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
        >
          <td class="px-4 py-2.5 align-middle">
            <div class="flex items-center gap-2.5">
              <div class="w-[30px] h-[30px] rounded-full bg-surface-hi text-text-2 text-[11px] font-bold flex items-center justify-center shrink-0">
                {{ initials(user) }}
              </div>
              <div class="flex flex-col gap-px">
                <span class="text-[13px] font-medium text-text">{{ displayName(user) }}</span>
                <span class="text-[12px] text-dim">{{ user.email }}</span>
              </div>
            </div>
          </td>
          <td class="px-4 py-2.5 align-middle">
            <span
              class="inline-block px-2 py-0.5 rounded-pill text-[11.5px] font-semibold"
              :class="user.role === 'superadmin' ? 'bg-violet-soft text-violet' : 'bg-surface-3 text-mute'"
            >
              {{ user.role }}
            </span>
          </td>
          <td class="px-4 py-2.5 align-middle">
            <span v-if="user.currentStreak > 0" class="flex items-center gap-1 text-[13px] font-semibold text-amber">
              <Flame :size="13" />{{ user.currentStreak }}
            </span>
            <span v-else class="text-ghost text-[13px]">—</span>
          </td>
          <td class="px-4 py-2.5 align-middle">
            <CheckCircle2 v-if="user.emailVerified" :size="16" class="text-emerald" />
            <XCircle v-else :size="16" class="text-faint" />
          </td>
          <td class="px-4 py-2.5 align-middle">
            <CheckCircle2 v-if="user.onboardingCompleted" :size="16" class="text-emerald" />
            <XCircle v-else :size="16" class="text-faint" />
          </td>
          <td class="px-4 py-2.5 align-middle text-[12.5px] text-dim whitespace-nowrap">{{ formatDate(user.createdAt) }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="!loading && totalPages() > 1" class="flex items-center justify-center gap-3 p-3.5 border-t border-border">
      <button
        :disabled="page === 1"
        class="flex items-center justify-center w-[30px] h-[30px] rounded-chip bg-surface-2 border border-border-2 text-text-2 hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        @click="page--"
      >
        <ChevronLeft :size="15" />
      </button>
      <span class="text-[12.5px] text-mute">Page {{ page }} of {{ totalPages() }}</span>
      <button
        :disabled="page >= totalPages()"
        class="flex items-center justify-center w-[30px] h-[30px] rounded-chip bg-surface-2 border border-border-2 text-text-2 hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        @click="page++"
      >
        <ChevronRight :size="15" />
      </button>
    </div>
  </div>
</template>
