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
  i18nKey: string;
  defaultName: string;
  defaultDescription: string;
  muscleGroups: string[];
  primaryMuscleGroup?: string;
  exerciseType?: ExerciseType;
  equipment?: string[];
  instructions?: string[];
  proTips?: string[];
  mistakes?: string[];
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
      'Avoid lowering beyond a comfortable shoulder range.',
      'Do not let the elbows flare straight out to the sides.',
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
      'Lead with the elbows and keep thumbs neutral or slightly up.',
      'Use lighter weights with strict form for better isolation.',
      'Stop around shoulder height and control the lowering phase.',
    ],
    mistakes: [
      'Do not swing the weights – use controlled force.',
      'Avoid turning the thumbs downward aggressively at the top.',
      'Do not shrug the shoulders to lift the weight.',
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
      'Lower as deep as you can control without the pelvis lifting or rounding.',
      'Press back up without aggressively locking the knees.',
    ],
    proTips: [
      'Place feet higher for more glute focus, lower for more quad focus.',
      'Press through the entire foot, not just the toes.',
    ],
    mistakes: [
      'Do not let the pelvis tilt up – keep glutes in the seat.',
      'Avoid bouncing out of the bottom position.',
      'Do not aggressively lock the knees at the top position.',
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
      'Do not kick the weight up with momentum.',
      'Avoid snapping the knees aggressively into lockout.',
      'Do not let your hips lift from the seat.',
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
      'Do not let the front knee collapse inward.',
      'Avoid pushing off primarily with the rear leg.',
      'Do not lose balance or let the front heel lift from the floor.',
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
    i18nKey: 'exercise.face_pull',
    primaryMuscleGroup: 'rearDelts',
    defaultName: 'Face Pull',
    defaultDescription:
      'Rope at face height. Use light to moderate weight, pull toward nose/forehead with external rotation, and control the return.',
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
      'Use lighter weight and higher reps – this is not a max-strength exercise.',
      'Focus on external rotation – thumbs should point backward at the end position.',
      'Pause briefly at the end position and squeeze the rear delts.',
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
  {
    i18nKey: 'exercise.cable_lateral_raise',
    primaryMuscleGroup: 'shoulders',
    defaultName: 'Cable Lateral Raise',
    defaultDescription:
      'Lateral raise using a low cable pulley. Provides constant tension through the side delts with strict control.',
    muscleGroups: ['shoulders'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Cable machine', 'Single handle'],
    instructions: [
      'Set the cable pulley to the lowest position.',
      'Stand side-on to the cable with the handle in the outside hand.',
      'Keep a soft bend in the elbow and raise the arm out to the side.',
      'Lift to around shoulder height without shrugging.',
      'Lower slowly under control.',
    ],
    proTips: [
      'Lead with the elbow, not the hand.',
      'Keep the shoulder down and avoid shrugging.',
      'Use lighter weight and strict form.',
    ],
    mistakes: [
      'Do not swing the body to start the movement.',
      'Do not lift far above shoulder height.',
      'Avoid turning the thumb aggressively downward at the top.',
    ],
  },
  {
    i18nKey: 'exercise.machine_chest_press',
    primaryMuscleGroup: 'chest',
    defaultName: 'Machine Chest Press',
    defaultDescription:
      'Stable machine press for the chest. Good for controlled hypertrophy work with less setup than barbell bench press.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Chest press machine'],
    instructions: [
      'Adjust the seat so the handles are around mid-chest height.',
      'Sit with your upper back firmly against the pad.',
      'Grip the handles and keep shoulder blades slightly retracted.',
      'Press forward until arms are extended without locking aggressively.',
      'Return slowly until you feel a controlled chest stretch.',
    ],
    proTips: [
      'Keep wrists stacked over elbows.',
      'Control the eccentric phase for 2–3 seconds.',
      'Use this as a safer high-volume alternative to bench press.',
    ],
    mistakes: [
      'Do not let shoulders roll forward at the bottom.',
      'Avoid bouncing out of the stretched position.',
      'Do not lift your back off the pad.',
    ],
  },
  {
    i18nKey: 'exercise.machine_shoulder_press',
    primaryMuscleGroup: 'shoulders',
    defaultName: 'Machine Shoulder Press',
    defaultDescription:
      'Stable vertical pressing movement for the shoulders. Useful for progressive overload with less balance demand than dumbbells.',
    muscleGroups: ['shoulders', 'triceps', 'upperChest'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Shoulder press machine'],
    instructions: [
      'Adjust the seat so the handles start around shoulder height.',
      'Sit with your back against the pad and feet flat on the floor.',
      'Brace your core and press the handles upward.',
      'Stop just short of aggressive lockout.',
      'Lower under control to the starting position.',
    ],
    proTips: [
      'Keep ribs down and avoid excessive lower-back arch.',
      'Use a controlled tempo instead of bouncing.',
      'Keep elbows slightly in front of the body if the machine allows it.',
    ],
    mistakes: [
      'Do not turn it into an incline chest press by leaning back too far.',
      'Avoid shrugging at the top.',
      'Do not use momentum from the legs or torso.',
    ],
  },
  {
    i18nKey: 'exercise.reverse_pec_deck',
    primaryMuscleGroup: 'rearDelts',
    defaultName: 'Reverse Pec Deck',
    defaultDescription:
      'Machine reverse fly targeting the rear delts and upper back. A stable alternative to face pulls.',
    muscleGroups: ['rearDelts', 'traps', 'back'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Reverse pec deck machine'],
    instructions: [
      'Adjust the seat so the handles are around shoulder height.',
      'Sit facing the machine with chest against the pad.',
      'Grip the handles with a neutral or pronated grip.',
      'Pull the handles outward and backward in a wide arc.',
      'Pause briefly, then return slowly.',
    ],
    proTips: [
      'Think about moving the elbows outward, not pulling with the hands.',
      'Use light to moderate weight and strict form.',
      'Keep traps relaxed to target rear delts better.',
    ],
    mistakes: [
      'Do not shrug the shoulders during the movement.',
      'Avoid swinging or bouncing the handles.',
      'Do not use a range of motion that causes shoulder pain.',
    ],
  },
  {
    i18nKey: 'exercise.cable_crunch',
    primaryMuscleGroup: 'abs',
    defaultName: 'Cable Crunch',
    defaultDescription:
      'Weighted abdominal crunch using a cable. Allows progressive overload for the abs.',
    muscleGroups: ['abs', 'core'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Cable machine', 'Rope'],
    instructions: [
      'Attach a rope to a high cable pulley.',
      'Kneel facing the cable and hold the rope near your head.',
      'Round your upper back by contracting the abs.',
      'Crunch downward toward your knees.',
      'Return slowly without letting the hips take over.',
    ],
    proTips: [
      'Think about bringing ribs toward pelvis.',
      'Keep hips mostly fixed throughout the movement.',
      'Progress the weight like any other muscle-building exercise.',
    ],
    mistakes: [
      'Do not turn it into a hip hinge.',
      'Avoid pulling with the arms.',
      'Do not use momentum to swing the torso down.',
    ],
  },
  {
    i18nKey: 'exercise.assisted_pull_up_machine',
    primaryMuscleGroup: 'back',
    defaultName: 'Assisted Pull-up Machine',
    defaultDescription:
      'Pull-up variation using machine assistance. Good for building strength toward bodyweight pull-ups.',
    muscleGroups: ['back', 'biceps', 'rearDelts', 'core'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Assisted pull-up machine'],
    instructions: [
      'Set the assistance weight to an appropriate level.',
      'Grip the handles slightly wider than shoulder-width.',
      'Place knees or feet on the assistance platform.',
      'Pull yourself up until your chin approaches the handles/bar.',
      'Lower under control to full arm extension.',
    ],
    proTips: [
      'Reduce assistance gradually as you get stronger.',
      'Think elbows down toward your hips.',
      'Control the lowering phase.',
    ],
    mistakes: [
      'Do not bounce off the assistance platform.',
      'Avoid shrugging at the top.',
      'Do not cut the range of motion short.',
    ],
  },
  {
    i18nKey: 'exercise.hack_squat_machine',
    primaryMuscleGroup: 'quads',
    defaultName: 'Hack Squat Machine',
    defaultDescription:
      'Machine squat variation with back support. Excellent for quad-focused leg training without needing a barbell squat.',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Hack squat machine'],
    instructions: [
      'Place your back against the pad and shoulders under the supports.',
      'Set feet around shoulder-width on the platform.',
      'Unlock the safety handles.',
      'Lower under control as deep as you can while keeping heels down.',
      'Press back up through the mid-foot without bouncing.',
    ],
    proTips: [
      'Lower foot placement increases quad focus.',
      'Control the bottom position instead of bouncing.',
      'Use this as a primary leg movement if you dislike barbell squats.',
    ],
    mistakes: [
      'Do not let knees collapse inward.',
      'Avoid lifting heels from the platform.',
      'Do not aggressively lock the knees at the top.',
    ],
  },
  {
    i18nKey: 'exercise.hip_thrust_machine',
    primaryMuscleGroup: 'glutes',
    defaultName: 'Hip Thrust Machine',
    defaultDescription:
      'Machine-based hip thrust for glutes. Easier setup than barbell hip thrust and good for progressive overload.',
    muscleGroups: ['glutes', 'hamstrings'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Hip thrust machine'],
    instructions: [
      'Sit in the machine with the pad placed securely across the hips.',
      'Place feet around shoulder-width with knees bent.',
      'Brace your core and drive through the heels.',
      'Extend hips upward until the glutes are fully contracted.',
      'Lower under control to the starting position.',
    ],
    proTips: [
      'Posteriorly tilt the pelvis at the top to avoid lower-back extension.',
      'Pause briefly at lockout and squeeze the glutes.',
      'Adjust foot position until you feel glutes more than lower back.',
    ],
    mistakes: [
      'Do not hyperextend the lower back at the top.',
      'Avoid pushing mainly through the toes.',
      'Do not let the knees cave inward.',
    ],
  },
  {
    i18nKey: 'exercise.lying_leg_curl',
    primaryMuscleGroup: 'hamstrings',
    defaultName: 'Lying Leg Curl',
    defaultDescription:
      'Hamstring curl performed lying face down. Good isolation movement for the hamstrings.',
    muscleGroups: ['hamstrings'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Lying leg curl machine'],
    instructions: [
      'Lie face down on the machine with the pad above your heels.',
      'Keep hips pressed into the pad.',
      'Curl your heels toward your glutes.',
      'Pause briefly at the top.',
      'Lower slowly to the starting position.',
    ],
    proTips: [
      'Control the eccentric phase for 2–3 seconds.',
      'Keep hips down throughout the movement.',
      'Use full range of motion.',
    ],
    mistakes: [
      'Do not lift the hips from the pad.',
      'Avoid swinging the weight up.',
      'Do not cut the bottom range short.',
    ],
  },
  {
    i18nKey: 'exercise.back_extension',
    primaryMuscleGroup: 'lowerBack',
    defaultName: 'Back Extension',
    defaultDescription:
      'Hip-hinge based bodyweight or weighted extension targeting lower back, glutes and hamstrings.',
    muscleGroups: ['lowerBack', 'glutes', 'hamstrings', 'core'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Back extension bench'],
    instructions: [
      'Set the pad so your hips can hinge freely.',
      'Cross arms over chest or hold a weight plate.',
      'Lower your torso under control.',
      'Extend back up by driving hips into the pad.',
      'Stop when your body forms a straight line.',
    ],
    proTips: [
      'Think hip hinge, not spinal hyperextension.',
      'Squeeze glutes at the top.',
      'Add weight only when bodyweight reps are controlled.',
    ],
    mistakes: [
      'Do not overextend the lower back at the top.',
      'Avoid fast bouncing reps.',
      'Do not round aggressively at the bottom.',
    ],
  },
  {
    i18nKey: 'exercise.pec_deck',
    primaryMuscleGroup: 'chest',
    defaultName: 'Pec Deck',
    defaultDescription:
      'Machine chest fly that isolates the chest with a stable movement path.',
    muscleGroups: ['chest'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Pec deck machine'],
    instructions: [
      'Adjust the seat so the handles are around chest height.',
      'Sit with back against the pad.',
      'Grip the handles with a slight bend in the elbows.',
      'Bring the handles together in front of the chest.',
      'Return slowly until you feel a controlled chest stretch.',
    ],
    proTips: [
      'Keep shoulders down and back.',
      'Pause briefly when hands come together.',
      'Use controlled reps instead of heavy momentum.',
    ],
    mistakes: [
      'Do not let shoulders roll forward.',
      'Avoid overstretching at the bottom.',
      'Do not slam the handles together.',
    ],
  },
  {
    i18nKey: 'exercise.ab_crunch_machine',
    primaryMuscleGroup: 'abs',
    defaultName: 'Ab Crunch Machine',
    defaultDescription:
      'Machine-based abdominal crunch that allows easy progressive overload.',
    muscleGroups: ['abs', 'core'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Ab crunch machine'],
    instructions: [
      'Adjust the seat and pads to fit your torso.',
      'Hold the handles or position arms as instructed by the machine.',
      'Crunch by bringing ribs toward pelvis.',
      'Pause briefly in the contracted position.',
      'Return slowly without losing tension.',
    ],
    proTips: [
      'Move through the abs, not the arms.',
      'Use a controlled tempo and full contraction.',
      'Progress weight gradually over time.',
    ],
    mistakes: [
      'Do not yank the handles with your arms.',
      'Avoid using momentum.',
      'Do not let the lower back take over the movement.',
    ],
  },
  {
    i18nKey: 'exercise.smith_machine_bench_press',
    primaryMuscleGroup: 'chest',
    defaultName: 'Smith Machine Bench Press',
    defaultDescription:
      'A stable machine-based bench press variation using a fixed bar path. Useful for controlled chest training without needing a spotter.',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Smith machine', 'Flat bench'],
    instructions: [
      'Place a flat bench centered under the Smith machine bar.',
      'Lie down with the bar positioned over your mid-chest.',
      'Grip slightly wider than shoulder-width.',
      'Unlock the bar and lower it under control to your chest.',
      'Press back up without aggressively locking the elbows.',
    ],
    proTips: [
      'Use this as a stable alternative to barbell bench press.',
      'Keep shoulder blades retracted throughout the set.',
      'Control the lowering phase for better chest tension.',
    ],
    mistakes: [
      'Do not bounce the bar off your chest.',
      'Avoid letting shoulders roll forward at the bottom.',
      'Do not set the bench too far forward or backward under the bar.',
    ],
  },
  {
    i18nKey: 'exercise.smith_machine_incline_press',
    primaryMuscleGroup: 'upperChest',
    defaultName: 'Smith Machine Incline Press',
    defaultDescription:
      'Incline press using a Smith machine. A stable upper-chest pressing option that is easier to set up than free-weight barbell incline press.',
    muscleGroups: ['chest', 'upperChest', 'shoulders', 'triceps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Smith machine', 'Incline bench'],
    instructions: [
      'Set an incline bench to around 30 degrees.',
      'Position the bench so the bar lowers toward the upper chest.',
      'Grip the bar slightly wider than shoulder-width.',
      'Unlock the bar and lower it under control.',
      'Press upward until arms are extended without aggressive lockout.',
    ],
    proTips: [
      'A 30 degree incline is usually enough for upper-chest focus.',
      'Keep elbows slightly tucked instead of flared straight out.',
      'Use a controlled tempo and consistent bar path.',
    ],
    mistakes: [
      'Do not set the bench too steep, as it shifts load to the shoulders.',
      'Avoid bouncing from the chest.',
      'Do not let the wrists bend backward excessively.',
    ],
  },
  {
    i18nKey: 'exercise.chest_supported_machine_row',
    primaryMuscleGroup: 'back',
    defaultName: 'Chest-supported Machine Row',
    defaultDescription:
      'Machine row with chest support. Great for building back thickness while minimizing lower-back fatigue.',
    muscleGroups: ['back', 'traps', 'rearDelts', 'biceps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Chest-supported row machine'],
    instructions: [
      'Adjust the seat so the handles are around lower-chest level.',
      'Sit with chest firmly against the pad.',
      'Grip the handles and start with arms extended.',
      'Pull the handles toward your torso by driving elbows back.',
      'Squeeze your shoulder blades briefly, then return slowly.',
    ],
    proTips: [
      'Think about pulling with elbows, not hands.',
      'Keep chest glued to the pad throughout the set.',
      'Use this when you want hard back work without stressing the lower back.',
    ],
    mistakes: [
      'Do not lift your chest from the pad.',
      'Avoid shrugging the shoulders up during the pull.',
      'Do not use momentum to jerk the handles backward.',
    ],
  },
  {
    i18nKey: 'exercise.cable_row_wide_grip',
    primaryMuscleGroup: 'back',
    defaultName: 'Cable Row Wide Grip',
    defaultDescription:
      'Seated cable row using a wide grip. Emphasizes upper back, rear delts, rhomboids and mid traps more than a narrow neutral grip.',
    muscleGroups: ['back', 'rearDelts', 'traps', 'biceps'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Cable machine', 'Wide row handle'],
    instructions: [
      'Sit at the cable row station with feet supported.',
      'Grip the wide handle with an overhand grip.',
      'Sit tall with a neutral spine and chest up.',
      'Pull the handle toward your upper abdomen or lower chest.',
      'Control the return until arms are extended.',
    ],
    proTips: [
      'Drive elbows out and back to target the upper back.',
      'Keep torso mostly still throughout the movement.',
      'Use a slightly lighter weight than narrow-grip rows.',
    ],
    mistakes: [
      'Do not turn it into a lower-back swing.',
      'Avoid pulling too high toward the neck.',
      'Do not let shoulders roll forward aggressively at the stretch.',
    ],
  },
  {
    i18nKey: 'exercise.preacher_curl_machine',
    primaryMuscleGroup: 'biceps',
    defaultName: 'Preacher Curl Machine',
    defaultDescription:
      'Machine curl with upper arms supported on a preacher pad. Excellent for strict biceps isolation and controlled progression.',
    muscleGroups: ['biceps', 'forearms'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Preacher curl machine'],
    instructions: [
      'Adjust the seat so your upper arms rest fully on the pad.',
      'Grip the handles with palms facing upward.',
      'Curl the handles upward by contracting the biceps.',
      'Pause briefly near the top.',
      'Lower slowly until the arms are almost fully extended.',
    ],
    proTips: [
      'Keep upper arms fixed against the pad.',
      'Use full range of motion without relaxing at the bottom.',
      'Control the eccentric phase for 2–3 seconds.',
    ],
    mistakes: [
      'Do not lift your elbows off the pad.',
      'Avoid using momentum to start the curl.',
      'Do not hyperextend the elbows at the bottom.',
    ],
  },
  {
    i18nKey: 'exercise.cable_curl',
    primaryMuscleGroup: 'biceps',
    defaultName: 'Cable Curl',
    defaultDescription:
      'Biceps curl using a low cable pulley. Provides constant tension through the full range of motion.',
    muscleGroups: ['biceps', 'forearms'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Cable machine', 'Straight bar or rope'],
    instructions: [
      'Set the cable pulley to the lowest position.',
      'Stand facing the machine and grip the attachment.',
      'Keep elbows close to your sides.',
      'Curl the attachment upward by contracting the biceps.',
      'Lower slowly back to the starting position.',
    ],
    proTips: [
      'Keep elbows still throughout the movement.',
      'Use a straight bar for heavier loading or a rope for wrist comfort.',
      'Pause briefly at the top for a stronger contraction.',
    ],
    mistakes: [
      'Do not lean back to move the weight.',
      'Avoid letting elbows drift forward.',
      'Do not let the weight stack slam down between reps.',
    ],
  },
  {
    i18nKey: 'exercise.rope_overhead_triceps_extension',
    primaryMuscleGroup: 'triceps',
    defaultName: 'Rope Overhead Triceps Extension',
    defaultDescription:
      'Cable triceps extension performed overhead with a rope. Emphasizes the long head of the triceps through a deep stretch.',
    muscleGroups: ['triceps'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Cable machine', 'Rope'],
    instructions: [
      'Attach a rope to a low or mid-height cable pulley.',
      'Face away from the machine and bring the rope overhead.',
      'Keep elbows pointing forward and close to the head.',
      'Extend the arms until the triceps are fully contracted.',
      'Lower slowly until you feel a stretch in the triceps.',
    ],
    proTips: [
      'Keep ribs down and core braced.',
      'Let the elbows bend deeply for a good triceps stretch.',
      'Separate the rope ends slightly at the top.',
    ],
    mistakes: [
      'Do not flare elbows far out to the sides.',
      'Avoid arching the lower back to move the weight.',
      'Do not turn it into a shoulder movement.',
    ],
  },
  {
    i18nKey: 'exercise.bulgarian_split_squat',
    primaryMuscleGroup: 'quads',
    defaultName: 'Bulgarian Split Squat',
    defaultDescription:
      'Single-leg squat variation with the rear foot elevated. Builds quads, glutes, balance and unilateral leg strength.',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'core'],
    exerciseType: ExerciseType.COMPOUND,
    equipment: ['Bench', 'Dumbbells optional'],
    instructions: [
      'Stand a short step in front of a bench.',
      'Place the rear foot on the bench behind you.',
      'Keep the front foot planted firmly on the floor.',
      'Lower under control until the front knee is deeply bent.',
      'Drive through the front foot to return to standing.',
    ],
    proTips: [
      'Use bodyweight first before adding dumbbells.',
      'A longer stance shifts more focus to glutes.',
      'A more upright torso usually increases quad focus.',
    ],
    mistakes: [
      'Do not push mainly through the rear leg.',
      'Avoid letting the front knee collapse inward.',
      'Do not bounce out of the bottom position.',
    ],
  },
  {
    i18nKey: 'exercise.adductor_machine',
    primaryMuscleGroup: 'adductors',
    defaultName: 'Adductor Machine',
    defaultDescription:
      'Machine exercise targeting the inner thigh muscles. Useful for hip stability and balanced lower-body development.',
    muscleGroups: ['adductors'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Adductor machine'],
    instructions: [
      'Sit in the machine with your back against the pad.',
      'Place legs against the pads in the starting position.',
      'Bring the legs together by squeezing the inner thighs.',
      'Pause briefly in the contracted position.',
      'Return slowly to the starting position.',
    ],
    proTips: [
      'Use controlled reps and avoid rushing.',
      'Train through a comfortable range of motion.',
      'Pause briefly when the legs come together.',
    ],
    mistakes: [
      'Do not use momentum or bounce the pads.',
      'Avoid forcing an excessive stretch.',
      'Do not let your hips lift from the seat.',
    ],
  },
  {
    i18nKey: 'exercise.abductor_machine',
    primaryMuscleGroup: 'abductors',
    defaultName: 'Abductor Machine',
    defaultDescription:
      'Machine exercise targeting the outer hip and glute medius. Useful for hip stability, glute development and lower-body balance.',
    muscleGroups: ['abductors', 'glutes'],
    exerciseType: ExerciseType.ISOLATION,
    equipment: ['Abductor machine'],
    instructions: [
      'Sit in the machine with your back against the pad.',
      'Place legs against the inside of the pads.',
      'Push the legs outward under control.',
      'Pause briefly in the open position.',
      'Return slowly without letting the weight stack slam.',
    ],
    proTips: [
      'Lean slightly forward if it helps you feel the glutes better.',
      'Use moderate to high reps with strict control.',
      'Keep tension throughout the full set.',
    ],
    mistakes: [
      'Do not bounce the weight.',
      'Avoid using a range of motion that causes hip discomfort.',
      'Do not let the torso rock back and forth.',
    ],
  },
];
