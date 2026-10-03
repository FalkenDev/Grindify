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
  <v-card class="d-flex flex-column bg-background fill-height">
    <BackHeader :title="$t('settings.editAccount')" @close="emit('close')" />

    <div
      class="flex-grow-1 overflow-y-auto"
      style="padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px))"
    >
      <!-- Avatar Section -->
      <div class="d-flex flex-column align-center pt-6 pb-4">
        <div class="avatar-wrapper">
          <v-avatar class="mb-2" size="100" color="primary">
            <v-img
              v-if="currentUser?.avatar"
              :src="getImageUrl(currentUser.avatar)"
              :alt="$t('a11y.userAvatar')"
              cover
            />
            <v-icon v-else size="48">mdi-account</v-icon>
          </v-avatar>
          <v-btn
            icon
            size="small"
            color="primary"
            class="edit-avatar-btn"
            @click="triggerFileInput"
          >
            <v-icon size="16">mdi-camera</v-icon>
          </v-btn>
        </div>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          :loading="isUploadingPhoto"
          :disabled="isUploadingPhoto"
          @click="triggerFileInput"
        >
          {{ $t('settings.changePhoto') }}
        </v-btn>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style="display: none"
          @change="handlePhotoSelect"
        />
      </div>

      <!-- Personal Information Section -->
      <div class="px-5 mb-6">
        <div class="d-flex justify-space-between align-center mb-3">
          <h2 class="text-h6">{{ $t('settings.personalInformation') }}</h2>
          <v-btn icon size="small" variant="text" @click="isEditOpen = true">
            <v-icon size="20">mdi-pencil</v-icon>
          </v-btn>
        </div>
        <v-card
          class="bg-cardBg rounded-lg"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
        >
          <v-list class="bg-transparent">
            <v-list-item class="px-5 py-3">
              <v-list-item-subtitle class="text-textSecondary text-body-2 mb-1">{{
                $t('settings.fullName')
              }}</v-list-item-subtitle>
              <v-list-item-title class="text-body-1">{{ displayName }}</v-list-item-title>
            </v-list-item>

            <v-divider class="mx-4" />

            <v-list-item class="px-5 py-3">
              <v-list-item-subtitle class="text-textSecondary text-body-2 mb-1">{{
                $t('settings.email')
              }}</v-list-item-subtitle>
              <v-list-item-title class="text-body-1">{{
                currentUser?.email || '—'
              }}</v-list-item-title>
            </v-list-item>

            <v-divider class="mx-4" />

            <v-list-item class="px-5 py-3 cursor-pointer" @click="isPasswordSheetOpen = true">
              <v-list-item-subtitle class="text-textSecondary text-body-2 mb-1">{{
                $t('settings.password')
              }}</v-list-item-subtitle>
              <v-list-item-title class="text-body-1">••••••••</v-list-item-title>
              <template #append>
                <v-icon size="18" color="textSecondary">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>

            <v-divider class="mx-4" />

            <v-list-item class="px-5 py-3">
              <v-list-item-subtitle class="text-textSecondary text-body-2 mb-1">{{
                $t('settings.dateOfBirth')
              }}</v-list-item-subtitle>
              <v-list-item-title class="text-body-1">{{ displayDateOfBirth }}</v-list-item-title>
            </v-list-item>

            <v-divider class="mx-4" />

            <v-list-item class="px-5 py-3">
              <v-list-item-subtitle class="text-textSecondary text-body-2 mb-1">{{
                $t('settings.weight')
              }}</v-list-item-subtitle>
              <v-list-item-title class="text-body-1">{{ displayWeight }}</v-list-item-title>
            </v-list-item>

            <v-divider class="mx-4" />

            <v-list-item class="px-5 py-3">
              <v-list-item-subtitle class="text-textSecondary text-body-2 mb-1">{{
                $t('settings.height')
              }}</v-list-item-subtitle>
              <v-list-item-title class="text-body-1">{{ displayHeight }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </div>

      <!-- Danger Zone -->
      <div class="px-5 mb-6">
        <h2 class="text-h6 text-textPrimary mb-3">{{ $t('settings.dangerZone') }}</h2>
        <v-card
          class="bg-cardBg rounded-lg pa-4"
          :style="{ border: '1px solid rgb(var(--v-theme-borderColor))', boxShadow: 'none' }"
        >
          <p class="text-body-2 text-textSecondary mb-4">
            {{ $t('settings.dangerZoneWarning') }}
          </p>
          <v-btn color="error" variant="flat" block @click="isDeleteDialogOpen = true">
            {{ $t('settings.deleteAccount') }}
          </v-btn>
        </v-card>
      </div>
    </div>

    <!-- Edit Personal Info Dialog -->
    <v-dialog v-model="isEditOpen" fullscreen transition="slide-y-transition" persistent>
      <EditPersonalInfoDialog
        v-if="currentUser"
        :user="currentUser"
        @close="isEditOpen = false"
        @updated="onPersonalInfoUpdated"
      />
    </v-dialog>

    <!-- Change Password Bottom Sheet -->
    <v-dialog v-model="isPasswordSheetOpen" max-width="500">
      <v-card
        class="bg-cardBg rounded-lg"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
      >
        <v-card-title class="text-h6 pt-5 px-5">{{ $t('settings.changePassword') }}</v-card-title>
        <v-card-text class="px-5">
          <p class="text-body-2 text-textSecondary mb-4">{{ $t('settings.changePasswordHint') }}</p>
          <v-form ref="passwordForm" @submit.prevent="savePassword">
            <v-text-field
              v-model="currentPassword"
              :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
              class="mb-3"
              :label="$t('settings.currentPassword')"
              autocomplete="current-password"
              prepend-inner-icon="mdi-lock-outline"
              :type="showCurrentPassword ? 'text' : 'password'"
              variant="outlined"
              @click:append-inner="showCurrentPassword = !showCurrentPassword"
            />
            <v-text-field
              v-model="newPassword"
              :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
              class="mb-3"
              :label="$t('settings.newPassword')"
              autocomplete="new-password"
              prepend-inner-icon="mdi-lock-outline"
              :type="showNewPassword ? 'text' : 'password'"
              variant="outlined"
              :rules="newPasswordRules"
              @click:append-inner="showNewPassword = !showNewPassword"
            />
            <v-text-field
              v-model="confirmNewPassword"
              :append-inner-icon="showConfirmNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
              :label="$t('settings.confirmNewPassword')"
              autocomplete="new-password"
              prepend-inner-icon="mdi-lock-check-outline"
              :type="showConfirmNewPassword ? 'text' : 'password'"
              variant="outlined"
              :rules="confirmNewPasswordRules"
              @click:append-inner="showConfirmNewPassword = !showConfirmNewPassword"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="closePasswordSheet">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSavingPassword" :disabled="isSavingPassword" @click="savePassword">
            {{ $t('common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="isDeleteDialogOpen" max-width="360">
      <v-card
        class="bg-cardBg rounded-lg"
        :style="{ border: '1px solid rgb(var(--v-theme-borderColor))' }"
      >
        <v-card-title class="text-h6 pt-5 px-5">{{
          $t('settings.deleteAccountConfirmTitle')
        }}</v-card-title>
        <v-card-text class="text-textSecondary px-5">
          {{ $t('settings.deleteAccountConfirmText') }}
        </v-card-text>
        <v-card-actions class="px-5 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="isDeleteDialogOpen = false">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn color="error" variant="flat" :loading="isDeleting" :disabled="isDeleting" @click="confirmDeleteAccount">
            {{ $t('settings.deleteAccount') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts" setup>
import EditPersonalInfoDialog from '@/components/Settings/EditPersonalInfoDialog.vue'
import { updateUser, uploadAvatar, deleteUser } from '@/services/user.service'
import type { User } from '@/interfaces/User.interface'
import { toast } from 'vuetify-sonner'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import type { VForm } from 'vuetify/components'

const props = defineProps<{
  user: User | null
}>()

const emit = defineEmits<{
  close: []
  updated: [user: User]
}>()

const authStore = useAuthStore()
const { t } = useI18n({ useScope: 'global' })

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8393/v1'

const getImageUrl = (imagePath: string) => {
  if (imagePath.startsWith('http')) return imagePath
  const baseUrl = apiUrl.replace('/v1', '')
  return `${baseUrl}${imagePath}`
}

// Reactive user from props
const currentUser = computed(() => props.user)

const isImperial = computed(() => currentUser.value?.unitScale === 'imperial')
const weightUnit = computed(() => (isImperial.value ? 'lbs' : 'kg'))
const heightUnit = computed(() => (isImperial.value ? 'in' : 'cm'))
const fromKg = (val: number | undefined | null): string => {
  if (val == null) return t('settings.notSet')
  const converted = isImperial.value
    ? Number((val * 2.20462).toFixed(1))
    : Number(Number(val).toFixed(1))
  return `${converted} ${weightUnit.value}`
}
const fromCm = (val: number | undefined | null): string => {
  if (val == null) return t('settings.notSet')
  const converted = isImperial.value
    ? Number((val / 2.54).toFixed(1))
    : Number(Number(val).toFixed(1))
  return `${converted} ${heightUnit.value}`
}

// Display values
const displayName = computed(() => {
  const u = currentUser.value
  if (!u) return '—'
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'
})
const displayDateOfBirth = computed(() => {
  const dob = currentUser.value?.dateOfBirth
  if (!dob) return t('settings.notSet')
  return new Date(dob).toLocaleDateString()
})
const displayWeight = computed(() => fromKg(currentUser.value?.weight))
const displayHeight = computed(() => fromCm(currentUser.value?.height))

// Photo upload
const fileInput = ref<HTMLInputElement | null>(null)
const isUploadingPhoto = ref(false)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handlePhotoSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  isUploadingPhoto.value = true
  try {
    const updated = (await uploadAvatar(file)) as User
    emit('updated', updated)
    await authStore.refreshUser()
    toast.success(t('settings.avatarUpdated'), { progressBar: true, duration: 1000 })
  } catch {
    toast.error(t('settings.failedToUploadAvatar'), { progressBar: true, duration: 5000 })
  } finally {
    isUploadingPhoto.value = false
    // Reset input so same file can be re-selected
    if (fileInput.value) fileInput.value.value = ''
  }
}

// Edit personal info dialog
const isEditOpen = ref(false)

const onPersonalInfoUpdated = (updated: User) => {
  emit('updated', updated)
}

// Password change
const isPasswordSheetOpen = ref(false)
const isSavingPassword = ref(false)
const passwordForm = ref<VForm | null>(null)
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmNewPassword = ref(false)

const newPasswordRules = computed(() => [
  (v: string) => !v || v.length >= 8 || t('auth.passwordMinLength'),
])
const confirmNewPasswordRules = computed(() => [
  (v: string) =>
    !newPassword.value || (!!v && v === newPassword.value) || t('auth.passwordsDoNotMatch'),
])

const closePasswordSheet = () => {
  isPasswordSheetOpen.value = false
  currentPassword.value = ''
  newPassword.value = ''
  confirmNewPassword.value = ''
}

const savePassword = async () => {
  if (isSavingPassword.value) return
  if (!passwordForm.value) return

  const { valid } = await passwordForm.value.validate()
  if (!valid) return

  if (!currentPassword.value) {
    toast.error(t('settings.currentPasswordRequired'), { progressBar: true, duration: 5000 })
    return
  }

  if (!newPassword.value) return

  isSavingPassword.value = true
  try {
    const updated = (await updateUser({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    } as Partial<User>)) as User
    emit('updated', updated)
    toast.success(t('settings.accountUpdated'), { progressBar: true, duration: 1000 })
    closePasswordSheet()
  } catch {
    toast.error(t('settings.failedToUpdateAccount'), { progressBar: true, duration: 5000 })
  } finally {
    isSavingPassword.value = false
  }
}

// Delete account
const isDeleteDialogOpen = ref(false)
const isDeleting = ref(false)

const confirmDeleteAccount = async () => {
  isDeleting.value = true
  try {
    await deleteUser()
    toast.success(t('settings.accountDeleted'), { progressBar: true, duration: 1000 })
    isDeleteDialogOpen.value = false
    authStore.logout()
  } catch {
    toast.error(t('settings.failedToDeleteAccount'), { progressBar: true, duration: 5000 })
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 4px;
  right: -4px;
  height: 32px !important;
  width: 32px !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
