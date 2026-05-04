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
  <div>
    <div class="d-flex flex-row justify-space-between align-center pa-3">
      <div class="d-flex align-center ga-2">
        <slot name="prepend" />
        <h1 class="text-h5">
          {{ resolvedExercise ? displayName(resolvedExercise) : $t('common.loading') }}
        </h1>
      </div>
      <div class="d-flex flex-row ga-5 align-center">
        <v-chip
          v-if="allSetsDone"
          color="green"
          prepend-icon="mdi-check-circle"
          size="small"
          variant="tonal"
        >
          {{ $t('table.done') }}
        </v-chip>
        <v-icon
          v-if="allSetsDone"
          @click="showDetails = !showDetails"
        >
          {{ showDetails ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
        </v-icon>
        <v-icon
          v-if="!allSetsDone"
          @click="isTimerVisible = true"
        >
          mdi-timer-play-outline
        </v-icon>
        <v-icon
          v-if="!allSetsDone"
          @click="addSet"
        >
          mdi-table-row-plus-after
        </v-icon>
        <v-menu
          offset-y
          transition="slide-y-transition"
        >
          <template #activator="{ props: activatorProps }">
            <v-icon v-bind="activatorProps">
              mdi-dots-horizontal
            </v-icon>
          </template>
          <v-list>
            <v-list-item @click="$emit('view-details')">
              <v-list-item-title>{{ $t('session.exerciseDetails') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('move-to-top')">
              <v-list-item-title>{{ $t('session.moveToTop') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="addSet">
              <v-list-item-title>{{ $t('session.addSet') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="$emit('delete:exercise', resolvedExercise)">
              <v-list-item-title>{{ $t('session.deleteExercise') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <v-expand-transition>
      <div v-if="showDetails">
        <div
          class="d-flex flex-row ga-2 px-5 py-2 align-center bg-green-darken-4"
        >
          <v-icon
            size="18"
            color="white"
          >
            mdi-lightbulb-outline
          </v-icon>
          <p class="text-subtitle-2 text-white">
            {{ resolvedExercise ? displayDescription(resolvedExercise) : '' }}
          </p>
        </div>

        <v-data-table
          :headers="headers"
          :items="workoutSets"
          class="elevation-1 bg-transparent border-b"
          hide-default-footer
          @click:row="handleRowClick"
        >
          <!-- eslint-disable-next-line -->
          <template #['item.done']="{ item }"> 
            <v-checkbox
              :model-value="item.done"
              color="primary"
              hide-details
              class="ma-0 pa-0"
              @update:model-value="onDoneChanged(item, $event ?? false)"
              @click.stop
            />
          </template>
        </v-data-table>
        <div
          v-if="props.showRpe"
          class="pa-4 pt-2 d-flex flex-column ga-3 bg-grey-darken-4"
        >
          <span class="text-body-2 text-grey">{{ $t('session.rpeLabel') }}</span>

          <v-chip-group
            :model-value="props.rpe ?? 8"
            mandatory
            class="d-flex flex-wrap justify-space-between "
            @update:model-value="$emit('update:rpe', $event)"
          >
            <v-chip
              v-for="value in [0, 4, 6, 8, 9, 10]"
              :key="value"
              :value="value"
              size="large"
              filter
              label
              class="flex-grow-1 text-center justify-center ma-0 mx-1"
              :color="(props.rpe ?? 8) === value ? 'primary' : 'grey-darken-2'"
              variant="tonal"
            >
              {{ value }}
            </v-chip>
          </v-chip-group>
          <!-- TODO: Disable for now (Not working yet, and still don't know how i want it)-->
          <!-- <v-text-field
            label="Exercise Notes"
            :model-value="props.notes"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="$emit('update:notes', $event)"
          /> -->
        </div>
      </div>
    </v-expand-transition>

    <EditSetDialog
      v-if="isEditDialogVisible"
      v-model="isEditDialogVisible"
      :set="selectedSet"
      @save="saveSet"
      @delete="selectedSet && deleteSet(selectedSet)"
    />

    <v-dialog
      v-model="showPropagateDialog"
      max-width="500"
      persistent
    >
      <v-card>
        <v-card-title>{{ $t('session.updateSubsequentSets') }}</v-card-title>
        <v-card-text>
          {{ $t('session.updateSetsPrompt', { sets: propagateSetsIndices, weight: propagateWeight, reps: propagateReps }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            @click="confirmPropagate(false)"
          >
            {{ $t('session.noJustThisOne') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            @click="confirmPropagate(true)"
          >
            {{ $t('session.yesUpdateAll') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <TimerDialog
      v-model="isTimerVisible"
      :duration="props.exercise.pauseSeconds"
    />
  </div>
</template>

<script lang="ts" setup>
// TODO: Add functionality to view exercise details
// TODO: Maybe have a info icon that shows exercise details in a dialog instead of a dropdown

import { useI18n } from 'vue-i18n';
import { displayExerciseDescription, displayExerciseName } from '@/utils/exerciseDisplay';

import type {
  Exercise as ExerciseProp,
  WorkoutSet,
} from '@/interfaces/Workout.interface';

const { t } = useI18n({ useScope: 'global' });

const props = defineProps({
  exercise: {
    type: Object as PropType<ExerciseProp>,
    required: true,
  },
  workoutSets: {
    type: Array as PropType<WorkoutSet[]>,
    required: true,
  },
  rpe: {
    type: Number,
    default: undefined,
  },
  notes: {
    type: String,
    default: '',
  },
  showRpe: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  (e: 'update:set', payload: WorkoutSet): void;
  (e: 'delete:set', payload: WorkoutSet): void;
  (e: 'add:set'): void;
  (e: 'update:rpe', value: number): void;
  (e: 'update:notes', value: string): void;
  (e: 'delete:exercise', payload: ExerciseProp['exercise']): void;
  (e: 'move-to-top'): void;
  (e: 'view-details'): void;
}>();

const resolvedExercise = computed(() => props.exercise.exercise);

const displayName = (exercise: NonNullable<typeof resolvedExercise.value>) =>
  displayExerciseName({ t }, exercise);

const displayDescription = (exercise: NonNullable<typeof resolvedExercise.value>) =>
  displayExerciseDescription({ t }, exercise, t('exerciseCatalog.noDescription'));
const showDetails = ref(true);

const isEditDialogVisible = ref(false);
const isTimerVisible = ref(false);
const selectedSet = ref<WorkoutSet | null>(null);

const showPropagateDialog = ref(false);
const pendingEditedSet = ref<WorkoutSet | null>(null);

const propagateWeight = computed(() => pendingEditedSet.value?.weight);
const propagateReps = computed(() => pendingEditedSet.value?.reps);

const propagateSetsIndices = computed(() => {
  if (!pendingEditedSet.value) return '';
  const indices = props.workoutSets
    .filter((s) => s.set > pendingEditedSet.value!.set && !s.done)
    .map((s) => s.set);

  if (indices.length === 0) return '';
  if (indices.length === 1) return indices[0].toString();
  const last = indices.pop();
  return indices.join(', ') + ` ${t('common.and')} ` + last;
});

const headers = computed(() => [
  { title: t('table.set'), key: 'set', sortable: false, width: '20%' },
  { title: t('table.previous'), key: 'previous', sortable: false, width: '30%' },
  { title: t('table.weightKg'), key: 'weight', sortable: false, width: '25%' },
  { title: t('table.reps'), key: 'reps', sortable: false, width: '15%' },
  { title: t('table.done'), key: 'done', sortable: false, width: '10%' },
]);

const allSetsDone = computed(() => {
  if (!props.workoutSets || props.workoutSets.length === 0) return false;
  return props.workoutSets.every((set) => set.done);
});

watch(allSetsDone, (isCompleted) => {
  if (isCompleted) {
    showDetails.value = false;
  }
});

function handleRowClick(event: Event, { item }: { item: WorkoutSet }) {
  selectedSet.value = { ...item };
  isEditDialogVisible.value = true;
}

function saveSet(editedSet: WorkoutSet) {
  const originalSet = props.workoutSets.find((s) => s.set === editedSet.set);
  const changed =
    originalSet &&
    (originalSet.weight !== editedSet.weight ||
      originalSet.reps !== editedSet.reps);

  const subsequentSets = props.workoutSets.filter(
    (s) => s.set > editedSet.set && !s.done
  );

  if (changed && subsequentSets.length > 0) {
    pendingEditedSet.value = editedSet;
    showPropagateDialog.value = true;
  } else {
    emit('update:set', editedSet);
  }
}

function confirmPropagate(shouldPropagate: boolean) {
  if (pendingEditedSet.value) {
    emit('update:set', pendingEditedSet.value);

    if (shouldPropagate) {
      const { weight, reps, set: currentSetNum } = pendingEditedSet.value;
      const subsequentSets = props.workoutSets.filter(
        (s) => s.set > currentSetNum && !s.done
      );

      subsequentSets.forEach((s) => {
        emit('update:set', {
          ...s,
          weight,
          reps,
        });
      });
    }
  }

  showPropagateDialog.value = false;
  pendingEditedSet.value = null;
}

function deleteSet(setToDelete: WorkoutSet) {
  emit('delete:set', setToDelete);
}

function addSet() {
  emit('add:set');
}

function onDoneChanged(set: WorkoutSet, isDone: boolean) {
  emit('update:set', { ...set, done: isDone });
}

watch(
  allSetsDone,
  (isCompleted) => {
    if (isCompleted) {
      showDetails.value = false;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.v-data-table :deep(tbody tr:hover) {
  cursor: pointer;
}
.v-data-table .v-checkbox {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
