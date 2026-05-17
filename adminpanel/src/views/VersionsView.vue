<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Tag, ExternalLink, AlertCircle, Loader2, GitBranch } from 'lucide-vue-next'
import { adminApi, type ReleasesResponse } from '@/services/adminApi'

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<ReleasesResponse | null>(null)

onMounted(async () => {
  try {
    data.value = await adminApi.getReleases()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load releases'
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function parseChangelog(body: string): { section: string; items: string[] }[] {
  if (!body) return []
  const sections: { section: string; items: string[] }[] = []
  let current: { section: string; items: string[] } | null = null

  for (const line of body.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      if (current) sections.push(current)
      current = { section: trimmed.replace(/^#{2,3}\s*/, ''), items: [] }
    } else if ((trimmed.startsWith('- ') || trimmed.startsWith('* ')) && current) {
      current.items.push(trimmed.replace(/^[-*]\s*/, ''))
    } else if (trimmed && !current) {
      sections.push({ section: '', items: [trimmed] })
    }
  }
  if (current) sections.push(current)
  return sections.filter((s) => s.items.length > 0)
}
</script>

<template>
  <div class="page-head">
    <div class="titles">
      <h1>Versions</h1>
      <p>Release history and update management</p>
    </div>
    <div v-if="data?.latestReleaseVersion" class="flex items-center gap-1.5 px-3 py-1.5 bg-lime-soft border border-lime-soft-2 rounded-pill text-[12.5px] font-semibold text-lime whitespace-nowrap">
      <Tag :size="13" />
      Latest: {{ data.latestReleaseVersion }}
    </div>
  </div>

  <div v-if="loading" class="flex items-center gap-3 p-10 bg-surface border border-border rounded-card text-mute text-sm">
    <Loader2 :size="24" class="animate-spin shrink-0" />
    <span>Loading releases…</span>
  </div>

  <div v-else-if="error" class="flex items-center gap-3 p-10 bg-surface border border-border rounded-card text-red text-sm">
    <AlertCircle :size="20" class="shrink-0" />
    <span>{{ error }}</span>
  </div>

  <div v-else-if="data?.status !== 'ok' || data.releases.length === 0" class="flex items-center gap-3 p-10 bg-surface border border-border rounded-card text-mute text-sm">
    <GitBranch :size="24" class="shrink-0" />
    <span>{{ data?.message ?? 'No releases found.' }}</span>
  </div>

  <div v-else class="flex flex-col gap-3">
    <article v-for="release in data.releases" :key="release.tagName" class="bg-surface border border-border rounded-card px-6 py-5">

      <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="font-mono text-[13.5px] font-bold text-lime bg-lime-soft px-2.5 py-0.5 rounded-pill">{{ release.tagName }}</span>
          <span v-if="release.prerelease" class="text-[11px] font-bold text-amber bg-amber-soft px-2 py-0.5 rounded-pill uppercase tracking-wide">pre-release</span>
          <span v-if="release.name !== release.tagName" class="text-[13.5px] font-medium text-text-2">{{ release.name }}</span>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="text-[12.5px] text-dim">{{ formatDate(release.publishedAt) }}</span>
          <a v-if="release.htmlUrl" :href="release.htmlUrl" target="_blank" rel="noopener" class="flex items-center text-faint hover:text-mute transition-colors">
            <ExternalLink :size="14" />
          </a>
        </div>
      </div>

      <template v-if="release.body">
        <div class="border-t border-border pt-4">
          <template v-for="section in parseChangelog(release.body)" :key="section.section">
            <div v-if="section.section" class="text-[11.5px] font-bold uppercase tracking-widest text-dim mb-1.5 mt-3 first:mt-0">{{ section.section }}</div>
            <ul class="list-disc pl-5 space-y-0.5">
              <li v-for="item in section.items" :key="item" class="text-[13px] text-text-2 leading-relaxed">{{ item }}</li>
            </ul>
          </template>
        </div>
      </template>
      <div v-else class="border-t border-border pt-3 text-[12.5px] text-faint">No release notes</div>
    </article>
  </div>
</template>
