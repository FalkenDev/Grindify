<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Search, Loader2, AlertCircle, Plus, Pencil, Trash2, TriangleAlert } from 'lucide-vue-next'
import {
  adminApi,
  type AdminMuscleGroup,
  type I18nString,
  type CreateMuscleGroupPayload,
} from '@/services/adminApi'
import { ApiError } from '@/services/api'

type Lang = 'default' | 'eng' | 'swe'
const LANGS: { key: Lang; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'eng', label: 'English' },
  { key: 'swe', label: 'Swedish' },
]

const loading = ref(true)
const error = ref<string | null>(null)
const muscleGroups = ref<AdminMuscleGroup[]>([])
const search = ref('')

// ─── Create / Edit dialog ─────────────────────────────────────────────────────

const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const saveError = ref<string | null>(null)
const editingId = ref<number | null>(null)
const activeLang = ref<Lang>('default')

interface MgForm {
  name: string
  nameI18n: I18nString
  descriptionI18n?: I18nString
}

function emptyForm(): MgForm {
  return { name: '', nameI18n: { default: '' }, descriptionI18n: undefined }
}

const form = ref<MgForm>(emptyForm())

// ─── Delete dialog ────────────────────────────────────────────────────────────

const pendingDeleteMg = ref<AdminMuscleGroup | null>(null)
const deleteExercises = ref<{ id: number; title: I18nString }[]>([])
const deleteExercisesLoading = ref(false)
const deleteAccepted = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

// ─── Data loading ─────────────────────────────────────────────────────────────

async function fetchMuscleGroups() {
  loading.value = true
  error.value = null
  try {
    muscleGroups.value = await adminApi.getMuscleGroups()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Failed to load muscle groups'
  } finally {
    loading.value = false
  }
}

onMounted(fetchMuscleGroups)

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return muscleGroups.value
  return muscleGroups.value.filter(mg => {
    const key = mg.name.toLowerCase()
    const def = (mg.nameI18n?.default ?? '').toLowerCase()
    const eng = (mg.nameI18n?.eng ?? '').toLowerCase()
    return key.includes(q) || def.includes(q) || eng.includes(q)
  })
})

// ─── Create / Edit ────────────────────────────────────────────────────────────

function openCreate() {
  form.value = emptyForm()
  editingId.value = null
  dialogMode.value = 'create'
  activeLang.value = 'default'
  saveError.value = null
  dialogOpen.value = true
}

function openEdit(mg: AdminMuscleGroup) {
  form.value = {
    name: mg.name,
    nameI18n: mg.nameI18n ? { ...mg.nameI18n } : { default: mg.name },
    descriptionI18n: mg.descriptionI18n ? { ...mg.descriptionI18n } : undefined,
  }
  editingId.value = mg.id
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
      const payload: CreateMuscleGroupPayload = {
        name: form.value.name.trim(),
        nameI18n: form.value.nameI18n,
        descriptionI18n: form.value.descriptionI18n,
      }
      await adminApi.createMuscleGroup(payload)
    } else if (editingId.value !== null) {
      await adminApi.updateMuscleGroup(editingId.value, {
        nameI18n: form.value.nameI18n,
        descriptionI18n: form.value.descriptionI18n,
      })
    }
    dialogOpen.value = false
    await fetchMuscleGroups()
  } catch (e) {
    saveError.value = e instanceof ApiError ? e.message : 'Failed to save muscle group'
  } finally {
    saving.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function openDelete(mg: AdminMuscleGroup) {
  pendingDeleteMg.value = mg
  deleteAccepted.value = false
  deleteError.value = null
  deleteExercises.value = []
  deleteExercisesLoading.value = true

  try {
    deleteExercises.value = await adminApi.getMuscleGroupExercises(mg.id)
  } catch {
    // Non-fatal: dialog still opens, user can proceed without the list
  } finally {
    deleteExercisesLoading.value = false
  }
}

function closeDelete() {
  pendingDeleteMg.value = null
}

async function confirmDelete() {
  if (!pendingDeleteMg.value) return
  deleting.value = true
  deleteError.value = null
  try {
    await adminApi.deleteMuscleGroup(pendingDeleteMg.value.id)
    pendingDeleteMg.value = null
    await fetchMuscleGroups()
  } catch (e) {
    deleteError.value = e instanceof ApiError ? e.message : 'Failed to delete muscle group'
  } finally {
    deleting.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function i18nGet(obj: I18nString | undefined, lang: Lang): string {
  if (!obj) return ''
  return obj[lang] ?? ''
}

function i18nSet(obj: I18nString | undefined, lang: Lang, val: string): I18nString {
  return { ...(obj ?? { default: null }), [lang]: val }
}

function coverageLabel(mg: AdminMuscleGroup): string {
  const langs: string[] = []
  if (mg.nameI18n?.eng) langs.push('eng')
  if (mg.nameI18n?.swe) langs.push('swe')
  return langs.length ? langs.join(', ') : 'default only'
}
</script>

<template>
  <div class="page-head">
    <div class="titles">
      <h1>Muscle Groups</h1>
      <p>Manage muscle groups — create, edit translations, or remove</p>
    </div>
    <button class="btn-primary flex items-center gap-1.5 text-[13px]" @click="openCreate">
      <Plus :size="15" />
      New Muscle Group
    </button>
  </div>

  <div class="flex gap-2 mb-3.5">
    <div class="relative w-[260px]">
      <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
      <input v-model="search" type="text" placeholder="Search muscle groups…" autocomplete="off"
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
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Key</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Default name</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">English</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Swedish</th>
          <th class="px-4 py-2.5 text-right text-[11.5px] font-bold uppercase tracking-widest text-dim">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="5" class="px-4 py-8">
            <div class="flex items-center gap-2.5 text-mute text-[13px]">
              <Loader2 :size="18" class="animate-spin" />
              <span>Loading muscle groups…</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="filteredGroups.length === 0">
          <td colspan="5" class="px-4 py-8 text-[13px] text-faint">No muscle groups found</td>
        </tr>
        <tr v-for="mg in filteredGroups" :key="mg.id"
          class="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
          <td class="px-4 py-2.5 text-[12.5px] text-mute font-mono">{{ mg.name }}</td>
          <td class="px-4 py-2.5 text-[13px] text-text">{{ mg.nameI18n?.default ?? mg.name }}</td>
          <td class="px-4 py-2.5 text-[13px]" :class="mg.nameI18n?.eng ? 'text-text' : 'text-faint'">
            {{ mg.nameI18n?.eng ?? '—' }}
          </td>
          <td class="px-4 py-2.5 text-[13px]" :class="mg.nameI18n?.swe ? 'text-text' : 'text-faint'">
            {{ mg.nameI18n?.swe ?? '—' }}
          </td>
          <td class="px-4 py-2.5 text-right">
            <div class="flex items-center justify-end gap-1">
              <button class="p-1.5 rounded hover:bg-surface-3 text-mute hover:text-text transition-colors" title="Edit" @click="openEdit(mg)">
                <Pencil :size="14" />
              </button>
              <button class="p-1.5 rounded hover:bg-red/10 text-mute hover:text-red transition-colors" title="Delete" @click="openDelete(mg)">
                <Trash2 :size="14" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Create / Edit Dialog -->
  <div v-if="dialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="dialogOpen = false">
    <div class="bg-surface border border-border rounded-card w-full max-w-lg shadow-2xl">
      <div class="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 class="text-[15px] font-semibold text-text">
          {{ dialogMode === 'create' ? 'New Muscle Group' : 'Edit Muscle Group' }}
          <span v-if="dialogMode === 'edit'" class="font-mono text-mute text-[13px] ml-1">{{ form.name }}</span>
        </h2>
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
        <!-- Key field: only editable on create, shown read-only on edit -->
        <div v-if="activeLang === 'default'">
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">
            Internal Key *
            <span class="ml-1 font-normal normal-case tracking-normal text-faint">(unique, no spaces)</span>
          </label>
          <input v-if="dialogMode === 'create'" type="text" v-model="form.name" placeholder="e.g. lowerBack"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text font-mono outline-none focus:border-border-strong placeholder:text-faint" />
          <div v-else class="px-3 py-2 bg-surface-3 border border-border rounded-chip text-[13px] text-mute font-mono">
            {{ form.name }}
          </div>
        </div>

        <div>
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Display Name</label>
          <input type="text"
            :value="i18nGet(form.nameI18n, activeLang)"
            @input="form.nameI18n = i18nSet(form.nameI18n, activeLang, ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong" />
        </div>

        <div>
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Description</label>
          <input type="text"
            :value="i18nGet(form.descriptionI18n, activeLang)"
            @input="form.descriptionI18n = i18nSet(form.descriptionI18n, activeLang, ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong" />
        </div>

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

  <!-- Delete Confirmation Dialog -->
  <div v-if="pendingDeleteMg" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="closeDelete">
    <div class="bg-surface border border-border rounded-card w-full max-w-md shadow-2xl">
      <div class="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 class="text-[15px] font-semibold text-text">Delete Muscle Group?</h2>
        <button class="text-mute hover:text-text transition-colors" @click="closeDelete">✕</button>
      </div>

      <div class="p-5 flex flex-col gap-4">
        <p class="text-[13px] text-mute">
          You are about to delete
          <span class="text-text font-medium">{{ pendingDeleteMg.nameI18n?.default ?? pendingDeleteMg.name }}</span>
          <span class="font-mono text-faint text-[12px] ml-1">({{ pendingDeleteMg.name }})</span>.
        </p>

        <!-- Loading exercises -->
        <div v-if="deleteExercisesLoading" class="flex items-center gap-2 text-[13px] text-mute">
          <Loader2 :size="15" class="animate-spin" />
          <span>Checking exercise references…</span>
        </div>

        <!-- Exercises using this group -->
        <template v-else-if="deleteExercises.length > 0">
          <div class="rounded-card border border-amber-500/30 bg-amber-500/5 p-3.5 flex flex-col gap-2">
            <div class="flex items-center gap-2 text-amber-400 text-[13px] font-medium">
              <TriangleAlert :size="15" />
              {{ deleteExercises.length }} exercise{{ deleteExercises.length === 1 ? '' : 's' }} reference this muscle group
            </div>
            <ul class="max-h-36 overflow-y-auto flex flex-col gap-0.5 mt-0.5">
              <li v-for="ex in deleteExercises" :key="ex.id"
                class="text-[12.5px] text-mute pl-1 border-l-2 border-border">
                {{ ex.title?.default ?? ex.title?.eng ?? `Exercise #${ex.id}` }}
              </li>
            </ul>
            <p class="text-[12px] text-faint mt-0.5">
              The muscle group will be removed from these exercises. The exercises themselves will not be deleted.
            </p>
          </div>

          <label class="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" v-model="deleteAccepted" class="mt-0.5 accent-red flex-shrink-0" />
            <span class="text-[13px] text-text">I understand and accept that this muscle group will be unlinked from the exercises listed above</span>
          </label>
        </template>

        <!-- No exercises using this group -->
        <p v-else class="text-[13px] text-mute">
          No exercises reference this muscle group. This action cannot be undone.
        </p>

        <div v-if="deleteError" class="flex items-center gap-2 text-red text-[13px]">
          <AlertCircle :size="15" />
          <span>{{ deleteError }}</span>
        </div>
      </div>

      <div class="flex justify-end gap-2 px-5 py-4 border-t border-border">
        <button class="px-4 py-2 text-[13px] text-mute hover:text-text transition-colors" @click="closeDelete">Cancel</button>
        <button
          class="px-4 py-2 text-[13px] bg-red text-white rounded-chip hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="deleting || deleteExercisesLoading || (deleteExercises.length > 0 && !deleteAccepted)"
          @click="confirmDelete">
          <Loader2 v-if="deleting" :size="14" class="animate-spin" />
          {{ deleting ? 'Deleting…' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>
