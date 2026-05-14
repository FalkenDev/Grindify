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

import { ExerciseType } from '../../exercise/exercise.entity';

export interface ExerciseSeedDef {
  i18nKey?: string;
  defaultName: string;
  defaultDescription: string;
  swedenName?: string;
  swedenDescription?: string;
  muscleGroups: string[];
  primaryMuscleGroup?: string;
  exerciseType?: ExerciseType;
  equipment?: string[];
  instructions?: string[];
  proTips?: string[];
  mistakes?: string[];
  swedenInstructions?: string[];
  swedenProTips?: string[];
  swedenMistakes?: string[];
}

export const exercisesToSeed: ExerciseSeedDef[] = [
  // ─── PUSH ────────────────────────────────────────────────
  {
    i18nKey: 'exercise.bench_press',
    primaryMuscleGroup: 'chest',
    defaultName: 'Bench Press',
    defaultDescription:
      'Barbell press on a flat bench. Retract scapulae, slight arch, feet flat on the floor. Lower to mid-chest and press up with elbows at ~45°.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Barbell', 'Flat bench'],
    instructions: [
      'Lie on the bench with eyes under the bar.',
      'Grip the bar slightly wider than shoulder-width.',
      'Retract shoulder blades and create a slight arch.',
      'Unrack the bar and lower it in a controlled manner to mid-chest.',
      'Press the bar straight up to full arm extension.',
    ],
    proTips: [
      'Keep elbows at ~45° angle to protect the shoulders.',
      'Drive feet firmly into the floor for stability.',
      'Inhale on the way down, exhale on the press.',
    ],
    mistakes: [
      'Do not bounce the bar off your chest.',
      'Do not lift your glutes off the bench.',
      'Avoid pressing with elbows flared straight out to the sides.',
    ],
  },
  {
    i18nKey: 'exercise.incline_dumbbell_press',
    primaryMuscleGroup: 'upperChest',
    defaultName: 'Incline Dumbbell Press',
    defaultDescription:
      'Press dumbbells on a bench set to a 30–45° incline. Lower in a controlled manner to chest level, press up and slightly inward.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Dumbbells', 'Incline bench'],
    instructions: [
      'Set the bench to a 30–45° incline.',
      'Hold a dumbbell in each hand with a neutral grip.',
      'Press the dumbbells up to full arm extension.',
      'Lower in a controlled manner to chest level.',
    ],
    proTips: [
      'Rotate wrists slightly inward at the top for better contraction.',
      'Keep shoulder blades retracted throughout the movement.',
    ],
    mistakes: [
      'Do not set the bench too steep – it shifts the load to the shoulders.',
      'Do not lower dumbbells too deep, it stresses the shoulder joint.',
    ],
  },
  {
    i18nKey: 'exercise.seated_dumbbell_shoulder_press',
    primaryMuscleGroup: 'shoulders',
    defaultName: 'Seated Dumbbell Shoulder Press',
    defaultDescription:
      'Seated vertical press. Keep ribs down and forearms vertical. Lower to approximately ear height and press without shrugging the shoulders.',
    muscleGroups: ['shoulders', 'triceps', 'core'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Dumbbells', 'Seated bench with back support'],
    instructions: [
      'Sit with back support and feet flat on the floor.',
      'Hold dumbbells at shoulder height with palms facing forward.',
      'Press straight up to full arm extension.',
      'Lower in a controlled manner back to ear height.',
    ],
    proTips: [
      'Avoid arching the back – keep core engaged.',
      'Press upward in a slight arc, not straight forward.',
    ],
    mistakes: [
      'Do not press behind the head – it stresses the shoulder joint.',
      'Avoid using momentum to lift the weight.',
    ],
  },
  {
    i18nKey: 'exercise.dumbbell_lateral_raise',
    primaryMuscleGroup: 'shoulders',
    defaultName: 'Dumbbell Lateral Raise',
    defaultDescription:
      'Lift dumbbells slightly forward and out to shoulder height. Soft elbows, strict control, and slow eccentric phase.',
    muscleGroups: ['shoulders', 'rearDelts'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Dumbbells'],
    instructions: [
      'Stand with dumbbells at your sides, slight forward lean.',
      'Lift dumbbells out to the sides to shoulder height with soft elbows.',
      'Hold briefly at the top position.',
      'Lower slowly back down.',
    ],
    proTips: [
      'Think of pouring water from a glass at the top position.',
      'Use lighter weights with strict form for better isolation.',
    ],
    mistakes: [
      'Do not swing the weights – use controlled force.',
      'Do not lift above shoulder height, it can stress the shoulder joint.',
    ],
  },
  {
    i18nKey: 'exercise.cable_triceps_pushdown',
    primaryMuscleGroup: 'triceps',
    defaultName: 'Cable Triceps Pushdown',
    defaultDescription:
      'With rope or bar, keep elbows still. Extend fully and control back to ~90°.',
    muscleGroups: ['triceps'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Cable machine', 'Straight bar or rope'],
    instructions: [
      'Stand in front of the cable machine with a high attachment.',
      'Grip the bar/rope with elbows close to the body.',
      'Extend arms fully downward.',
      'Control back to ~90° at the elbow.',
    ],
    proTips: [
      'Keep elbows completely still at the sides throughout the movement.',
      'Focus on pressing with the triceps, not the shoulders.',
    ],
    mistakes: [
      'Do not lean forward and use body weight.',
      'Avoid moving elbows forward and back.',
    ],
  },
  {
    i18nKey: 'exercise.cable_chest_fly',
    primaryMuscleGroup: 'chest',
    defaultName: 'Cable Chest Fly',
    defaultDescription:
      'From high/mid pulleys. Slight forward lean, hugging motion with soft elbows. Squeeze chest and return slowly.',
    muscleGroups: ['chest'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Cable machine (dual pulleys)'],
    instructions: [
      'Stand in the middle with a handle in each hand.',
      'Lean slightly forward with feet in a staggered stance.',
      'Bring hands together in front of the chest in a hugging motion.',
      'Open arms back in a controlled manner to start position.',
    ],
    proTips: [
      'Keep a soft bend in the elbows throughout the movement.',
      'Focus on squeezing the chest muscles together.',
    ],
    mistakes: [
      'Straight arms put unnecessary stress on the elbow joint.',
      'Avoid pulling with the shoulders – keep them down and back.',
    ],
  },

  // ─── LEGS ────────────────────────────────────────────────
  {
    i18nKey: 'exercise.back_squat',
    primaryMuscleGroup: 'quads',
    defaultName: 'Back Squat (Barbell)',
    defaultDescription:
      'Bar on upper back, brace core, knees follow toes. Descend as deep as you can control and drive back up.',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'core'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Barbell', 'Squat rack'],
    instructions: [
      'Place the bar on the upper trapezius muscle.',
      'Grip wide, retract shoulder blades and brace core.',
      'Step back, feet shoulder-width apart.',
      'Bend knees and hips, lower in a controlled manner.',
      'Drive up through the heels to full extension.',
    ],
    proTips: [
      'Push knees out in line with toes.',
      'Keep chest up and gaze forward.',
      'Take a deep breath and brace core before each rep.',
    ],
    mistakes: [
      'Do not let knees cave inward.',
      'Avoid rounding the back on the way up.',
      'Do not rise up on toes – drive through the whole foot.',
    ],
  },
  {
    i18nKey: 'exercise.barbell_hip_thrust',
    primaryMuscleGroup: 'glutes',
    defaultName: 'Barbell Hip Thrust',
    defaultDescription:
      'Upper back on bench, bar over hips. Tilt pelvis posteriorly, drive through heels and lock out with glutes.',
    muscleGroups: ['glutes', 'hamstrings'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Barbell', 'Bench', 'Barbell pad'],
    instructions: [
      'Sit with upper back against a bench and bar over the hip bones.',
      'Feet shoulder-width apart, knees ~90° at top position.',
      'Tilt pelvis posteriorly (posterior tilt).',
      'Drive through the heels and lift hips to full extension.',
      'Squeeze glutes hard at the top position.',
    ],
    proTips: [
      'Use a barbell pad for comfort.',
      'Look down/forward during the movement, not upward.',
    ],
    mistakes: [
      'Do not hyperextend the back – lock out with the glutes.',
      'Do not place feet too far from or too close to the bench.',
    ],
  },
  {
    i18nKey: 'exercise.leg_press',
    primaryMuscleGroup: 'quads',
    defaultName: 'Leg Press',
    defaultDescription:
      'Feet shoulder-width on the sled. Lower deep with control without the pelvis tilting; press through mid-foot.',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Leg press machine'],
    instructions: [
      'Sit in the machine with back flat against the seat.',
      'Place feet shoulder-width on the plate.',
      'Release the safety locks.',
      'Lower slowly until knees form ~90°.',
      'Press back without fully locking the knees.',
    ],
    proTips: [
      'Place feet higher for more glute focus, lower for more quad focus.',
      'Press through the entire foot, not just the toes.',
    ],
    mistakes: [
      'Do not let the pelvis tilt up – keep glutes in the seat.',
      'Never fully lock the knees at the top position.',
    ],
  },
  {
    i18nKey: 'exercise.seated_leg_curl',
    primaryMuscleGroup: 'hamstrings',
    defaultName: 'Seated Leg Curl',
    defaultDescription:
      'Adjust pad above heels. Curl to full knee flexion with hips still; control the eccentric phase.',
    muscleGroups: ['hamstrings'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Seated leg curl machine'],
    instructions: [
      'Adjust the machine so the pad is placed above the heels.',
      'Sit with back against the back rest.',
      'Curl legs downward to full knee flexion.',
      'Return in a controlled manner to starting position.',
    ],
    proTips: [
      'Keep a slow eccentric phase (2–3 s) for better activation.',
      'Squeeze hamstrings at the bottom position.',
    ],
    mistakes: [
      'Do not lift your glutes from the seat during the movement.',
      'Avoid using momentum – keep it controlled.',
    ],
  },
  {
    i18nKey: 'exercise.leg_extension',
    primaryMuscleGroup: 'quads',
    defaultName: 'Leg Extension',
    defaultDescription:
      'Pad above ankles. Extend to near lockout with control; 2–3 s eccentric for knee-friendly loading.',
    muscleGroups: ['quads'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Leg extension machine'],
    instructions: [
      'Adjust the machine so the pad rests above the ankles.',
      'Sit with back against the back rest.',
      'Extend legs upward to near full extension.',
      'Lower in a controlled manner (2–3 seconds).',
    ],
    proTips: [
      'Angle feet upward (dorsiflexion) for better quad activation.',
      'Pause briefly at the top for maximum contraction.',
    ],
    mistakes: [
      'Do not fully lock the knees – it stresses the joint.',
      'Avoid swinging legs up with momentum.',
    ],
  },
  {
    i18nKey: 'exercise.calf_raise_machine_or_leg_press',
    primaryMuscleGroup: 'calves',
    defaultName: 'Calf Raise (Machine/Leg Press)',
    defaultDescription:
      'Full range of motion at the ankle. Pause at the bottom; strong toe raise at the top. No bouncing.',
    muscleGroups: ['calves'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Calf raise machine or leg press machine'],
    instructions: [
      'Place the balls of your feet on the edge of the platform.',
      'Lower heels as far down as possible.',
      'Press up through the toes to full plantarflexion.',
      'Pause briefly at the top position.',
    ],
    proTips: [
      'Pause 1–2 seconds at the bottom position for a full stretch.',
      'Perform reps slowly – calves respond well to time under tension.',
    ],
    mistakes: [
      'Do not bounce at the bottom – it can injure the Achilles tendon.',
      'Avoid half reps – use full range of motion.',
    ],
  },

  // ─── PUSH / SHOULDERS ────────────────────────────────────
  {
    i18nKey: 'exercise.standing_barbell_overhead_press',
    primaryMuscleGroup: 'shoulders',
    defaultName: 'Standing Barbell Overhead Press',
    defaultDescription:
      'Stand stable, brace glutes and core. Press the bar straight up; bring head forward through the arms at the top.',
    muscleGroups: ['shoulders', 'triceps', 'upperChest', 'core'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Barbell'],
    instructions: [
      'Grip the bar shoulder-width in front of the collarbones.',
      'Brace glutes, core and entire body.',
      'Press the bar straight up past the face.',
      'Lock out and bring head forward through the arms.',
      'Lower in a controlled manner back to start.',
    ],
    proTips: [
      'Breathe in and brace core thoroughly before each rep.',
      'Keep wrists straight – the bar should rest on the palm.',
    ],
    mistakes: [
      'Do not lean back – it turns the exercise into a standing bench press.',
      'Avoid bending knees to generate momentum.',
    ],
  },
  {
    i18nKey: 'exercise.seated_cable_row',
    primaryMuscleGroup: 'back',
    defaultName: 'Seated Cable Row',
    defaultDescription:
      'Neutral back, chest up. Pull toward lower ribcage with elbows close to body; squeeze lats/mid-back, return slowly.',
    muscleGroups: ['back', 'rearDelts', 'biceps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Cable machine', 'V-grip or wide handle'],
    instructions: [
      'Sit with feet on the pads and knees slightly bent.',
      'Grip the handle with a neutral back and chest up.',
      'Pull the handle toward the lower ribcage/navel.',
      'Squeeze shoulder blades together at the end position.',
      'Return in a controlled manner without rounding the back.',
    ],
    proTips: [
      'Think of pulling with elbows, not hands.',
      'Avoid leaning the torso back more than a few degrees.',
    ],
    mistakes: [
      'Do not round the back at the extended position.',
      'Do not use momentum by rocking the torso.',
    ],
  },
  {
    i18nKey: 'exercise.incline_bench_press',
    primaryMuscleGroup: 'upperChest',
    defaultName: 'Incline Bench Press (Barbell)',
    defaultDescription:
      'Barbell press on a 30–45° incline. Lower to upper chest; press with elbows at ~45–60°.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Barbell', 'Incline bench'],
    instructions: [
      'Lie on a bench set to a 30–45° incline.',
      'Grip the bar slightly wider than shoulder-width.',
      'Unrack the bar and lower it to the upper chest.',
      'Press up to full arm extension.',
    ],
    proTips: [
      'Retract shoulder blades just as in flat bench press.',
      'Keep elbows at ~45–60° angle.',
    ],
    mistakes: [
      'Do not set the bench too steep – 30° is enough for upper chest.',
      'Do not bounce the bar off your chest.',
    ],
  },
  {
    i18nKey: 'exercise.walking_lunge',
    primaryMuscleGroup: 'quads',
    defaultName: 'Walking Lunge',
    defaultDescription:
      'Step forward and descend in a controlled manner. Front knee follows toes; drive up through front heel and alternate.',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'core'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Dumbbells (optional)', 'Barbell (optional)'],
    instructions: [
      'Stand upright with feet together.',
      'Take a long step forward and lower the rear knee toward the floor.',
      'Front knee should be aligned with toes at ~90°.',
      'Drive up through the front heel and take the next step.',
    ],
    proTips: [
      'Keep torso upright and gaze forward.',
      'Longer step = more glute activation, shorter step = more quad activation.',
    ],
    mistakes: [
      'Do not let the front knee go past the toes.',
      'Avoid leaning the torso forward.',
    ],
  },
  {
    i18nKey: 'exercise.overhead_triceps_extension_rope_or_db',
    primaryMuscleGroup: 'triceps',
    defaultName: 'Overhead Triceps Extension (Rope/Dumbbell)',
    defaultDescription:
      'Arms overhead, elbows close. Lower behind head for a stretch; extend fully without flaring elbows.',
    muscleGroups: ['triceps'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Cable machine with rope', 'Dumbbell (alternative)'],
    instructions: [
      'Grip the rope/dumbbell and hold arms overhead.',
      'Keep elbows close to the head, pointing upward.',
      'Lower the weight behind the head by bending at the elbow.',
      'Extend arms to full extension.',
    ],
    proTips: [
      'Focus on keeping elbows still – only the forearms move.',
      'Control the eccentric phase for better stretch.',
    ],
    mistakes: [
      'Do not flare elbows out – keep them close to the head.',
      'Do not use weight so heavy that you arch the back.',
    ],
  },
  {
    i18nKey: 'exercise.hammer_curl',
    primaryMuscleGroup: 'biceps',
    defaultName: 'Hammer Curl',
    defaultDescription:
      'Dumbbell curl with neutral grip. Elbows at sides; control the eccentric phase in ~2 sec.',
    muscleGroups: ['biceps', 'forearms'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Dumbbells'],
    instructions: [
      'Stand with dumbbells at your sides, palms facing your body.',
      'Curl dumbbells upward without rotating the wrists.',
      'Squeeze biceps at the top position.',
      'Lower in a controlled manner in ~2 seconds.',
    ],
    proTips: [
      'Keep elbows fixed at the sides of the body.',
      'Alternate arms if you want to focus on one side at a time.',
    ],
    mistakes: [
      'Do not swing with the body to lift the weight.',
      'Avoid moving elbows forward during the curl.',
    ],
  },

  // ─── PULL ────────────────────────────────────────────────
  {
    i18nKey: 'exercise.deadlift',
    primaryMuscleGroup: 'back',
    defaultName: 'Deadlift',
    defaultDescription:
      'Hip hinge with a neutral back, bar close to shins. Push the floor away, rise powerfully. Reset or control each repetition.',
    muscleGroups: [
      'back',
      'glutes',
      'hamstrings',
      'traps',
      'core',
      'lowerBack',
    ],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Barbell'],
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot.',
      'Hinge down with a neutral back, grip bar shoulder-width.',
      'Brace core, push chest up.',
      'Drive through the floor, extending hips and knees simultaneously.',
      'Stand tall with bar close to the body.',
      'Lower back in a controlled manner.',
    ],
    proTips: [
      'Think of "pushing the floor away from you" rather than lifting.',
      'Keep the bar as close to the body as possible.',
      'Lock out with the glutes, not the back.',
    ],
    mistakes: [
      'Do not round the back – maintain neutral spine throughout.',
      'Do not lift with the arms – they function as hooks.',
      'Avoid starting with hips too low (it is not a squat).',
    ],
  },
  {
    i18nKey: 'exercise.lat_pulldown',
    primaryMuscleGroup: 'back',
    defaultName: 'Lat Pulldown',
    defaultDescription:
      'Grip slightly wider than shoulders. Pull bar to upper chest; elbows down and back; slow eccentric phase.',
    muscleGroups: ['back', 'biceps', 'rearDelts'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Lat pulldown machine', 'Wide bar'],
    instructions: [
      'Grip the bar slightly wider than shoulder-width.',
      'Sit with thighs under the pads.',
      'Pull the bar down toward the upper chest.',
      'Squeeze shoulder blades together at the bottom.',
      'Return slowly to full arm extension.',
    ],
    proTips: [
      'Lean the torso back a few degrees for a better movement line.',
      'Think of pulling elbows down toward the pocket.',
    ],
    mistakes: [
      'Do not pull the bar behind the neck – it stresses the shoulder.',
      'Do not lean back excessively.',
    ],
  },
  {
    i18nKey: 'exercise.seated_row_cable',
    primaryMuscleGroup: 'back',
    defaultName: 'Seated Cable Row (Navel)',
    defaultDescription:
      'Neutral back; pull to navel/lower ribcage. Pinch shoulder blades together; control the return.',
    muscleGroups: ['back', 'rearDelts', 'biceps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Cable machine', 'V-grip'],
    instructions: [
      'Sit with back straight and feet on the pads.',
      'Pull the handle toward the navel/lower ribcage.',
      'Squeeze shoulder blades together at the end position.',
      'Return in a controlled manner without rounding the back.',
    ],
    proTips: [
      'Keep chest up throughout the movement.',
      'Experiment with different grips to vary activation.',
    ],
    mistakes: [
      'Avoid rounding the back at the extended position.',
      'Do not rock the torso.',
    ],
  },
  {
    i18nKey: 'exercise.face_pull',
    primaryMuscleGroup: 'rearDelts',
    defaultName: 'Face Pull',
    defaultDescription:
      'Rope at face height. Pull toward nose/forehead with external rotation (thumbs back); squeeze rear delts.',
    muscleGroups: ['rearDelts', 'back', 'traps'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Cable machine', 'Rope'],
    instructions: [
      'Set the cable at face height with a rope attachment.',
      'Grip the rope with thumbs facing backward.',
      'Pull toward the face and separate hands outward.',
      'Squeeze rear delts and rotate outward.',
      'Return in a controlled manner.',
    ],
    proTips: [
      'Focus on external rotation – thumbs should point backward at the end position.',
      'Use lighter weight and more repetitions.',
    ],
    mistakes: [
      'Do not pull with the whole body – stand stable.',
      'Avoid turning it into a biceps curl.',
    ],
  },
  {
    i18nKey: 'exercise.biceps_curl_barbell_or_dumbbell',
    primaryMuscleGroup: 'biceps',
    defaultName: 'Biceps Curl (Barbell/Dumbbell)',
    defaultDescription:
      'Curl with supinated grip, elbows at sides, shoulders down. Full range of motion; controlled negative phase.',
    muscleGroups: ['biceps', 'forearms'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Barbell or dumbbells'],
    instructions: [
      'Stand tall with weight in hands, palms facing up (supinated grip).',
      'Keep elbows at the sides of the body.',
      'Curl weight upward to full contraction.',
      'Lower in a controlled manner in ~2 seconds.',
    ],
    proTips: [
      'Keep shoulders down and back throughout the movement.',
      'Squeeze biceps for one second at the top position.',
    ],
    mistakes: [
      'Do not swing the torso to lift the weight.',
      'Avoid moving elbows forward during the curl.',
    ],
  },

  // ─── ABS / CORE ──────────────────────────────────────────
  {
    i18nKey: 'exercise.sit_up',
    primaryMuscleGroup: 'abs',
    defaultName: 'Sit-ups',
    defaultDescription:
      'Tilt pelvis posteriorly; roll up vertebra by vertebra. Avoid pulling on the neck; control the descent.',
    muscleGroups: ['abs', 'hipFlexors', 'core'],
    exerciseType: ExerciseType.BODYWEIGHT,
    equipment: [],
    instructions: [
      'Lie on your back with knees bent and feet on the floor.',
      'Hands behind your head or crossed on your chest.',
      'Tilt pelvis posteriorly and roll up segment by segment.',
      'Lower in a controlled manner back down.',
    ],
    proTips: [
      'Focus on rolling up, not snapping up.',
      'Exhale on the way up, inhale on the way down.',
    ],
    mistakes: [
      'Do not pull on your neck with your hands.',
      'Avoid using momentum – keep it controlled.',
    ],
  },
  {
    i18nKey: 'exercise.lying_leg_raise',
    primaryMuscleGroup: 'abs',
    defaultName: 'Lying Leg Raise',
    defaultDescription:
      'Tilt pelvis posteriorly; lift straight legs without arching; stop before the lower back begins to extend.',
    muscleGroups: ['abs', 'hipFlexors', 'core'],
    exerciseType: ExerciseType.BODYWEIGHT,
    equipment: [],
    instructions: [
      'Lie on your back with legs straight and hands under your glutes or at your sides.',
      'Tilt pelvis posteriorly so lower back is pressed to the floor.',
      'Lift straight legs upward toward the ceiling.',
      'Lower in a controlled manner – stop before lower back starts to lift.',
    ],
    proTips: [
      'Keep lower back pressed to the floor at all times.',
      'Bend knees slightly if you cannot keep them straight.',
    ],
    mistakes: [
      'Do not arch the back in the lower phase.',
      'Avoid kicking legs upward with momentum.',
    ],
  },
  {
    i18nKey: 'exercise.side_lying_leg_raise_obliques',
    primaryMuscleGroup: 'core',
    defaultName: 'Side-lying Leg Raise (Obliques)',
    defaultDescription:
      'Side-lying; lift with obliques, keep hips stacked and control the tempo.',
    muscleGroups: ['abs', 'core'],
    exerciseType: ExerciseType.BODYWEIGHT,
    equipment: [],
    instructions: [
      'Lie on your side with legs straight and hips stacked.',
      'Support your head with your forearm.',
      'Lift the top leg upward with control.',
      'Lower back without moving the bottom leg.',
    ],
    proTips: [
      'Keep hips stacked directly on top of each other.',
      'Control the tempo – avoid fast movements.',
    ],
    mistakes: [
      'Do not roll backward with the hips.',
      'Avoid using momentum to lift the leg.',
    ],
  },

  {
    i18nKey: 'exercise.pull_ups',
    primaryMuscleGroup: 'back',
    defaultName: 'Pull-ups',
    defaultDescription:
      'A classic bodyweight exercise that builds a wide and strong back. Lat pulldown can be used as a beginner alternative.',
    muscleGroups: ['back', 'biceps', 'rearDelts', 'core', 'traps'],
    exerciseType: ExerciseType.BODYWEIGHT,
    equipment: ['Pull-up bar'],
    instructions: [
      'Hang with an overhand grip, hands shoulder-width or wider.',
      'Pull yourself up until chin is above the bar.',
      'Keep core engaged, avoid swinging.',
      'Lower yourself in a controlled manner to full arm extension.',
    ],
    proTips: [
      'Think "elbows to hips" for better lat activation.',
      'Narrow grip = more bicep focus, wide grip = more lat focus.',
      'Assisted pull-ups or lat pulldown are good progressions.',
    ],
    mistakes: [
      'Swinging your body to generate momentum.',
      'Partial range of motion.',
      'Letting shoulders shrug up at the top.',
    ],
  },
  {
    i18nKey: 'exercise.plank',
    primaryMuscleGroup: 'core',
    defaultName: 'Plank',
    defaultDescription:
      'A static core exercise that activates the entire trunk and improves stability and posture.',
    muscleGroups: ['core', 'abs', 'lowerBack', 'shoulders', 'hipFlexors'],
    exerciseType: ExerciseType.BODYWEIGHT,
    equipment: [],
    instructions: [
      'Place forearms on the floor, elbows under shoulders.',
      'Body in a straight line from head to heels.',
      'Engage abs and glutes, hold the position.',
      'Breathe evenly throughout the hold.',
    ],
    proTips: [
      'Avoid looking up – keep neck neutral.',
      'Make fists for increased full-body activation.',
      'Progress to dynamic variations such as plank to push-up.',
    ],
    mistakes: [
      'Sagging hips.',
      'Raised hips (butt in the air).',
      'Holding your breath.',
    ],
  },
  {
    i18nKey: 'exercise.bent_over_barbell_row',
    primaryMuscleGroup: 'back',
    defaultName: 'Bent-over Barbell Row',
    defaultDescription:
      'A classic compound back exercise performed with a bent-over torso and barbell. One of the best exercises for building back thickness.',
    muscleGroups: ['back', 'traps', 'rearDelts', 'biceps', 'lowerBack', 'core'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Barbell', 'Weight plates'],
    instructions: [
      'Stand with feet hip-width apart, grip bar wider than shoulder-width.',
      'Hinge forward at the hips (~45°), neutral back.',
      'Pull the bar toward your navel or lower chest.',
      'Squeeze shoulder blades together at the top.',
      'Lower in a controlled manner.',
    ],
    proTips: [
      'Underhand grip activates more biceps, overhand grip more back.',
      'Initiate the movement with shoulder blades, not arms.',
      'Keep the lower back neutral throughout.',
    ],
    mistakes: [
      'Using jerking movements and momentum.',
      'Rounded upper or lower back.',
      'Standing too upright – loses range of motion.',
    ],
  },
  {
    i18nKey: 'exercise.landmine_row',
    primaryMuscleGroup: 'back',
    defaultName: 'Landmine Row',
    defaultDescription:
      'A compound rowing variation where one end of the barbell is fixed in a landmine attachment. More spine-friendly than traditional bent-over rows due to the natural arc of the movement.',
    muscleGroups: ['back', 'traps', 'rearDelts', 'biceps', 'lowerBack'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Barbell', 'Landmine attachment', 'Weight plates'],
    instructions: [
      'Stand in a hinged position, grip the free end of the barbell.',
      'Neutral back, slight knee bend.',
      'Pull the bar toward your lower ribcage or navel.',
      'Squeeze shoulder blades together at the top.',
      'Lower in a controlled manner.',
    ],
    proTips: [
      'Keep elbows close to the body for more lat focus.',
      'Single-arm variation reveals muscle imbalances.',
      'The landmine arc creates a natural movement that is easy on the spine.',
    ],
    mistakes: [
      'Jerking the weight up with your back.',
      'Rounded upper back.',
      'Grip too wide – reduces lat activation.',
    ],
  },
  {
    i18nKey: 'exercise.single_arm_dumbbell_row',
    primaryMuscleGroup: 'back',
    defaultName: 'Single-arm Dumbbell Row',
    defaultDescription:
      'A unilateral rowing exercise with a dumbbell offering great range of motion and helping to identify and correct muscle imbalances between sides.',
    muscleGroups: ['back', 'biceps', 'rearDelts', 'lowerBack', 'traps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Dumbbell', 'Bench'],
    instructions: [
      'Place one knee and hand on a bench for support.',
      'Hold dumbbell in hanging arm, neutral back.',
      'Pull dumbbell toward hip, elbow along the side.',
      'Squeeze lat at the top.',
      'Lower in a controlled manner to full arm extension.',
    ],
    proTips: [
      'Let shoulder blade move freely for full range of motion.',
      'Think "elbow in the pocket" for better lat activation.',
      'Slight torso rotation at the bottom for more lat stretch.',
    ],
    mistakes: [
      'Jerking the weight up with your body.',
      'Shrugging shoulder at the end for extra range.',
      'Cutting range of motion short – go all the way.',
    ],
  },
  {
    i18nKey: 'exercise.shrugs',
    primaryMuscleGroup: 'traps',
    defaultName: 'Shrugs',
    defaultDescription:
      'An isolation exercise targeting the upper trapezius by elevating the shoulders with load. Builds neck and upper back thickness.',
    muscleGroups: ['traps', 'forearms'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Barbell or dumbbells'],
    instructions: [
      'Stand holding a barbell or dumbbells at your sides.',
      'Elevate shoulders straight up toward your ears.',
      'Hold at the top for 1 second and squeeze.',
      'Lower slowly back to starting position.',
    ],
    proTips: [
      'Do not roll the shoulders – straight up and down only.',
      'Pause at the top for better trap activation.',
      'Use straps if grip is the limiting factor.',
    ],
    mistakes: [
      'Rolling shoulders forward or backward.',
      'Using momentum to swing the weight up.',
      'Rushing through the movement.',
    ],
  },
  {
    i18nKey: 'exercise.romanian_deadlift',
    primaryMuscleGroup: 'hamstrings',
    defaultName: 'Romanian Deadlift',
    defaultDescription:
      'A hip hinge movement focused on the hamstrings and glutes through a controlled stretch and contraction. Excellent for posterior chain development and injury prevention.',
    muscleGroups: ['hamstrings', 'glutes', 'lowerBack', 'core', 'forearms'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Barbell or dumbbells'],
    instructions: [
      'Stand holding barbell at hip level, feet hip-width apart.',
      'Hinge at hips, pushing them backward.',
      'Lower the bar along your legs, keeping a neutral back.',
      'Feel a stretch in the hamstrings.',
      'Drive hips forward to return to standing.',
    ],
    proTips: [
      'Keep bar close to your legs throughout the movement.',
      'Do not lock out knees – keep a soft bend.',
      'Focus on the hip hinge, not squatting down.',
    ],
    mistakes: [
      'Rounding the lower back.',
      'Bending knees too much – it becomes a deadlift.',
      'Going lower than your flexibility allows.',
    ],
  },
  {
    i18nKey: 'exercise.russian_twists',
    primaryMuscleGroup: 'core',
    defaultName: 'Russian Twists',
    defaultDescription:
      'A rotational core exercise that targets the obliques and improves rotational strength and stability.',
    muscleGroups: ['core', 'abs', 'hipFlexors'],
    exerciseType: ExerciseType.BODYWEIGHT,
    equipment: [],
    instructions: [
      'Sit on the floor with knees bent, heels slightly off the ground.',
      'Lean back slightly, keeping back straight.',
      'Rotate torso side to side, touching the floor on each side.',
      'Hold a weight for added resistance.',
    ],
    proTips: [
      'The rotation should come from the torso, not the arms.',
      'Slow controlled reps are more effective than fast ones.',
      'Keep core braced throughout to protect the lower back.',
    ],
    mistakes: [
      'Rounding the lower back.',
      'Swinging arms without rotating the torso.',
      'Dropping heels to the floor – keep the tension.',
    ],
  },
  {
    i18nKey: 'exercise.straight_arm_pulldown',
    primaryMuscleGroup: 'back',
    defaultName: 'Straight-arm Pulldown',
    defaultDescription:
      'An isolation exercise targeting the lats without bicep involvement, as the arms remain straight throughout. Excellent for lat mind-muscle connection.',
    muscleGroups: ['back', 'rearDelts', 'triceps', 'core'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Cable machine', 'Straight bar or rope'],
    instructions: [
      'Stand with slight knee bend and torso leaning forward (~30–45°).',
      'Grip the bar with arms straight, slight elbow bend.',
      'Pull the bar down toward your hips in an arc motion.',
      'Feel maximum lat contraction at the bottom.',
      'Return slowly back up with a full stretch.',
    ],
    proTips: [
      'Think "clap hands against hips" as a movement cue.',
      'Keep core braced – avoid rocking the body.',
      'Rope attachment allows better range of motion than a straight bar.',
    ],
    mistakes: [
      'Bending elbows – it becomes a lat pulldown instead.',
      'Too much weight causing the straight arm position to break.',
      'Standing too upright – the lats cannot be fully utilized.',
    ],
  },
  {
    i18nKey: 'exercise.push_ups',
    primaryMuscleGroup: 'chest',
    defaultName: 'Push-ups',
    defaultDescription:
      'A fundamental bodyweight exercise with high functionality. Trains chest, triceps, and shoulders while requiring core stability. Easy to modify for all levels with no equipment needed.',
    muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
    exerciseType: ExerciseType.BODYWEIGHT,
    equipment: [],
    instructions: [
      'Start in a plank position, hands slightly wider than shoulder-width.',
      'Body in a straight line from head to heels – engage core.',
      'Lower chest toward the floor, elbows at ~45° from torso.',
      'Press back up to starting position.',
      'Fully extend arms at the top and protract shoulder blades.',
    ],
    proTips: [
      'Narrow grip = more tricep focus, wide grip = more chest focus.',
      'Elevated feet = upper chest emphasis, elevated hands = lower chest.',
      '2-second pause at the bottom adds difficulty without extra weight.',
    ],
    mistakes: [
      'Sagging hips or "worm" movement in the middle.',
      'Flaring elbows straight out.',
      'Partial range of motion to chase more reps.',
    ],
  },
  {
    i18nKey: 'exercise.tbar_row',
    primaryMuscleGroup: 'back',
    defaultName: 'T-bar Row',
    defaultDescription:
      'A compound back exercise performed with a T-bar or landmine setup. Allows heavy loading and is excellent for building overall back thickness and strength.',
    muscleGroups: ['back', 'traps', 'rearDelts', 'biceps', 'lowerBack', 'core'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['T-bar row machine or landmine attachment', 'Weight plates'],
    instructions: [
      'Stand over the bar, feet shoulder-width apart.',
      'Hinge at hips to ~45°, neutral back.',
      'Grip the handles and pull the bar toward your chest.',
      'Squeeze shoulder blades together at the top.',
      'Lower in a controlled manner to full arm extension.',
    ],
    proTips: [
      'Keep chest up and back flat throughout the movement.',
      'Drive elbows back rather than pulling with the arms.',
      'Use a closer grip for more lat involvement, wider for more upper back.',
    ],
    mistakes: [
      'Rounding the lower back under heavy load.',
      'Using momentum and body swing to lift the weight.',
      'Partial range of motion – full extension at the bottom.',
    ],
  },
];
