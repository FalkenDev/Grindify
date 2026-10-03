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
  <div class="mx-5 mb-5">
    <v-card
      class="d-flex flex-column align-center justify-center py-5 my-5 rounded-lg"
      color="cardBg"
      :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
    >
      <div class="avatar-wrapper">
        <v-avatar class="mb-4" size="100" color="primary" @click="openAccountDialog">
          <v-img
            v-if="currentUser?.avatar"
            :src="getImageUrl(currentUser.avatar)"
            :alt="$t('a11y.userAvatar')"
            cover
          />
          <v-icon v-else size="48"> mdi-account </v-icon>
        </v-avatar>
        <v-btn icon size="small" color="primary" class="edit-avatar-btn" @click="openAccountDialog">
          <v-icon size="16"> mdi-camera </v-icon>
        </v-btn>
      </div>
      <div class="mb-2 text-center">
        <h1 class="text-h5 white--text">
          {{ currentUser?.firstName || '' }} {{ currentUser?.lastName || '' }}
        </h1>
        <p v-if="memberSince" class="text-textSecondary text-subtitle-1">
          {{ $t('settings.memberSince', { date: memberSince }) }}
        </p>
      </div>
    </v-card>
    <div class="d-flex flex-column ga-5">
      <div>
        <h1 class="text-h6 mb-3">
          {{ $t('settings.content') }}
        </h1>
        <v-card
          v-for="item in contentList"
          :key="item.titleKey"
          class="mb-4 d-flex flex-row justify-space-between align-center pa-4 rounded-lg"
          color="cardBg"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
          :disabled="item.disabled"
          @click="setDialogToOpen(item.type)"
        >
          <div class="d-flex align-center ga-2">
            <v-avatar color="avatarBg" size="40">
              <v-icon color="primary">{{ item.icon }}</v-icon>
            </v-avatar>
            <p>{{ $t(item.titleKey) }}</p>
          </div>
          <v-icon v-if="item.showArrow"> mdi-chevron-right </v-icon>
        </v-card>
      </div>
      <div>
        <h1 class="text-h6 mb-3">{{ $t('settings.data') }}</h1>
        <v-card
          v-for="item in dataList"
          :key="item.titleKey"
          class="mb-4 d-flex flex-row justify-space-between align-center pa-4 rounded-lg"
          color="cardBg"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
          :disabled="item.disabled"
          @click="setDialogToOpen(item.type)"
        >
          <div class="d-flex align-center ga-2">
            <v-avatar color="avatarBg" size="40">
              <v-icon color="primary">{{ item.icon }}</v-icon>
            </v-avatar>
            <p>{{ $t(item.titleKey) }}</p>
          </div>
          <v-icon v-if="item.showArrow"> mdi-chevron-right </v-icon>
        </v-card>
      </div>
      <div>
        <h1 class="text-h6 mb-3">{{ $t('settings.preferences') }}</h1>
        <v-list
          class="bg-cardBg rounded-lg"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
        >
          <v-list-item
            v-for="item in preferencesList"
            :key="item.titleKey"
            class="px-5"
            :class="{ 'border-b': item !== preferencesList[preferencesList.length - 1] }"
            :disabled="item.disabled"
            @click="setPreferenceDialogToOpen(item.type)"
          >
            <v-list-item-title class="d-flex flex-row justify-space-between align-center">
              <p>{{ $t(item.titleKey) }}</p>
              <v-icon v-if="item.showArrow"> mdi-chevron-right </v-icon>
              <v-switch
                v-if="item.type === 'darkMode'"
                v-model="isDarkMode"
                color="primary"
                class="d-flex align-center pr-2"
                @update:model-value="toggleDarkMode"
                @click.stop
              />
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <div>
        <h1 class="text-h6 mb-3">{{ $t('settings.legal') }}</h1>
        <v-list
          class="bg-cardBg rounded-lg"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
        >
          <v-list-item class="px-5 border-b" @click="isPrivacyPolicyOpen = true">
            <v-list-item-title class="d-flex flex-row justify-space-between align-center">
              <p>{{ $t('settings.privacyPolicy') }}</p>
              <v-icon>mdi-chevron-right</v-icon>
            </v-list-item-title>
          </v-list-item>
          <v-list-item class="px-5 border-b" @click="isTermsOpen = true">
            <v-list-item-title class="d-flex flex-row justify-space-between align-center">
              <p>{{ $t('settings.termsAndConditions') }}</p>
              <v-icon>mdi-chevron-right</v-icon>
            </v-list-item-title>
          </v-list-item>
          <v-list-item class="px-5 border-b" @click="isImprintOpen = true">
            <v-list-item-title class="d-flex flex-row justify-space-between align-center">
              <p>{{ $t('settings.imprint') }}</p>
              <v-icon>mdi-chevron-right</v-icon>
            </v-list-item-title>
          </v-list-item>
          <v-list-item
            class="px-5 border-b"
            :disabled="isExporting"
            :aria-busy="isExporting"
            @click="exportUserData"
          >
            <v-list-item-title class="d-flex flex-row justify-space-between align-center">
              <div>
                <p>{{ isExporting ? $t('settings.exportDataPreparing') : $t('settings.exportData') }}</p>
                <p class="text-caption text-textSecondary text-wrap">
                  {{ $t('settings.exportDataDescription') }}
                </p>
              </div>
              <v-progress-circular v-if="isExporting" indeterminate size="20" width="2" color="primary" />
              <v-icon v-else>mdi-download</v-icon>
            </v-list-item-title>
          </v-list-item>
          <v-list-item
            class="px-5"
            @click="hasHealthConsent ? (isWithdrawConsentOpen = true) : (isGiveConsentOpen = true)"
          >
            <v-list-item-title class="d-flex flex-row justify-space-between align-center">
              <div>
                <p>
                  {{
                    hasHealthConsent
                      ? $t('settings.withdrawHealthConsent')
                      : $t('settings.giveHealthConsent')
                  }}
                </p>
                <p class="text-caption text-textSecondary text-wrap">
                  {{
                    hasHealthConsent
                      ? $t('settings.withdrawHealthConsentDescription')
                      : $t('settings.healthConsentNotGiven')
                  }}
                </p>
              </div>
              <v-icon>{{
                hasHealthConsent ? 'mdi-shield-remove-outline' : 'mdi-shield-check-outline'
              }}</v-icon>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
      <v-btn
        variant="outlined"
        :loading="isLoggingOut"
        :disabled="isLoggingOut"
        @click="setPreferenceDialogToOpen('logout')"
      >
        {{ $t('settings.logout') }}
      </v-btn>
    </div>

    <!-- Account Edit Dialog -->
    <v-dialog v-model="isAccountDialogOpen" fullscreen transition="slide-y-transition" persistent>
      <AccountDialog
        :user="currentUser"
        @close="isAccountDialogOpen = false"
        @updated="onUserUpdated"
      />
    </v-dialog>

    <v-dialog v-model="isExerciseListOpen" fullscreen transition="slide-y-transition" persistent>
      <ExerciseList @close="isExerciseListOpen = false" />
    </v-dialog>
    <v-dialog v-model="isActivityListOpen" fullscreen transition="slide-y-transition" persistent>
      <ActivityList @close="isActivityListOpen = false" />
    </v-dialog>
    <v-dialog v-model="isSessionListOpen" fullscreen transition="slide-y-transition" persistent>
      <SessionList @close="isSessionListOpen = false" />
    </v-dialog>
    <v-dialog v-model="isWorkoutListOpen" fullscreen transition="slide-y-transition" persistent>
      <WorkoutList @close="isWorkoutListOpen = false" />
    </v-dialog>

    <v-dialog v-model="isAppearanceOpen" fullscreen transition="slide-y-transition" persistent>
      <AppearanceDialog
        :user="currentUser"
        @close="isAppearanceOpen = false"
        @updated="onUserUpdated"
      />
    </v-dialog>

    <v-dialog v-model="isLanguageDialogOpen" max-width="500" fullscreen>
      <LanguageDialog @close="isLanguageDialogOpen = false" />
    </v-dialog>

    <v-dialog v-model="isVersionHistoryOpen" fullscreen transition="slide-y-transition" persistent>
      <VersionHistoryDialog @close="isVersionHistoryOpen = false" />
    </v-dialog>

    <!-- Goals Dialog -->
    <v-dialog v-model="isGoalsDialogOpen" fullscreen transition="slide-y-transition" persistent>
      <GoalsDialog
        :user="currentUser"
        :weight-tracking-enabled="weightTrackingEnabled"
        @close="isGoalsDialogOpen = false"
        @updated="onUserUpdated"
      />
    </v-dialog>

    <LegalDialog v-model="isPrivacyPolicyOpen" doc="privacy" />
    <LegalDialog v-model="isTermsOpen" doc="terms" />
    <LegalDialog v-model="isImprintOpen" doc="imprint" />

    <!-- Give health data consent (optional) -->
    <v-dialog v-model="isGiveConsentOpen" max-width="400">
      <HealthConsentPrompt @consented="onHealthConsentGiven" />
    </v-dialog>

    <!-- Withdraw health data consent -->
    <v-dialog v-model="isWithdrawConsentOpen" max-width="400" :persistent="isWithdrawingConsent">
      <v-card
        class="bg-cardBg rounded-lg"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
      >
        <v-card-title class="text-h6 pt-5 px-5 text-wrap">
          {{ $t('settings.withdrawHealthConsentTitle') }}
        </v-card-title>
        <v-card-text class="text-textSecondary px-5">
          <p class="mb-3">{{ $t('settings.withdrawHealthConsentText') }}</p>
          <ul class="pl-4 mb-3">
            <li>{{ $t('settings.withdrawDeletesWeightLogs') }}</li>
            <li>{{ $t('settings.withdrawDeletesProgressPhotos') }}</li>
            <li>{{ $t('settings.withdrawDeletesBodyMeasurements') }}</li>
          </ul>
          <p class="mb-3">{{ $t('settings.withdrawHealthConsentAfter') }}</p>
          <p class="font-weight-bold">{{ $t('settings.withdrawHealthConsentIrreversible') }}</p>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="isWithdrawingConsent"
            @click="isWithdrawConsentOpen = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :disabled="isWithdrawingConsent"
            :loading="isWithdrawingConsent"
            @click="confirmWithdrawHealthConsent"
          >
            {{ $t('settings.withdrawHealthConsentConfirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script lang="ts" setup>
import { getCurrentUser, getStreakInfo } from '@/services/user.service'
import type { User, StreakInfo } from '@/interfaces/User.interface'
import { toast } from 'vuetify-sonner'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useTheme } from 'vuetify'
import LegalDialog from '@/components/legal/LegalDialog.vue'
import VersionHistoryDialog from '@/components/Settings/VersionHistoryDialog.vue'
import { legalConfig } from '@/config/legal'
import HealthConsentPrompt from '@/components/legal/HealthConsentPrompt.vue'

const authStore = useAuthStore()
const appStore = useAppStore()
const { t, locale } = useI18n({ useScope: 'global' })
const theme = useTheme()

const isDarkMode = ref(appStore.darkMode)

const toggleDarkMode = (value: boolean | null) => {
  const isDark = value ?? true
  isDarkMode.value = isDark
  appStore.setDarkMode(isDark)
  theme.global.name.value = isDark ? 'dark' : 'light'
}

const isExerciseListOpen = ref(false)
const isActivityListOpen = ref(false)
const isSessionListOpen = ref(false)
const isWorkoutListOpen = ref(false)
const isAccountDialogOpen = ref(false)
const isAppearanceOpen = ref(false)
const isLanguageDialogOpen = ref(false)
const isVersionHistoryOpen = ref(false)
const isGoalsDialogOpen = ref(false)
const isPrivacyPolicyOpen = ref(false)
const isTermsOpen = ref(false)
const isImprintOpen = ref(false)
const isWithdrawConsentOpen = ref(false)
const isGiveConsentOpen = ref(false)
const isWithdrawingConsent = ref(false)
const isExporting = ref(false)
const isLoggingOut = ref(false)
const currentUser = ref<User | null>(null)
const weightTrackingEnabled = ref(false)
const streakInfo = ref<StreakInfo | null>(null)

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1'

const getImageUrl = (imagePath: string) => {
  if (imagePath.startsWith('http')) return imagePath
  const baseUrl = apiUrl.replace('/v1', '')
  return `${baseUrl}${imagePath}`
}

const memberSince = computed(() => {
  const createdAt = currentUser.value?.createdAt
  if (!createdAt) return ''
  return new Date(createdAt).toLocaleDateString(locale.value, { month: 'short', year: 'numeric' })
})

const hasHealthConsent = computed(() => authStore.hasHealthConsent)

const onUserUpdated = (user: User) => {
  currentUser.value = user
  weightTrackingEnabled.value = user.showWeightTracking ?? false
}

const loadUserData = async () => {
  try {
    const user = await getCurrentUser()
    currentUser.value = user
    weightTrackingEnabled.value = user.showWeightTracking ?? false
  } catch (error) {
    console.error('Error loading user data:', error)
    toast.error(t('settings.errorLoadingUserData'), { progressBar: true, duration: 5000 })
  }
}

const openAccountDialog = () => {
  isAccountDialogOpen.value = true
}

const setDialogToOpen = (type: string) => {
  switch (type) {
    case 'exercises':
      isExerciseListOpen.value = true
      break
    case 'activities':
      isActivityListOpen.value = true
      break
    case 'workouts':
      isWorkoutListOpen.value = true
      break
    case 'sessions':
      isSessionListOpen.value = true
      break
    default:
      return
  }
}

const setPreferenceDialogToOpen = async (type?: string) => {
  switch (type) {
    case 'account':
      openAccountDialog()
      break
    case 'appearance':
      isAppearanceOpen.value = true
      break
    case 'goals':
      isGoalsDialogOpen.value = true
      break
    case 'language':
      isLanguageDialogOpen.value = true
      break
    case 'versionHistory':
      isVersionHistoryOpen.value = true
      break
    case 'contact':
      if (legalConfig.contactEmail) {
        window.location.href = `mailto:${legalConfig.contactEmail}`
      } else {
        toast.error(t('settings.contactNotConfigured'), { progressBar: true, duration: 5000 })
      }
      break
    case 'logout':
      if (isLoggingOut.value) return
      isLoggingOut.value = true
      try {
        await authStore.logout()
      } finally {
        isLoggingOut.value = false
      }
      break
    default:
      return
  }
}

const filenameFromDisposition = (header: string | null): string | null => {
  if (!header) return null
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header)
  return match ? decodeURIComponent(match[1]) : null
}

const exportUserData = async () => {
  // Guard against double clicks while the (potentially large) zip is being generated.
  if (isExporting.value) return
  isExporting.value = true
  try {
    const response = await fetch(`${apiUrl}/users/export`, {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download =
      filenameFromDisposition(response.headers.get('content-disposition')) ?? 'grindify-export.zip'
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Give the browser time to start the download before revoking the URL.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    toast.success(t('settings.exportDataSuccess'), { progressBar: true, duration: 3000 })
  } catch {
    toast.error(t('settings.exportDataError'), { progressBar: true, duration: 5000 })
  } finally {
    isExporting.value = false
  }
}

const onHealthConsentGiven = (user: User) => {
  currentUser.value = user
  isGiveConsentOpen.value = false
}

const confirmWithdrawHealthConsent = async () => {
  if (isWithdrawingConsent.value) return
  isWithdrawingConsent.value = true
  try {
    const user = await authStore.withdrawHealthConsent()
    currentUser.value = user
    weightTrackingEnabled.value = user.showWeightTracking ?? false
    isWithdrawConsentOpen.value = false
    toast.success(t('settings.healthConsentWithdrawn'), { progressBar: true, duration: 3000 })
  } catch (error) {
    console.error('Failed to withdraw health consent:', error)
    toast.error(t('settings.withdrawHealthConsentFailed'), { progressBar: true, duration: 5000 })
  } finally {
    isWithdrawingConsent.value = false
  }
}

const contentList = [
  {
    titleKey: 'settings.exercises',
    showArrow: true,
    type: 'exercises',
    disabled: false,
    icon: 'mdi-dumbbell',
  },
  {
    titleKey: 'settings.workouts',
    showArrow: true,
    type: 'workouts',
    disabled: false,
    icon: 'mdi-calendar-check',
  },
  {
    titleKey: 'settings.activities',
    showArrow: true,
    type: 'activities',
    disabled: false,
    icon: 'mdi-run',
  },
]
const dataList = [
  {
    titleKey: 'settings.sessions',
    showArrow: true,
    type: 'sessions',
    disabled: false,
    icon: 'mdi-timer',
  },
  {
    titleKey: 'settings.weightAndProgression',
    showArrow: false,
    type: 'weightAndProgression',
    disabled: true,
    icon: 'mdi-scale-balance',
  },
  {
    titleKey: 'settings.achievements',
    showArrow: false,
    type: 'achievements',
    disabled: true,
    icon: 'mdi-trophy',
  },
]
const preferencesList = [
  { titleKey: 'settings.userInformation', showArrow: true, disabled: false, type: 'account' },
  { titleKey: 'settings.appearance', showArrow: true, disabled: false, type: 'appearance' },
  { titleKey: 'settings.goals', showArrow: true, disabled: false, type: 'goals' },
  { titleKey: 'settings.darkMode', showArrow: false, disabled: false, type: 'darkMode' },
  { titleKey: 'settings.language', showArrow: true, disabled: false, type: 'language' },
  { titleKey: 'settings.versionHistory', showArrow: true, disabled: false, type: 'versionHistory' },
  { titleKey: 'settings.helpAndSupport', showArrow: true, disabled: false, type: 'contact' },
]

onMounted(() => {
  locale.value = appStore.locale
  loadUserData()
  getStreakInfo()
    .then(info => {
      streakInfo.value = info
    })
    .catch(() => {})
})
</script>

<style scoped>
.avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 12px;
  right: -4px;
  height: 32px !important;
  width: 32px !important;
}
</style>
