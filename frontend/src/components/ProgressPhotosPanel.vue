<!--
  - Copyright (c) 2026 FalkenDev
  -
  - This file is part of Grindify.
  -
  - Grindify is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of
  - the License, or (at your option) any later version.
  -
  - You should have received a copy of the GNU Affero General Public
  - License along with Grindify. If not, see
  - <https://www.gnu.org/licenses/>.
  -->

<template>
  <div class="pa-5">
    <!-- Header row: filter + compare button -->
    <div class="d-flex align-center justify-space-between mb-4">
      <v-btn-toggle
        v-model="activeFilter"
        mandatory
        color="primary"
        density="compact"
        divided
        rounded="lg"
      >
        <v-btn value="all" size="small">{{ $t('progressPhotos.all') }}</v-btn>
        <v-btn value="front" size="small">{{ $t('progressPhotos.front') }}</v-btn>
        <v-btn value="side" size="small">{{ $t('progressPhotos.side') }}</v-btn>
        <v-btn value="back" size="small">{{ $t('progressPhotos.back') }}</v-btn>
      </v-btn-toggle>

      <v-btn
        v-if="!compareMode && filteredPhotos.length >= 2"
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="mdi-compare"
        @click="enterCompareMode"
      >
        {{ $t('progressPhotos.comparePhotos') }}
      </v-btn>
      <v-btn v-if="compareMode" color="error" variant="tonal" size="small" @click="exitCompareMode">
        {{ $t('progressPhotos.exitCompare') }}
      </v-btn>
    </div>

    <!-- Compare mode hint -->
    <p v-if="compareMode" class="text-caption text-textSecondary mb-3 text-center">
      {{
        selectedForCompare.length === 0
          ? $t('progressPhotos.selectTwo')
          : $t('progressPhotos.compareSelected', { count: selectedForCompare.length })
      }}
    </p>

    <!-- Empty state -->
    <div
      v-if="filteredPhotos.length === 0 && !isLoading"
      class="d-flex flex-column align-center justify-center py-12 ga-3"
    >
      <v-icon size="64" color="textSecondary">mdi-camera-off-outline</v-icon>
      <p class="text-body-1 text-textPrimary">{{ $t('progressPhotos.noPhotos') }}</p>
      <p class="text-body-2 text-textSecondary text-center" style="max-width: 260px">
        {{ $t('progressPhotos.addFirstPhoto') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="d-flex justify-center py-10">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- 2-column grid -->
    <div v-if="!isLoading && filteredPhotos.length > 0" class="photo-grid">
      <div
        v-for="photo in filteredPhotos"
        :key="photo.id"
        class="photo-card"
        :class="{ 'photo-card--selected': selectedForCompare.includes(photo.id) }"
        @click="onCardClick(photo)"
      >
        <!-- Thumbnail -->
        <div class="photo-thumbnail" style="position: relative">
          <v-img
            :src="getImageUrl(photo.photoUrl) ?? ''"
            :alt="$t('progressPhotos.photoAlt', { date: formatDate(photo.date) })"
            aspect-ratio="0.75"
            cover
            class="rounded-t-lg"
          >
            <template #placeholder>
              <div class="d-flex align-center justify-center fill-height bg-cardBg">
                <v-progress-circular indeterminate size="24" color="primary" />
              </div>
            </template>
          </v-img>

          <!-- Selection overlay in compare mode -->
          <div
            v-if="compareMode"
            class="compare-overlay"
            :class="{ 'compare-overlay--active': selectedForCompare.includes(photo.id) }"
          >
            <v-icon :color="selectedForCompare.includes(photo.id) ? 'primary' : 'white'" size="28">
              {{
                selectedForCompare.includes(photo.id)
                  ? 'mdi-checkbox-marked-circle'
                  : 'mdi-checkbox-blank-circle-outline'
              }}
            </v-icon>
          </div>

          <!-- Pose badge -->
          <v-chip
            v-if="photo.poseTag"
            :color="poseColor(photo.poseTag)"
            size="x-small"
            variant="flat"
            style="position: absolute; top: 6px; left: 6px; font-size: 10px"
          >
            {{ $t(`progressPhotos.${photo.poseTag}`) }}
          </v-chip>
        </div>

        <!-- Info row -->
        <div
          class="pa-2 bg-cardBg rounded-b-lg"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', borderTop: 'none' }"
        >
          <p class="text-caption text-textPrimary">{{ formatDate(photo.date) }}</p>
          <p v-if="weightOnDay(photo.date)" class="text-caption text-textSecondary">
            {{ weightOnDay(photo.date) }} {{ weightUnit }}
          </p>
        </div>

        <!-- Three-dot menu (not in compare mode) -->
        <v-menu v-if="!compareMode">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon
              size="x-small"
              variant="flat"
              color="rgba(0,0,0,0.5)"
              style="position: absolute; top: 6px; right: 6px"
              @click.stop
            >
              <v-icon size="16" color="white">mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="viewPhoto(photo)">
              <v-list-item-title>{{ $t('progressPhotos.viewPhoto') }}</v-list-item-title>
            </v-list-item>
            <v-list-item class="text-error" @click="confirmDelete(photo)">
              <v-list-item-title>{{ $t('progressPhotos.deletePhoto') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Floating upload button -->
    <v-btn
      v-if="!compareMode"
      color="primary"
      icon
      size="large"
      style="position: fixed; bottom: 100px; right: 20px; z-index: 10"
      elevation="4"
      @click="uploadSheetOpen = true"
    >
      <v-icon>mdi-camera-plus</v-icon>
    </v-btn>
  </div>

  <!-- Upload bottom sheet -->
  <v-bottom-sheet v-model="uploadSheetOpen" max-width="600">
    <v-card class="bg-cardBg rounded-t-xl pa-5" :style="{ borderTop: '1px solid rgb(var(--v-theme-borderColor))' }">
      <h3 class="text-subtitle-1 text-textPrimary mb-4">{{ $t('progressPhotos.uploadPhoto') }}</h3>

      <div class="mb-4">
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onFileSelected"
        />
        <v-card
          class="d-flex flex-column align-center justify-center pa-6 rounded-lg"
          :style="{ border: '2px dashed rgb(var(--v-theme-borderColor))', cursor: 'pointer', background: 'transparent' }"
          @click="fileInputRef?.click()"
        >
          <v-img
            v-if="uploadPreviewUrl"
            :src="uploadPreviewUrl"
            :alt="$t('progressPhotos.previewAlt')"
            max-height="200"
            contain
            class="mb-2"
          />
          <template v-else>
            <v-icon size="40" color="textSecondary" class="mb-2">mdi-image-plus</v-icon>
            <p class="text-body-2 text-textSecondary">{{ $t('progressPhotos.tapToSelectPhoto') }}</p>
          </template>
        </v-card>
      </div>

      <v-text-field
        v-model="uploadForm.date"
        :label="$t('progressPhotos.date')"
        type="date"
        variant="outlined"
        hide-details
        class="mb-3"
      />

      <v-btn-toggle v-model="uploadForm.poseTag" color="primary" divided class="w-100 mb-3">
        <v-btn value="front" class="flex-grow-1">{{ $t('progressPhotos.front') }}</v-btn>
        <v-btn value="side" class="flex-grow-1">{{ $t('progressPhotos.side') }}</v-btn>
        <v-btn value="back" class="flex-grow-1">{{ $t('progressPhotos.back') }}</v-btn>
      </v-btn-toggle>

      <v-textarea
        v-model="uploadForm.notes"
        :label="$t('progressPhotos.notes') + ' (' + $t('common.optional') + ')'"
        variant="outlined"
        rows="2"
        hide-details
        class="mb-4"
      />

      <div class="d-flex ga-3">
        <v-btn variant="text" flex-grow-1 @click="closeUploadSheet">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn
          color="primary"
          flex-grow-1
          :loading="isUploading"
          :disabled="!uploadForm.file || isUploading"
          class="flex-grow-1"
          @click="doUpload"
        >
          {{ $t('progressPhotos.uploadPhoto') }}
        </v-btn>
      </div>
    </v-card>
  </v-bottom-sheet>

  <!-- Full-screen photo viewer -->
  <v-dialog v-model="viewerOpen" fullscreen>
    <v-card class="bg-black d-flex flex-column">
      <div class="d-flex align-center justify-space-between pa-4">
        <p v-if="viewerPhoto" class="text-body-2 text-white">{{ formatDate(viewerPhoto.date) }}</p>
        <div class="d-flex ga-2">
          <v-btn
            v-if="viewerPhoto"
            icon
            variant="text"
            color="error"
            @click="
              () => {
                viewerOpen = false
                confirmDelete(viewerPhoto!)
              }
            "
          >
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
          <v-btn icon variant="text" color="white" @click="viewerOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
      <div class="flex-grow-1 d-flex align-center justify-center">
        <v-img
          v-if="viewerPhoto"
          :src="getImageUrl(viewerPhoto.photoUrl) ?? ''"
          :alt="$t('progressPhotos.photoAlt', { date: formatDate(viewerPhoto.date) })"
          contain
          max-height="100%"
        />
      </div>
    </v-card>
  </v-dialog>

  <!-- Split-screen comparison view -->
  <v-dialog v-model="compareViewOpen" fullscreen>
    <v-card class="bg-black d-flex flex-column">
      <div class="d-flex align-center justify-space-between pa-4">
        <p class="text-body-2 text-white">{{ $t('progressPhotos.comparing') }}</p>
        <v-btn icon variant="text" color="white" @click="compareViewOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <div class="flex-grow-1 d-flex" style="min-height: 0">
        <div
          v-for="photo in comparePhotos"
          :key="photo.id"
          class="d-flex flex-column"
          style="flex: 1; min-width: 0; border-right: 1px solid #333"
        >
          <div class="flex-grow-1 d-flex align-center justify-center" style="min-height: 0">
            <v-img
              :src="getImageUrl(photo.photoUrl) ?? ''"
              :alt="$t('progressPhotos.photoAlt', { date: formatDate(photo.date) })"
              contain
              style="max-height: 100%; width: 100%"
            />
          </div>
          <div class="pa-3 text-center">
            <p class="text-caption text-white mb-1">{{ formatDate(photo.date) }}</p>
            <v-chip
              v-if="photo.poseTag"
              :color="poseColor(photo.poseTag)"
              size="x-small"
              variant="flat"
              class="mb-1"
            >
              {{ $t(`progressPhotos.${photo.poseTag}`) }}
            </v-chip>
            <p v-if="weightOnDay(photo.date)" class="text-caption text-grey">
              {{ weightOnDay(photo.date) }} {{ weightUnit }}
            </p>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>

  <!-- Delete confirmation -->
  <v-dialog v-model="deleteDialogOpen" max-width="360">
    <v-card class="bg-cardBg rounded-lg" :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }">
      <v-card-title class="text-h6 pa-4">{{ $t('progressPhotos.deletePhoto') }}</v-card-title>
      <v-card-text class="px-4">
        <p class="text-body-2 text-textSecondary">{{ $t('progressPhotos.deleteConfirm') }}</p>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="deleteDialogOpen = false">{{ $t('common.cancel') }}</v-btn>
        <v-spacer />
        <v-btn color="error" :loading="isDeleting" :disabled="isDeleting" @click="doDelete">{{
          $t('common.delete')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vuetify-sonner'
import { useProgressPhotoStore } from '@/stores/progressPhoto.store'
import { useWeightLogStore } from '@/stores/weightLog.store'
import { useAuthStore } from '@/stores/auth.store'
import { getImageUrl } from '@/utils/imageUtils'
import type { ProgressPhoto, PoseTag } from '@/interfaces/ProgressPhoto.interface'

const { t } = useI18n({ useScope: 'global' })
const photoStore = useProgressPhotoStore()
const weightLogStore = useWeightLogStore()
const authStore = useAuthStore()

const isLoading = computed(() => photoStore.isLoading)
const isImperial = computed(() => authStore.user?.unitScale === 'imperial')
const weightUnit = computed(() => (isImperial.value ? 'lbs' : 'kg'))

// Filter
const activeFilter = ref<'all' | PoseTag>('all')
const filteredPhotos = computed(() => {
  if (activeFilter.value === 'all') return photoStore.photos
  return photoStore.photos.filter(p => p.poseTag === activeFilter.value)
})

// Helpers
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

const poseColor = (tag: PoseTag) =>
  tag === 'front' ? 'primary' : tag === 'side' ? 'warning' : 'secondary'

const fromKg = (val: number) => (isImperial.value ? val * 2.20462 : val)

const weightOnDay = (date: string): string | null => {
  const logs = weightLogStore.weightLogs
  if (!logs.length) return null
  const targetMs = new Date(date).getTime()
  // Find closest log within 2 days
  let closest: { diff: number; weight: number } | null = null
  for (const log of logs) {
    const diff = Math.abs(new Date(log.date).getTime() - targetMs)
    if (!closest || diff < closest.diff) closest = { diff, weight: Number(log.weight) }
  }
  if (!closest || closest.diff > 2 * 24 * 60 * 60 * 1000) return null
  return fromKg(closest.weight).toFixed(1)
}

// Upload
const uploadSheetOpen = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadPreviewUrl = ref<string | null>(null)
const isUploading = ref(false)
const uploadForm = ref({
  file: null as File | null,
  date: new Date().toISOString().split('T')[0],
  poseTag: undefined as PoseTag | undefined,
  notes: '',
})

const onFileSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadForm.value.file = file
  uploadPreviewUrl.value = URL.createObjectURL(file)
}

const closeUploadSheet = () => {
  uploadSheetOpen.value = false
  uploadPreviewUrl.value = null
  uploadForm.value = {
    file: null,
    date: new Date().toISOString().split('T')[0],
    poseTag: undefined,
    notes: '',
  }
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const doUpload = async () => {
  if (!uploadForm.value.file || isUploading.value) return
  isUploading.value = true
  try {
    await photoStore.uploadPhoto(uploadForm.value.file, {
      date: uploadForm.value.date,
      poseTag: uploadForm.value.poseTag ?? null,
      notes: uploadForm.value.notes || undefined,
    })
    toast.success(t('progressPhotos.photoAdded'), { progressBar: true, duration: 1000 })
    closeUploadSheet()
  } catch {
    toast.error(t('progressPhotos.failedToUpload'), { progressBar: true, duration: 5000 })
  } finally {
    isUploading.value = false
  }
}

// Compare mode
const compareMode = ref(false)
const selectedForCompare = ref<number[]>([])
const compareViewOpen = ref(false)
const comparePhotos = computed<ProgressPhoto[]>(
  () =>
    selectedForCompare.value
      .map(id => photoStore.photos.find(p => p.id === id))
      .filter(Boolean) as ProgressPhoto[]
)

const enterCompareMode = () => {
  compareMode.value = true
  selectedForCompare.value = []
}
const exitCompareMode = () => {
  compareMode.value = false
  selectedForCompare.value = []
}

const onCardClick = (photo: ProgressPhoto) => {
  if (!compareMode.value) {
    viewPhoto(photo)
    return
  }
  const idx = selectedForCompare.value.indexOf(photo.id)
  if (idx >= 0) {
    selectedForCompare.value.splice(idx, 1)
  } else if (selectedForCompare.value.length < 2) {
    selectedForCompare.value.push(photo.id)
    if (selectedForCompare.value.length === 2) {
      compareViewOpen.value = true
    }
  }
}

// Viewer
const viewerOpen = ref(false)
const viewerPhoto = ref<ProgressPhoto | null>(null)
const viewPhoto = (photo: ProgressPhoto) => {
  viewerPhoto.value = photo
  viewerOpen.value = true
}

// Delete
const deleteDialogOpen = ref(false)
const deletingPhoto = ref<ProgressPhoto | null>(null)
const isDeleting = ref(false)

const confirmDelete = (photo: ProgressPhoto) => {
  deletingPhoto.value = photo
  deleteDialogOpen.value = true
}

const doDelete = async () => {
  if (!deletingPhoto.value) return
  isDeleting.value = true
  try {
    await photoStore.deletePhoto(deletingPhoto.value.id)
    toast.success(t('progressPhotos.photoDeleted'), { progressBar: true, duration: 1000 })
    deleteDialogOpen.value = false
  } catch {
    toast.error(t('progressPhotos.failedToDelete'), { progressBar: true, duration: 5000 })
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.photo-card {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.photo-card:active {
  transform: scale(0.97);
}

.photo-card--selected {
  outline: 2px solid rgb(var(--v-theme-primary));
}

.compare-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.compare-overlay--active {
  background: rgba(171, 255, 26, 0.15);
}
</style>
