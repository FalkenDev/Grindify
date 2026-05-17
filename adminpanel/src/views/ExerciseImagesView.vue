<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Upload, Trash2, Loader2, AlertCircle, ImageIcon, X,
  HardDrive, Zap, Image,
} from 'lucide-vue-next'
import { adminApi, type ExerciseImage } from '@/services/adminApi'
import { ApiError } from '@/services/api'

const props = defineProps<{
  pickerMode?: boolean
}>()

const emit = defineEmits<{
  pick: [image: ExerciseImage]
}>()

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:1337/v1'

function imageUrl(url: string) {
  if (url.startsWith('http')) return url
  return BASE_URL.replace('/v1', '') + url
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatExt(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase()
  if (!ext) return '—'
  return ext
}

function fileName(url: string): string {
  const part = url.split('/').pop() ?? url
  // Strip extension and truncate hex filenames to something readable
  return part.replace(/\.[^.]+$/, '').substring(0, 16)
}

const loading = ref(true)
const error = ref<string | null>(null)
const images = ref<ExerciseImage[]>([])

const uploading = ref(false)
const uploadError = ref<string | null>(null)
const dragOver = ref(false)

const deleteConfirmId = ref<number | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const search = ref('')

const filteredImages = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return images.value
  return images.value.filter(img =>
    img.url.toLowerCase().includes(q) ||
    img.createdAt.includes(q)
  )
})

// Stats
const totalImages = computed(() => images.value.length)
const totalStorage = computed(() => {
  const sum = images.value.reduce((acc, img) => acc + (img.fileSize ?? 0), 0)
  return formatBytes(sum)
})
const avgSize = computed(() => {
  const withSize = images.value.filter(img => img.fileSize !== null)
  if (withSize.length === 0) return '—'
  const avg = withSize.reduce((acc, img) => acc + (img.fileSize ?? 0), 0) / withSize.length
  return formatBytes(avg)
})

async function fetchImages() {
  loading.value = true
  error.value = null
  try {
    images.value = await adminApi.getExerciseImages()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Failed to load images'
  } finally {
    loading.value = false
  }
}

onMounted(fetchImages)

async function uploadFile(file: File) {
  if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
    uploadError.value = 'Only JPEG, PNG and WebP images are allowed'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = 'File too large – maximum 10 MB'
    return
  }
  uploading.value = true
  uploadError.value = null
  try {
    const created = await adminApi.uploadExerciseImage(file)
    images.value = [created, ...images.value]
  } catch (e) {
    uploadError.value = e instanceof ApiError ? e.message : 'Upload failed'
  } finally {
    uploading.value = false
  }
}

function onFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) uploadFile(file)
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadFile(file)
}

function handleImageClick(img: ExerciseImage) {
  if (props.pickerMode) emit('pick', img)
}

async function confirmDelete(id: number) {
  deleting.value = true
  deleteError.value = null
  try {
    await adminApi.deleteExerciseImage(id)
    images.value = images.value.filter(img => img.id !== id)
    deleteConfirmId.value = null
  } catch (e) {
    deleteError.value = e instanceof ApiError ? e.message : 'Delete failed'
  } finally {
    deleting.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}
</script>

<template>
  <div>
    <!-- Page header (full mode only) -->
    <div v-if="!pickerMode" class="page-head">
      <div class="titles">
        <h1>Exercise Images</h1>
        <p>Image library for exercise thumbnails — upload here, then assign to exercises</p>
      </div>
      <div class="flex items-center gap-2">
        <label
          class="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-[--lime] text-[--lime-ink] rounded-[--r-chip] cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Upload :size="13" />
          Upload
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFileInput" />
        </label>
      </div>
    </div>

    <!-- Stats cards (full mode only) -->
    <div v-if="!pickerMode" class="grid grid-cols-3 gap-3 mb-5">
      <!-- Total images -->
      <div class="flex items-center gap-3.5 px-4 py-3.5 bg-[--surface] border border-[--border] rounded-[--r-card]">
        <div class="flex items-center justify-center w-9 h-9 rounded-[--r-chip] bg-[--lime-soft] text-[--lime] shrink-0">
          <Image :size="16" />
        </div>
        <div>
          <div class="text-[11px] text-[--mute] uppercase tracking-wide font-medium">Total images</div>
          <div class="text-[22px] font-semibold tracking-tight leading-tight text-[--text]">{{ totalImages }}</div>
        </div>
      </div>
      <!-- Storage -->
      <div class="flex items-center gap-3.5 px-4 py-3.5 bg-[--surface] border border-[--border] rounded-[--r-card]">
        <div class="flex items-center justify-center w-9 h-9 rounded-[--r-chip] bg-[--surface-3] text-[--mute] shrink-0">
          <HardDrive :size="16" />
        </div>
        <div>
          <div class="text-[11px] text-[--mute] uppercase tracking-wide font-medium">Storage used</div>
          <div class="text-[22px] font-semibold tracking-tight leading-tight text-[--text]">{{ totalStorage }}</div>
        </div>
      </div>
      <!-- Avg size -->
      <div class="flex items-center gap-3.5 px-4 py-3.5 bg-[--surface] border border-[--border] rounded-[--r-card]">
        <div class="flex items-center justify-center w-9 h-9 rounded-[--r-chip] bg-[--surface-3] text-[--mute] shrink-0">
          <Zap :size="16" />
        </div>
        <div>
          <div class="text-[11px] text-[--mute] uppercase tracking-wide font-medium">Avg. size</div>
          <div class="text-[22px] font-semibold tracking-tight leading-tight text-[--text]">{{ avgSize }}</div>
        </div>
      </div>
    </div>

    <!-- Search (picker mode) / toolbar (full mode) -->
    <div class="flex items-center gap-2 mb-4">
      <div class="flex items-center gap-2 flex-1 px-3 py-2 bg-[--surface-2] border border-[--border-2] rounded-[--r-chip] focus-within:border-[--border-strong] transition-colors">
        <svg class="text-[--faint] shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          v-model="search"
          type="text"
          placeholder="Filter images…"
          class="bg-transparent outline-none text-[13px] text-[--text] placeholder:text-[--faint] w-full"
        />
      </div>
      <span class="text-[11px] text-[--dim] font-mono shrink-0">{{ filteredImages.length }} shown</span>
    </div>

    <!-- Upload zone (compact row) -->
    <div
      class="flex items-center gap-3 px-4 py-3 mb-4 border border-dashed rounded-[--r-card] transition-colors cursor-pointer relative"
      :class="dragOver
        ? 'border-[--lime] bg-[--lime-soft]'
        : 'border-[--border-2] hover:border-[--border-strong]'"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
      @click="!pickerMode && ($refs.fileInputZone as HTMLInputElement).click()"
    >
      <input v-if="!pickerMode" ref="fileInputZone" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFileInput" />
      <div v-if="uploading" class="flex items-center gap-2 text-[--mute] text-[13px]">
        <Loader2 :size="16" class="animate-spin text-[--lime]" />
        <span>Uploading…</span>
      </div>
      <template v-else>
        <Upload :size="16" :class="dragOver ? 'text-[--lime]' : 'text-[--mute]'" class="shrink-0" />
        <span class="text-[13px]" :class="dragOver ? 'text-[--lime]' : 'text-[--mute]'">
          {{ dragOver ? 'Release to upload' : 'Drag images here' }}
        </span>
        <span class="text-[--faint] text-[12px]">or</span>
        <label class="px-2.5 py-1 text-[12px] font-medium bg-[--surface-3] border border-[--border-2] rounded-[--r-chip] hover:border-[--border-strong] transition-colors cursor-pointer">
          Browse
          <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFileInput" />
        </label>
        <span class="text-[--faint] text-[11.5px] ml-auto">JPG, PNG, WebP · max 10 MB</span>
      </template>
    </div>

    <!-- Upload error -->
    <div v-if="uploadError" class="flex items-center gap-2 mb-4 px-3 py-2 bg-[--red-soft] border border-[--red]/30 rounded-[--r-chip] text-[--red] text-[13px]">
      <AlertCircle :size="14" class="shrink-0" />
      <span class="flex-1">{{ uploadError }}</span>
      <button class="text-[--red]/60 hover:text-[--red] transition-colors" @click="uploadError = null"><X :size="13" /></button>
    </div>

    <!-- Error state -->
    <div v-if="error" class="flex items-center gap-2.5 p-6 text-[--red] text-sm">
      <AlertCircle :size="18" />
      <span>{{ error }}</span>
    </div>

    <!-- Loading state -->
    <div v-else-if="loading" class="flex items-center gap-2.5 text-[--mute] text-[13px] py-12 justify-center">
      <Loader2 :size="18" class="animate-spin" />
      <span>Loading images…</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredImages.length === 0" class="flex flex-col items-center gap-3 py-20 text-center">
      <div class="flex items-center justify-center w-12 h-12 rounded-[--r-inner] bg-[--surface-2] border border-[--border-2]">
        <ImageIcon :size="22" class="text-[--faint]" />
      </div>
      <div>
        <p class="text-[13.5px] font-medium text-[--text]">No images yet</p>
        <p class="text-[12px] text-[--mute] mt-0.5">Upload an image above to get started</p>
      </div>
    </div>

    <!-- Gallery -->
    <div v-else class="bg-[--surface] border border-[--border] rounded-[--r-card] overflow-hidden">
      <!-- Gallery header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-[--border]">
        <div class="flex items-center gap-2 text-[13.5px] font-semibold text-[--text]">
          <ImageIcon :size="14" class="text-[--lime]" />
          Gallery
        </div>
        <span class="text-[11px] text-[--dim] font-mono">{{ filteredImages.length }} images</span>
      </div>

      <!-- Image grid -->
      <div class="p-3" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;">
        <div
          v-for="img in filteredImages"
          :key="img.id"
          class="group relative bg-[--surface-2] border border-[--border-2] rounded-[--r-inner] overflow-hidden transition-colors"
          :class="pickerMode ? 'cursor-pointer hover:border-[--lime]' : 'cursor-default'"
          @click="handleImageClick(img)"
        >
          <!-- Image (4:3 aspect ratio) -->
          <div class="relative" style="aspect-ratio: 4/3;">
            <img
              :src="imageUrl(img.url)"
              :alt="`Exercise image ${img.id}`"
              class="w-full h-full object-cover"
              loading="lazy"
            />

            <!-- Thumbnail chip top-left -->
            <span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-black/60 text-white rounded-[5px] backdrop-blur-sm">
              thumbnail
            </span>

            <!-- Picker hover overlay -->
            <div
              v-if="pickerMode"
              class="absolute inset-0 bg-[--lime]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <div class="w-7 h-7 rounded-full bg-[--lime] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--lime-ink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>

            <!-- Delete button (non-picker mode) -->
            <button
              v-if="!pickerMode"
              class="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[--red]/80 text-white"
              title="Delete image"
              @click.stop="deleteConfirmId = img.id; deleteError = null"
            >
              <Trash2 :size="11" />
            </button>
          </div>

          <!-- Card info -->
          <div class="px-2.5 py-2">
            <div
              class="text-[11.5px] font-medium truncate"
              :class="img.usedBy ? 'text-[--text]' : 'text-[--mute]'"
              :title="img.usedBy ? (img.usedBy.title?.default ?? img.usedBy.title?.eng ?? 'Untitled') : img.url"
            >
              {{ img.usedBy
                ? (img.usedBy.title?.default ?? img.usedBy.title?.eng ?? 'Untitled')
                : fileName(img.url) }}
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="font-mono text-[10px] text-[--dim]">{{ formatBytes(img.fileSize) }}</span>
              <span class="text-[--ghost]">·</span>
              <span class="font-mono text-[10px] text-[--dim] uppercase">{{ formatExt(img.url) }}</span>
              <template v-if="img.usedBy">
                <span class="text-[--ghost]">·</span>
                <span class="text-[9px] font-semibold uppercase tracking-wide text-[--lime]">in use</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <div
      v-if="deleteConfirmId !== null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      @click.self="deleteConfirmId = null"
    >
      <div class="bg-[--surface] border border-[--border] rounded-[--r-card] w-full max-w-sm p-6 shadow-[--shadow-pop]">
        <h2 class="text-[15px] font-semibold text-[--text] mb-2">Delete Image?</h2>
        <p class="text-[13px] text-[--mute] mb-3">The image file will be permanently removed. If it is assigned to an exercise, remove it there first.</p>
        <div v-if="deleteError" class="flex items-center gap-2 mb-3 px-3 py-2 bg-[--red-soft] border border-[--red]/30 rounded-[--r-chip] text-[--red] text-[13px]">
          <AlertCircle :size="13" class="shrink-0" />
          <span>{{ deleteError }}</span>
        </div>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 text-[13px] text-[--mute] hover:text-[--text] transition-colors"
            @click="deleteConfirmId = null"
          >
            Cancel
          </button>
          <button
            class="flex items-center gap-1.5 px-4 py-2 text-[13px] bg-[--red] text-white rounded-[--r-chip] hover:opacity-90 transition-opacity disabled:opacity-50"
            :disabled="deleting"
            @click="confirmDelete(deleteConfirmId!)"
          >
            <Loader2 v-if="deleting" :size="13" class="animate-spin" />
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
