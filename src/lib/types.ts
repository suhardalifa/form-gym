export type Muscle = {
  id: string; name: string; slug: string; description: string; function: string; focus: string
}
export type Exercise = {
  id: string; name: string; muscle_group_id: string | null; description: string;
  instructions: string[]; equipment: string; difficulty: string; video_url: string | null;
  video_provider: string | null; muscles?: Muscle | null
}
export type PlanDay = { id: string; day_of_week: number; is_rest_day: boolean; title: string; exercises?: PlanExercise[] }
export type PlanExercise = { id: string; exercise_id: string; order_index: number; target_sets: number; target_reps: string; exercise?: Exercise }
export type Session = { id: string; performed_at: string; notes: string | null; duration_minutes: number | null }
export type SetLog = { id: string; set_number: number; weight_kg: number; reps: number; exercise_name?: string }
export const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
