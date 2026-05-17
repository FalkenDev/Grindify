<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, Loader2, AlertCircle, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { adminApi, type GlobalActivity, type CreateGlobalActivityPayload, type I18nString } from '@/services/adminApi'
import { ApiError } from '@/services/api'

type Lang = 'default' | 'eng' | 'swe'
const LANGS: { key: Lang; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'eng', label: 'English' },
  { key: 'swe', label: 'Swedish' },
]

const ICONS = [
  'run', 'walk', 'bike', 'soccer', 'swim', 'kayaking', 'hiking', 'yoga',
  'boxing-glove', 'tennis', 'basketball', 'volleyball', 'ski', 'skate',
  'rowing', 'weight-lifter', 'golf', 'rugby', 'hockey-sticks', 'dance-ballroom',
  'dots-horizontal',
]

const loading = ref(true)
const error = ref<string | null>(null)
const activities = ref<GlobalActivity[]>([])
const search = ref('')

const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const saveError = ref<string | null>(null)
const editingId = ref<number | null>(null)
const activeLang = ref<Lang>('default')

const deleteConfirmId = ref<number | null>(null)
const deleting = ref(false)

const emptyForm = (): CreateGlobalActivityPayload => ({
  title: { default: '' },
  description: undefined,
  icon: 'dots-horizontal',
  equipment: [],
  trackDistance: false,
  trackPace: false,
  trackElevation: false,
  trackCalories: true,
})

const form = ref<CreateGlobalActivityPayload>(emptyForm())

async function fetchActivities() {
  loading.value = true
  error.value = null
  try {
    activities.value = await adminApi.getGlobalActivities()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Failed to load activities'
  } finally {
    loading.value = false
  }
}

onMounted(fetchActivities)

const filteredActivities = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return activities.value
  return activities.value.filter(a => {
    const name = (a.title?.default ?? '').toLowerCase()
    const eng = (a.title?.eng ?? '').toLowerCase()
    return name.includes(q) || eng.includes(q)
  })
})

function openCreate() {
  form.value = emptyForm()
  editingId.value = null
  dialogMode.value = 'create'
  activeLang.value = 'default'
  saveError.value = null
  dialogOpen.value = true
}

function openEdit(a: GlobalActivity) {
  form.value = {
    title: { ...a.title },
    description: a.description ? { ...a.description } : undefined,
    icon: a.icon,
    equipment: a.equipment ? [...a.equipment] : [],
    trackDistance: a.trackDistance,
    trackPace: a.trackPace,
    trackElevation: a.trackElevation,
    trackCalories: a.trackCalories,
  }
  editingId.value = a.id
  dialogMode.value = 'edit'
  activeLang.value = 'default'
  saveError.value = null
  dialogOpen.value = true
}

async function save() {
  saving.value = true
  saveError.value = null
  try {
    if (dialogMode.value === 'create') {
      await adminApi.createGlobalActivity(form.value)
    } else if (editingId.value !== null) {
      await adminApi.updateGlobalActivity(editingId.value, form.value)
    }
    dialogOpen.value = false
    await fetchActivities()
  } catch (e) {
    saveError.value = e instanceof ApiError ? e.message : 'Failed to save activity'
  } finally {
    saving.value = false
  }
}

async function confirmDelete(id: number) {
  deleting.value = true
  try {
    await adminApi.deleteGlobalActivity(id)
    deleteConfirmId.value = null
    await fetchActivities()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Failed to delete activity'
  } finally {
    deleting.value = false
  }
}

function i18nGet(obj: I18nString | undefined, lang: Lang): string {
  if (!obj) return ''
  return obj[lang] ?? ''
}

function i18nSet(obj: I18nString | undefined, lang: Lang, val: string): I18nString {
  return { ...(obj ?? { default: null }), [lang]: val }
}

function trackingFlags(a: GlobalActivity): string {
  const flags: string[] = []
  if (a.trackDistance) flags.push('dist')
  if (a.trackPace) flags.push('pace')
  if (a.trackElevation) flags.push('elev')
  if (a.trackCalories) flags.push('cal')
  return flags.join(' · ') || '—'
}
</script>

<template>
  <div class="page-head">
    <div class="titles">
      <h1>Global Activities</h1>
      <p>Manage activity types visible to all users</p>
    </div>
    <button class="btn-primary flex items-center gap-1.5 text-[13px]" @click="openCreate">
      <Plus :size="15" />
      New Activity
    </button>
  </div>

  <div class="flex gap-2 mb-3.5">
    <div class="relative w-[260px]">
      <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
      <input v-model="search" type="text" placeholder="Search activities…" autocomplete="off"
        class="w-full pl-8 pr-3 py-2 bg-surface border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong placeholder:text-faint transition-colors" />
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
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Title (default)</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Icon</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Tracking</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Translations</th>
          <th class="px-4 py-2.5 text-right text-[11.5px] font-bold uppercase tracking-widest text-dim">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="5" class="px-4 py-8">
            <div class="flex items-center gap-2.5 text-mute text-[13px]">
              <Loader2 :size="18" class="animate-spin" />
              <span>Loading activities…</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="filteredActivities.length === 0">
          <td colspan="5" class="px-4 py-8 text-[13px] text-faint">No activities found</td>
        </tr>
        <tr v-for="a in filteredActivities" :key="a.id"
          class="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
          <td class="px-4 py-2.5 text-[13px] font-medium text-text">{{ a.title?.default ?? '—' }}</td>
          <td class="px-4 py-2.5 text-[12.5px] text-mute font-mono">{{ a.icon }}</td>
          <td class="px-4 py-2.5 text-[12px] text-mute">{{ trackingFlags(a) }}</td>
          <td class="px-4 py-2.5 text-[12px] text-mute">
            {{ [a.title?.eng ? 'eng' : '', a.title?.swe ? 'swe' : ''].filter(Boolean).join(', ') || 'default only' }}
          </td>
          <td class="px-4 py-2.5 text-right">
            <div class="flex items-center justify-end gap-1">
              <button class="p-1.5 rounded hover:bg-surface-3 text-mute hover:text-text transition-colors" title="Edit" @click="openEdit(a)">
                <Pencil :size="14" />
              </button>
              <button class="p-1.5 rounded hover:bg-red/10 text-mute hover:text-red transition-colors" title="Delete" @click="deleteConfirmId = a.id">
                <Trash2 :size="14" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Create/Edit Dialog -->
  <div v-if="dialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="dialogOpen = false">
    <div class="bg-surface border border-border rounded-card w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 class="text-[15px] font-semibold text-text">{{ dialogMode === 'create' ? 'New Global Activity' : 'Edit Activity' }}</h2>
        <button class="text-mute hover:text-text transition-colors" @click="dialogOpen = false">✕</button>
      </div>

      <div class="flex border-b border-border px-5">
        <button v-for="lang in LANGS" :key="lang.key"
          class="px-3 py-2.5 text-[12.5px] font-medium border-b-2 transition-colors mr-1"
          :class="activeLang === lang.key ? 'border-primary text-primary' : 'border-transparent text-mute hover:text-text'"
          @click="activeLang = lang.key">
          {{ lang.label }}
        </button>
      </div>

      <div class="p-5 flex flex-col gap-4">
        <div>
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Title *</label>
          <input type="text"
            :value="i18nGet(form.title, activeLang)"
            @input="form.title = i18nSet(form.title, activeLang, ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong" />
        </div>

        <div>
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Description</label>
          <textarea
            :value="i18nGet(form.description, activeLang)"
            @input="form.description = i18nSet(form.description, activeLang, ($event.target as HTMLTextAreaElement).value)"
            rows="2"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong resize-none" />
        </div>

        <template v-if="activeLang === 'default'">
          <div>
            <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Icon</label>
            <select v-model="form.icon"
              class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong font-mono">
              <option v-for="icon in ICONS" :key="icon" :value="icon">{{ icon }}</option>
            </select>
          </div>

          <div>
            <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-2">Tracking Metrics</label>
            <div class="flex flex-wrap gap-3">
              <label class="flex items-center gap-1.5 text-[13px] text-text cursor-pointer">
                <input type="checkbox" v-model="form.trackDistance" class="accent-primary" /> Distance
              </label>
              <label class="flex items-center gap-1.5 text-[13px] text-text cursor-pointer">
                <input type="checkbox" v-model="form.trackPace" class="accent-primary" /> Pace
              </label>
              <label class="flex items-center gap-1.5 text-[13px] text-text cursor-pointer">
                <input type="checkbox" v-model="form.trackElevation" class="accent-primary" /> Elevation
              </label>
              <label class="flex items-center gap-1.5 text-[13px] text-text cursor-pointer">
                <input type="checkbox" v-model="form.trackCalories" class="accent-primary" /> Calories
              </label>
            </div>
          </div>
        </template>

        <div v-if="saveError" class="flex items-center gap-2 text-red text-[13px]">
          <AlertCircle :size="15" />
          <span>{{ saveError }}</span>
        </div>
      </div>

      <div class="flex justify-end gap-2 px-5 py-4 border-t border-border">
        <button class="px-4 py-2 text-[13px] text-mute hover:text-text transition-colors" @click="dialogOpen = false">Cancel</button>
        <button class="btn-primary flex items-center gap-1.5 text-[13px]" :disabled="saving" @click="save">
          <Loader2 v-if="saving" :size="14" class="animate-spin" />
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation -->
  <div v-if="deleteConfirmId !== null" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="deleteConfirmId = null">
    <div class="bg-surface border border-border rounded-card w-full max-w-sm p-6 shadow-2xl">
      <h2 class="text-[15px] font-semibold text-text mb-2">Delete Activity?</h2>
      <p class="text-[13px] text-mute mb-5">Users with activity logs will automatically receive a personal copy. This action cannot be undone.</p>
      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 text-[13px] text-mute hover:text-text transition-colors" @click="deleteConfirmId = null">Cancel</button>
        <button class="px-4 py-2 text-[13px] bg-red text-white rounded-chip hover:opacity-90 transition-opacity flex items-center gap-1.5"
          :disabled="deleting" @click="confirmDelete(deleteConfirmId!)">
          <Loader2 v-if="deleting" :size="14" class="animate-spin" />
          {{ deleting ? 'Deleting…' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>
