<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Search, Loader2, AlertCircle, Plus, Pencil, Trash2,
  Image as ImageIcon, X, Upload, Film, ChevronLeft, ChevronRight,
} from 'lucide-vue-next'
import {
  adminApi,
  type GlobalExercise,
  type CreateGlobalExercisePayload,
  type I18nString,
  type I18nStringArray,
  type AdminMuscleGroup,
  type ExerciseImage,
  type ExerciseMediaItem,
} from '@/services/adminApi'
import { ApiError } from '@/services/api'
import ExerciseImagesView from './ExerciseImagesView.vue'

type Lang = 'default' | 'eng' | 'swe'
const LANGS: { key: Lang; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'eng', label: 'English' },
  { key: 'swe', label: 'Swedish' },
]

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:1337/v1'
function resolveUrl(url: string) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return BASE_URL.replace('/v1', '') + url
}

// ─── State ────────────────────────────────────────────────────────────────────

const loading = ref(true)
const error = ref<string | null>(null)
const exercises = ref<GlobalExercise[]>([])
const muscleGroups = ref<AdminMuscleGroup[]>([])
const search = ref('')
const filterType = ref('')

const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const saving = ref(false)
const saveError = ref<string | null>(null)
const editingId = ref<number | null>(null)
const activeLang = ref<Lang>('default')

const deleteConfirmId = ref<number | null>(null)
const deleting = ref(false)

// Image picker
const imagePickerOpen = ref(false)

// Media (only in edit mode)
const currentMedia = ref<ExerciseMediaItem[]>([])
const uploadingMedia = ref(false)
const mediaError = ref<string | null>(null)

// ─── Form ─────────────────────────────────────────────────────────────────────

const emptyForm = (): CreateGlobalExercisePayload => ({
  title: { default: '' },
  description: undefined,
  exerciseType: undefined,
  muscleGroupIds: [],
  primaryMuscleGroupIds: [],
  equipmentI18n: { default: [] },
  imageUrl: undefined,
  instructionsI18n: { default: [] },
  proTipsI18n: { default: [] },
  mistakesI18n: { default: [] },
})

const form = ref<CreateGlobalExercisePayload>(emptyForm())

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchAll() {
  loading.value = true
  error.value = null
  try {
    ;[exercises.value, muscleGroups.value] = await Promise.all([
      adminApi.getGlobalExercises(),
      adminApi.getMuscleGroups(),
    ])
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Failed to load data'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

// ─── Filtering ────────────────────────────────────────────────────────────────

const filteredExercises = computed(() => {
  let list = exercises.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(ex => {
      const name = (ex.title?.default ?? '').toLowerCase()
      const eng = (ex.title?.eng ?? '').toLowerCase()
      return name.includes(q) || eng.includes(q)
    })
  }
  if (filterType.value) {
    list = list.filter(ex => ex.exerciseType === filterType.value)
  }
  return list
})

// ─── Dialog open/close ────────────────────────────────────────────────────────

function openCreate() {
  form.value = emptyForm()
  editingId.value = null
  dialogMode.value = 'create'
  activeLang.value = 'default'
  saveError.value = null
  currentMedia.value = []
  mediaError.value = null
  dialogOpen.value = true
}

function openEdit(ex: GlobalExercise) {
  form.value = {
    title: { ...ex.title },
    description: ex.description ? { ...ex.description } : undefined,
    exerciseType: ex.exerciseType ?? undefined,
    muscleGroupIds: ex.muscleGroups?.map(m => m.id) ?? [],
    primaryMuscleGroupIds: ex.primaryMuscleGroups?.map(m => m.id) ?? [],
    equipmentI18n: ex.equipmentI18n ? { ...ex.equipmentI18n } : { default: [] },
    imageUrl: ex.image ?? undefined,
    instructionsI18n: ex.instructionsI18n ? { ...ex.instructionsI18n } : { default: [] },
    proTipsI18n: ex.proTipsI18n ? { ...ex.proTipsI18n } : { default: [] },
    mistakesI18n: ex.mistakesI18n ? { ...ex.mistakesI18n } : { default: [] },
  }
  editingId.value = ex.id
  dialogMode.value = 'edit'
  activeLang.value = 'default'
  saveError.value = null
  currentMedia.value = [...(ex.media ?? [])]
  mediaError.value = null
  dialogOpen.value = true
}

// ─── Save / Delete ───────────────────────────────────────────────────────────

async function save() {
  saving.value = true
  saveError.value = null
  try {
    if (dialogMode.value === 'create') {
      await adminApi.createGlobalExercise(form.value)
    } else if (editingId.value !== null) {
      await adminApi.updateGlobalExercise(editingId.value, form.value)
    }
    dialogOpen.value = false
    await fetchAll()
  } catch (e) {
    saveError.value = e instanceof ApiError ? e.message : 'Failed to save exercise'
  } finally {
    saving.value = false
  }
}

async function confirmDelete(id: number) {
  deleting.value = true
  try {
    await adminApi.deleteGlobalExercise(id)
    deleteConfirmId.value = null
    await fetchAll()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Failed to delete exercise'
  } finally {
    deleting.value = false
  }
}

// ─── Image picker ─────────────────────────────────────────────────────────────

function onImagePicked(img: ExerciseImage) {
  form.value.imageUrl = img.url
  imagePickerOpen.value = false
}

// ─── Media management (edit mode only) ───────────────────────────────────────

async function uploadMedia(file: File) {
  if (!editingId.value) return
  uploadingMedia.value = true
  mediaError.value = null
  try {
    const updated = await adminApi.uploadGlobalExerciseMedia(editingId.value, file)
    currentMedia.value = updated.media ?? []
    // Also update the exercises list so the table stays fresh
    exercises.value = exercises.value.map(ex =>
      ex.id === editingId.value ? { ...ex, media: updated.media } : ex
    )
  } catch (e) {
    mediaError.value = e instanceof ApiError ? e.message : 'Upload failed'
  } finally {
    uploadingMedia.value = false
  }
}

function onMediaFileInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadMedia(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function deleteMedia(mediaId: number) {
  if (!editingId.value) return
  mediaError.value = null
  try {
    const updated = await adminApi.deleteGlobalExerciseMedia(editingId.value, mediaId)
    currentMedia.value = updated.media ?? []
  } catch (e) {
    mediaError.value = e instanceof ApiError ? e.message : 'Failed to delete media'
  }
}

async function moveMedia(mediaId: number, direction: -1 | 1) {
  if (!editingId.value) return
  const sorted = [...currentMedia.value].sort((a, b) => a.order - b.order)
  const idx = sorted.findIndex(m => m.id === mediaId)
  const swapIdx = idx + direction
  if (swapIdx < 0 || swapIdx >= sorted.length) return
  // Swap in local list optimistically
  ;[sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]]
  currentMedia.value = sorted
  try {
    const updated = await adminApi.reorderGlobalExerciseMedia(editingId.value, sorted.map(m => m.id))
    currentMedia.value = updated.media ?? []
  } catch (e) {
    mediaError.value = e instanceof ApiError ? e.message : 'Failed to reorder media'
  }
}

// ─── i18n helpers ────────────────────────────────────────────────────────────

function i18nGet(obj: I18nString | undefined, lang: Lang): string {
  if (!obj) return ''
  return obj[lang] ?? ''
}

function i18nSet(obj: I18nString | undefined, lang: Lang, val: string): I18nString {
  return { ...(obj ?? { default: null }), [lang]: val }
}

function arrGet(obj: I18nStringArray | undefined, lang: Lang): string {
  if (!obj) return ''
  return (obj[lang] ?? []).join('\n')
}

function arrSet(obj: I18nStringArray | undefined, lang: Lang, val: string): I18nStringArray {
  const lines = val.split('\n').map(s => s.trim()).filter(Boolean)
  return { ...(obj ?? {}), [lang]: lines }
}

function coverageFor(ex: GlobalExercise): string {
  const langs: string[] = []
  if (ex.title?.eng) langs.push('eng')
  if (ex.title?.swe) langs.push('swe')
  return langs.length ? langs.join(', ') : 'default only'
}

// ─── Muscle group toggle helpers ──────────────────────────────────────────────

function toggleMuscleGroup(id: number) {
  const list = form.value.muscleGroupIds ?? []
  form.value.muscleGroupIds = list.includes(id)
    ? list.filter(x => x !== id)
    : [...list, id]
}

function togglePrimaryMuscleGroup(id: number) {
  const list = form.value.primaryMuscleGroupIds ?? []
  form.value.primaryMuscleGroupIds = list.includes(id)
    ? list.filter(x => x !== id)
    : [...list, id]
}

function mgName(mg: AdminMuscleGroup): string {
  return mg.nameI18n?.eng ?? mg.nameI18n?.default ?? mg.name
}
</script>

<template>
  <div class="page-head">
    <div class="titles">
      <h1>Global Exercises</h1>
      <p>Manage the shared exercise library visible to all users</p>
    </div>
    <button class="btn-primary flex items-center gap-1.5 text-[13px]" @click="openCreate">
      <Plus :size="15" />
      New Exercise
    </button>
  </div>

  <!-- Filters -->
  <div class="flex gap-2 mb-3.5">
    <div class="relative w-[260px]">
      <Search :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
      <input v-model="search" type="text" placeholder="Search exercises…" autocomplete="off"
        class="w-full pl-8 pr-3 py-2 bg-surface border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong placeholder:text-faint transition-colors" />
    </div>
    <select v-model="filterType"
      class="bg-surface border border-border-2 rounded-chip text-[13px] text-text px-3 py-2 outline-none focus:border-border-strong">
      <option value="">All types</option>
      <option value="compound">Compound</option>
      <option value="isolation">Isolation</option>
      <option value="bodyweight">Bodyweight</option>
    </select>
  </div>

  <div v-if="error" class="flex items-center gap-2.5 p-6 text-red text-sm">
    <AlertCircle :size="18" />
    <span>{{ error }}</span>
  </div>

  <div v-else class="bg-surface border border-border rounded-card overflow-hidden">
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-border">
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Image</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Title (default)</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Type</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Translations</th>
          <th class="px-4 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-widest text-dim">Muscles</th>
          <th class="px-4 py-2.5 text-right text-[11.5px] font-bold uppercase tracking-widest text-dim">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="6" class="px-4 py-8">
            <div class="flex items-center gap-2.5 text-mute text-[13px]">
              <Loader2 :size="18" class="animate-spin" />
              <span>Loading exercises…</span>
            </div>
          </td>
        </tr>
        <tr v-else-if="filteredExercises.length === 0">
          <td colspan="6" class="px-4 py-8 text-[13px] text-faint">No exercises found</td>
        </tr>
        <tr v-for="ex in filteredExercises" :key="ex.id"
          class="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
          <td class="px-4 py-2.5">
            <div class="w-9 h-9 rounded overflow-hidden bg-surface-3 flex items-center justify-center shrink-0">
              <img v-if="ex.image" :src="resolveUrl(ex.image)" :alt="ex.title?.default ?? ''" class="w-full h-full object-cover" />
              <ImageIcon v-else :size="16" class="text-faint" />
            </div>
          </td>
          <td class="px-4 py-2.5 text-[13px] font-medium text-text">{{ ex.title?.default ?? '—' }}</td>
          <td class="px-4 py-2.5 text-[12.5px] text-mute capitalize">{{ ex.exerciseType ?? '—' }}</td>
          <td class="px-4 py-2.5 text-[12px] text-mute">{{ coverageFor(ex) }}</td>
          <td class="px-4 py-2.5 text-[12px] text-mute">
            {{ ex.muscleGroups?.map(m => m.name).join(', ') || '—' }}
          </td>
          <td class="px-4 py-2.5 text-right">
            <div class="flex items-center justify-end gap-1">
              <button class="p-1.5 rounded hover:bg-surface-3 text-mute hover:text-text transition-colors" title="Edit" @click="openEdit(ex)">
                <Pencil :size="14" />
              </button>
              <button class="p-1.5 rounded hover:bg-red/10 text-mute hover:text-red transition-colors" title="Delete" @click="deleteConfirmId = ex.id">
                <Trash2 :size="14" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ── Create/Edit Dialog ─────────────────────────────────────────────────── -->
  <div v-if="dialogOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="dialogOpen = false">
    <div class="bg-surface border border-border rounded-card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 class="text-[15px] font-semibold text-text">{{ dialogMode === 'create' ? 'New Global Exercise' : 'Edit Exercise' }}</h2>
        <button class="text-mute hover:text-text transition-colors" @click="dialogOpen = false">✕</button>
      </div>

      <!-- Language tabs -->
      <div class="flex border-b border-border px-5">
        <button v-for="lang in LANGS" :key="lang.key"
          class="px-3 py-2.5 text-[12.5px] font-medium border-b-2 transition-colors mr-1"
          :class="activeLang === lang.key ? 'border-primary text-primary' : 'border-transparent text-mute hover:text-text'"
          @click="activeLang = lang.key">
          {{ lang.label }}
        </button>
      </div>

      <div class="p-5 flex flex-col gap-4">
        <!-- Title -->
        <div>
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Title *</label>
          <input type="text"
            :value="i18nGet(form.title, activeLang)"
            @input="form.title = i18nSet(form.title, activeLang, ($event.target as HTMLInputElement).value)"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong" />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Description</label>
          <textarea
            :value="i18nGet(form.description, activeLang)"
            @input="form.description = i18nSet(form.description, activeLang, ($event.target as HTMLTextAreaElement).value)"
            rows="2"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong resize-none" />
        </div>

        <!-- Instructions -->
        <div>
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Instructions (one per line)</label>
          <textarea
            :value="arrGet(form.instructionsI18n, activeLang)"
            @input="form.instructionsI18n = arrSet(form.instructionsI18n, activeLang, ($event.target as HTMLTextAreaElement).value)"
            rows="4"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong resize-none" />
        </div>

        <!-- Pro Tips -->
        <div>
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Pro Tips (one per line)</label>
          <textarea
            :value="arrGet(form.proTipsI18n, activeLang)"
            @input="form.proTipsI18n = arrSet(form.proTipsI18n, activeLang, ($event.target as HTMLTextAreaElement).value)"
            rows="3"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong resize-none" />
        </div>

        <!-- Mistakes -->
        <div>
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Common Mistakes (one per line)</label>
          <textarea
            :value="arrGet(form.mistakesI18n, activeLang)"
            @input="form.mistakesI18n = arrSet(form.mistakesI18n, activeLang, ($event.target as HTMLTextAreaElement).value)"
            rows="3"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong resize-none" />
        </div>

        <!-- Equipment (per language) -->
        <div>
          <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Equipment (one per line)</label>
          <textarea
            :value="arrGet(form.equipmentI18n, activeLang)"
            @input="form.equipmentI18n = arrSet(form.equipmentI18n, activeLang, ($event.target as HTMLTextAreaElement).value)"
            rows="2"
            placeholder="e.g. Barbell&#10;Bench"
            class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong resize-none placeholder:text-faint" />
        </div>

        <!-- Fields only on default tab -->
        <template v-if="activeLang === 'default'">
          <!-- Exercise Type -->
          <div>
            <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Exercise Type</label>
            <select v-model="form.exerciseType"
              class="w-full px-3 py-2 bg-surface-2 border border-border-2 rounded-chip text-[13px] text-text outline-none focus:border-border-strong">
              <option value="">— None —</option>
              <option value="compound">Compound</option>
              <option value="isolation">Isolation</option>
              <option value="bodyweight">Bodyweight</option>
            </select>
          </div>

          <!-- Thumbnail image -->
          <div>
            <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Thumbnail Image</label>
            <div class="flex items-start gap-3">
              <div class="w-20 h-20 rounded-card border border-border-2 bg-surface-3 flex items-center justify-center overflow-hidden shrink-0">
                <img v-if="form.imageUrl" :src="resolveUrl(form.imageUrl)" alt="Thumbnail" class="w-full h-full object-cover" />
                <ImageIcon v-else :size="22" class="text-faint" />
              </div>
              <div class="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  class="btn-primary text-[12px] px-3 py-1.5 flex items-center gap-1.5"
                  @click="imagePickerOpen = true"
                >
                  <ImageIcon :size="13" />
                  {{ form.imageUrl ? 'Change Image' : 'Select Image' }}
                </button>
                <button
                  v-if="form.imageUrl"
                  type="button"
                  class="text-[12px] text-red hover:opacity-80 transition-opacity text-left"
                  @click="form.imageUrl = undefined"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <!-- Primary Muscle Groups -->
          <div>
            <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Primary Muscle Groups</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="mg in muscleGroups"
                :key="mg.id"
                type="button"
                class="px-2.5 py-1 rounded-chip text-[12px] border transition-colors"
                :class="(form.primaryMuscleGroupIds ?? []).includes(mg.id)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-2 text-mute border-border-2 hover:border-border-strong'"
                @click="togglePrimaryMuscleGroup(mg.id)"
              >
                {{ mgName(mg) }}
              </button>
            </div>
          </div>

          <!-- Muscle Groups -->
          <div>
            <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Muscle Groups (secondary)</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="mg in muscleGroups"
                :key="mg.id"
                type="button"
                class="px-2.5 py-1 rounded-chip text-[12px] border transition-colors"
                :class="(form.muscleGroupIds ?? []).includes(mg.id)
                  ? 'bg-primary/20 text-primary border-primary/40'
                  : 'bg-surface-2 text-mute border-border-2 hover:border-border-strong'"
                @click="toggleMuscleGroup(mg.id)"
              >
                {{ mgName(mg) }}
              </button>
            </div>
          </div>

          <!-- Instructional Media (edit mode only) -->
          <div v-if="dialogMode === 'edit'">
            <label class="block text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5">Instructional Media</label>

            <div v-if="mediaError" class="flex items-center gap-2 mb-2 text-red text-[12.5px]">
              <AlertCircle :size="13" />
              <span>{{ mediaError }}</span>
            </div>

            <!-- Existing media -->
            <div v-if="currentMedia.length > 0" class="flex flex-wrap gap-2 mb-2">
              <div
                v-for="(item, idx) in [...currentMedia].sort((a, b) => a.order - b.order)"
                :key="item.id"
                class="relative group rounded-card border border-border-2 overflow-hidden bg-surface-3"
                style="width: 90px; height: 90px;"
              >
                <video v-if="item.type === 'video'" :src="resolveUrl(item.url)" class="w-full h-full object-cover" muted />
                <img v-else :src="resolveUrl(item.url)" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <div class="flex gap-1">
                    <button
                      type="button"
                      class="p-1 bg-white/20 rounded hover:bg-white/30 text-white"
                      :disabled="idx === 0"
                      @click="moveMedia(item.id, -1)"
                    >
                      <ChevronLeft :size="12" />
                    </button>
                    <button
                      type="button"
                      class="p-1 bg-white/20 rounded hover:bg-white/30 text-white"
                      :disabled="idx === currentMedia.length - 1"
                      @click="moveMedia(item.id, 1)"
                    >
                      <ChevronRight :size="12" />
                    </button>
                  </div>
                  <button
                    type="button"
                    class="p-1 bg-red/70 rounded hover:bg-red text-white"
                    @click="deleteMedia(item.id)"
                  >
                    <Trash2 :size="12" />
                  </button>
                </div>
                <div v-if="item.type === 'video'" class="absolute bottom-1 right-1 bg-black/60 rounded p-0.5">
                  <Film :size="10" class="text-white" />
                </div>
              </div>
            </div>

            <!-- Add media button -->
            <label class="inline-flex items-center gap-1.5 cursor-pointer px-3 py-1.5 border border-border-2 rounded-chip text-[12.5px] text-mute hover:border-border-strong hover:text-text transition-colors">
              <Loader2 v-if="uploadingMedia" :size="13" class="animate-spin" />
              <Upload v-else :size="13" />
              {{ uploadingMedia ? 'Uploading…' : 'Add Media' }}
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" class="hidden" :disabled="uploadingMedia" @change="onMediaFileInput" />
            </label>
            <p class="text-[11px] text-faint mt-1">JPEG, PNG, WebP or MP4 · max 50 MB</p>
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

  <!-- ── Image Picker Dialog ────────────────────────────────────────────────── -->
  <div v-if="imagePickerOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" @click.self="imagePickerOpen = false">
    <div class="bg-surface border border-border rounded-card w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
      <div class="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <h3 class="text-[14px] font-semibold text-text">Select Exercise Image</h3>
        <button class="text-mute hover:text-text transition-colors" @click="imagePickerOpen = false">✕</button>
      </div>
      <div class="overflow-y-auto p-5 flex-1">
        <ExerciseImagesView :picker-mode="true" @pick="onImagePicked" />
      </div>
    </div>
  </div>

  <!-- ── Delete Confirmation ────────────────────────────────────────────────── -->
  <div v-if="deleteConfirmId !== null" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="deleteConfirmId = null">
    <div class="bg-surface border border-border rounded-card w-full max-w-sm p-6 shadow-2xl">
      <h2 class="text-[15px] font-semibold text-text mb-2">Delete Exercise?</h2>
      <p class="text-[13px] text-mute mb-5">Users with training data will automatically receive a personal copy. This action cannot be undone.</p>
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
