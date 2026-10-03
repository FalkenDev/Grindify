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
  <div
    class="d-flex justify-space-between align-center px-5 py-3"
    @click="routeTo"
  >
    <v-btn
      v-if="showMenu"
      color="grey-darken-4"
      density="compact"
      icon
      size="40"
      variant="flat"
      :loading="isLoading"
      :disabled="isLoading"
      @click.stop="emit('close')"
    >
      <template v-if="!isLoading">
        <v-icon>mdi-arrow-left</v-icon>
      </template>
    </v-btn>
    <h1
      class="text-h6"
      :class="showMenu ? '' : 'w-100 text-center'"
    >
      {{ title }}
    </h1>
    <v-btn
      v-if="showMenu"
      color="grey-darken-4"
      density="compact"
      icon
      size="40"
      variant="flat"
    >
      <v-icon>mdi-menu</v-icon>
      <v-menu activator="parent">
        <template v-if="$slots.menuAppend">
          <slot name="menuAppend" />
        </template>
      </v-menu>
    </v-btn>
  </div>
</template>
<script lang="ts" setup>
import router from "@/router";

const emit = defineEmits<{
  (e: "close"): void;
}>();

const props = defineProps<{
  title: string;
  showMenu?: boolean;
  routeTo?: string;
  isLoading?: boolean;
}>();

const routeTo = () => {
  if (props.routeTo) {
    router.push(props.routeTo);
  }
};
</script>
