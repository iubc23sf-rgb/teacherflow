// Supabase スキーマに対応する型定義（supabase/schema.sql と対応）
// 本番では `supabase gen types typescript` で自動生成に置き換え可能

export type Priority = 1 | 2 | 3; // 1:高 2:中 3:低
export type TaskStatus = "open" | "done";
export type TaskSource = "manual" | "pdf" | "ai" | "calendar";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  due_date: string | null;
  priority: Priority;
  status: TaskStatus;
  source: TaskSource;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
}

export interface ClassGroup {
  id: string;
  user_id: string;
  name: string;
  grade: string | null;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  google_event_id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
}

export interface TimetableSlot {
  id: string;
  timetable_id: string;
  day_of_week: number; // 0-4 (月-金)
  period: number; // 1-7
  subject_id: string | null;
  class_id: string | null;
  room: string | null;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  subject_id: string | null;
  class_id: string | null;
  unit_name: string;
  planned_hours: number;
  completed_hours: number;
  target_test_date: string | null;
  notes: string | null;
}

// Database 型（@supabase/ssr のジェネリクス用の簡易プレースホルダ）
export type Database = any;
