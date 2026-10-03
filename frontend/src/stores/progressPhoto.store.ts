/*
 * Copyright (c) 2026 FalkenDev
 *
 * This file is part of Grindify.
 *
 * Grindify is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with Grindify. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ProgressPhoto, CreateProgressPhotoDto } from '@/interfaces/ProgressPhoto.interface'
import * as progressPhotoService from '@/services/progressPhoto.service'
import { useAuthStore } from './auth.store'

export const useProgressPhotoStore = defineStore('progressPhotoStore', () => {
  const authStore = useAuthStore()

  const photos = ref<ProgressPhoto[]>([])
  const isLoading = ref(false)
  const lastFetched = ref<number | null>(null)
  const cacheDuration = 30 * 1000 // 30 seconds

  const fetchPhotos = async (reload = false) => {
    // Progress photos are health data – only available with health data consent.
    if (!authStore.isAuthenticated || !authStore.hasHealthConsent) return
    const now = Date.now()
    if (
      photos.value.length > 0 &&
      !reload &&
      lastFetched.value &&
      now - lastFetched.value < cacheDuration
    )
      return

    try {
      isLoading.value = true
      photos.value = await progressPhotoService.fetchAllProgressPhotos()
      lastFetched.value = now
    } catch (err) {
      console.error('Error fetching progress photos:', err)
    } finally {
      isLoading.value = false
    }
  }

  const uploadPhoto = async (file: File, dto: CreateProgressPhotoDto) => {
    const photo = await progressPhotoService.uploadProgressPhoto(file, dto)
    photos.value = [photo, ...photos.value]
    return photo
  }

  const deletePhoto = async (id: number) => {
    await progressPhotoService.deleteProgressPhoto(id)
    photos.value = photos.value.filter(p => p.id !== id)
  }

  watch(
    () => authStore.isAuthenticated && authStore.hasHealthConsent,
    enabled => {
      if (enabled) void fetchPhotos(true)
    },
    { immediate: true }
  )

  const resetStore = () => {
    photos.value = []
    isLoading.value = false
    lastFetched.value = null
  }

  return { photos, isLoading, fetchPhotos, uploadPhoto, deletePhoto, resetStore }
})
