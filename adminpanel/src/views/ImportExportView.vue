<script setup lang="ts">
import { ref } from 'vue'
import {
  Download, Upload, Dumbbell, Activity, Loader2, AlertCircle,
  CheckCircle2, FileJson, X,
} from 'lucide-vue-next'
import { adminApi, type ImportResult } from '@/services/adminApi'
import { ApiError } from '@/services/api'

type Tab = 'export' | 'import'
const activeTab = ref<Tab>('export')

// ─── Export ───────────────────────────────────────────────────────────────────

const exportingExercises = ref(false)
const exportingActivities = ref(false)
const exportError = ref<string | null>(null)

async function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function doExportExercises() {
  exportingExercises.value = true
  exportError.value = null
  try {
    const { blob, filename } = await adminApi.exportExercises()
    await triggerDownload(blob, filename)
  } catch (e) {
    exportError.value = e instanceof ApiError ? e.message : 'Export failed'
  } finally {
    exportingExercises.value = false
  }
}

async function doExportActivities() {
  exportingActivities.value = true
  exportError.value = null
  try {
    const { blob, filename } = await adminApi.exportActivities()
    await triggerDownload(blob, filename)
  } catch (e) {
    exportError.value = e instanceof ApiError ? e.message : 'Export failed'
  } finally {
    exportingActivities.value = false
  }
}

// ─── Import ───────────────────────────────────────────────────────────────────

const exerciseFile = ref<File | null>(null)
const activityFile = ref<File | null>(null)

const importingExercises = ref(false)
const importingActivities = ref(false)

const exerciseResult = ref<ImportResult | null>(null)
const activityResult = ref<ImportResult | null>(null)

const exerciseImportError = ref<string | null>(null)
const activityImportError = ref<string | null>(null)

function onExerciseFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  exerciseFile.value = input.files?.[0] ?? null
  exerciseResult.value = null
  exerciseImportError.value = null
}

function onActivityFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  activityFile.value = input.files?.[0] ?? null
  activityResult.value = null
  activityImportError.value = null
}

async function doImportExercises() {
  if (!exerciseFile.value) return
  importingExercises.value = true
  exerciseResult.value = null
  exerciseImportError.value = null
  try {
    exerciseResult.value = await adminApi.importExercises(exerciseFile.value)
  } catch (e) {
    exerciseImportError.value = e instanceof ApiError ? e.message : 'Import failed'
  } finally {
    importingExercises.value = false
  }
}

async function doImportActivities() {
  if (!activityFile.value) return
  importingActivities.value = true
  activityResult.value = null
  activityImportError.value = null
  try {
    activityResult.value = await adminApi.importActivities(activityFile.value)
  } catch (e) {
    activityImportError.value = e instanceof ApiError ? e.message : 'Import failed'
  } finally {
    importingActivities.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="mb-6">
      <h1 class="text-[18px] font-semibold text-text">Import / Export</h1>
      <p class="text-[13px] text-mute mt-0.5">Bulk data operations for content migration between instances.</p>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-border mb-6">
      <button
        v-for="tab in (['export', 'import'] as Tab[])"
        :key="tab"
        class="px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors capitalize mr-1"
        :class="activeTab === tab
          ? 'border-primary text-primary'
          : 'border-transparent text-mute hover:text-text'"
        @click="activeTab = tab">
        {{ tab === 'export' ? 'Export' : 'Import' }}
      </button>
    </div>

    <!-- ─── Export Tab ───────────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'export'">
      <div v-if="exportError" class="flex items-center gap-2 text-[13px] text-red bg-red/10 border border-red/20 rounded-chip px-3 py-2 mb-4">
        <AlertCircle :size="14" class="shrink-0" />
        {{ exportError }}
      </div>

      <div class="flex flex-col gap-3">

        <!-- Global Exercises -->
        <div class="bg-surface border border-border rounded-card p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-chip bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Dumbbell :size="16" class="text-mute" />
              </div>
              <div>
                <p class="text-[13.5px] font-medium text-text">Global Exercises</p>
                <p class="text-[12px] text-mute mt-0.5">Exports a ZIP archive — one folder per exercise with <code class="font-mono bg-surface-3 px-1 rounded text-[11px]">exercise.json</code> and an <code class="font-mono bg-surface-3 px-1 rounded text-[11px]">images/</code> subfolder containing cover and media files.</p>
              </div>
            </div>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-surface-2 border border-border text-[12.5px] font-medium text-text hover:bg-surface-3 transition-colors shrink-0 disabled:opacity-50 disabled:pointer-events-none"
              :disabled="exportingExercises"
              @click="doExportExercises">
              <Loader2 v-if="exportingExercises" :size="13" class="animate-spin" />
              <Download v-else :size="13" />
              {{ exportingExercises ? 'Exporting…' : 'Export ZIP' }}
            </button>
          </div>
        </div>

        <!-- Global Activities -->
        <div class="bg-surface border border-border rounded-card p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-chip bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Activity :size="16" class="text-mute" />
              </div>
              <div>
                <p class="text-[13.5px] font-medium text-text">Global Activity Types</p>
                <p class="text-[12px] text-mute mt-0.5">Exports all activity types with their tracking configuration and translations.</p>
              </div>
            </div>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-surface-2 border border-border text-[12.5px] font-medium text-text hover:bg-surface-3 transition-colors shrink-0 disabled:opacity-50 disabled:pointer-events-none"
              :disabled="exportingActivities"
              @click="doExportActivities">
              <Loader2 v-if="exportingActivities" :size="13" class="animate-spin" />
              <Download v-else :size="13" />
              {{ exportingActivities ? 'Exporting…' : 'Export JSON' }}
            </button>
          </div>
        </div>

      </div>
    </template>

    <!-- ─── Import Tab ───────────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'import'">
      <div class="flex flex-col gap-4">

        <!-- Import Exercises -->
        <div class="bg-surface border border-border rounded-card p-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-chip bg-surface-2 border border-border flex items-center justify-center shrink-0">
              <Dumbbell :size="16" class="text-mute" />
            </div>
            <div>
              <p class="text-[13.5px] font-medium text-text">Import Exercises</p>
              <p class="text-[12px] text-mute">Accepts a JSON file exported from this admin panel. Exercises with matching titles are skipped.</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <label
              class="flex items-center gap-2 px-3 py-2 rounded-chip bg-surface-2 border border-border-2 text-[12.5px] text-mute hover:text-text hover:bg-surface-3 transition-colors cursor-pointer">
              <FileJson :size="13" />
              {{ exerciseFile ? exerciseFile.name : 'Choose .zip file' }}
              <input type="file" accept=".zip" class="hidden" @change="onExerciseFileChange" />
            </label>
            <button v-if="exerciseFile"
              class="p-1.5 rounded hover:bg-surface-3 text-mute hover:text-text transition-colors"
              @click="exerciseFile = null; exerciseResult = null">
              <X :size="13" />
            </button>
            <button
              v-if="exerciseFile"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-primary text-[12.5px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
              :disabled="importingExercises"
              @click="doImportExercises">
              <Loader2 v-if="importingExercises" :size="13" class="animate-spin" />
              <Upload v-else :size="13" />
              {{ importingExercises ? 'Importing…' : 'Import' }}
            </button>
          </div>

          <!-- Result -->
          <div v-if="exerciseImportError" class="flex items-center gap-2 text-[12.5px] text-red bg-red/10 border border-red/20 rounded-chip px-3 py-2 mt-3">
            <AlertCircle :size="13" class="shrink-0" />
            {{ exerciseImportError }}
          </div>
          <div v-if="exerciseResult" class="mt-3 p-3 bg-surface-2 rounded-chip border border-border text-[12.5px] space-y-1">
            <div class="flex items-center gap-2 text-green">
              <CheckCircle2 :size="13" />
              <span>{{ exerciseResult.created }} created, {{ exerciseResult.skipped }} skipped</span>
            </div>
            <div v-if="exerciseResult.errors.length" class="text-mute">
              <p class="font-medium text-red mb-1">{{ exerciseResult.errors.length }} error(s):</p>
              <p v-for="err in exerciseResult.errors" :key="err" class="font-mono text-[11.5px]">{{ err }}</p>
            </div>
          </div>
        </div>

        <!-- Import Activities -->
        <div class="bg-surface border border-border rounded-card p-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-chip bg-surface-2 border border-border flex items-center justify-center shrink-0">
              <Activity :size="16" class="text-mute" />
            </div>
            <div>
              <p class="text-[13.5px] font-medium text-text">Import Activity Types</p>
              <p class="text-[12px] text-mute">Accepts a JSON file exported from this admin panel. Activities with matching titles are skipped.</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <label
              class="flex items-center gap-2 px-3 py-2 rounded-chip bg-surface-2 border border-border-2 text-[12.5px] text-mute hover:text-text hover:bg-surface-3 transition-colors cursor-pointer">
              <FileJson :size="13" />
              {{ activityFile ? activityFile.name : 'Choose .json file' }}
              <input type="file" accept=".json" class="hidden" @change="onActivityFileChange" />
            </label>
            <button v-if="activityFile"
              class="p-1.5 rounded hover:bg-surface-3 text-mute hover:text-text transition-colors"
              @click="activityFile = null; activityResult = null">
              <X :size="13" />
            </button>
            <button
              v-if="activityFile"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-primary text-[12.5px] font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
              :disabled="importingActivities"
              @click="doImportActivities">
              <Loader2 v-if="importingActivities" :size="13" class="animate-spin" />
              <Upload v-else :size="13" />
              {{ importingActivities ? 'Importing…' : 'Import' }}
            </button>
          </div>

          <!-- Result -->
          <div v-if="activityImportError" class="flex items-center gap-2 text-[12.5px] text-red bg-red/10 border border-red/20 rounded-chip px-3 py-2 mt-3">
            <AlertCircle :size="13" class="shrink-0" />
            {{ activityImportError }}
          </div>
          <div v-if="activityResult" class="mt-3 p-3 bg-surface-2 rounded-chip border border-border text-[12.5px] space-y-1">
            <div class="flex items-center gap-2 text-green">
              <CheckCircle2 :size="13" />
              <span>{{ activityResult.created }} created, {{ activityResult.skipped }} skipped</span>
            </div>
            <div v-if="activityResult.errors.length" class="text-mute">
              <p class="font-medium text-red mb-1">{{ activityResult.errors.length }} error(s):</p>
              <p v-for="err in activityResult.errors" :key="err" class="font-mono text-[11.5px]">{{ err }}</p>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>
