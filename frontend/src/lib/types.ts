export type UserRole = "student" | "assistant" | "lecturer" | "admin";

export interface User {
  id: number;
  full_name: string;
  nim_or_nip?: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface PracticumClass {
  id: number;
  name: string;
  course_code: string;
  class_code: string;
  schedule: string;
  room: string;
  semester: string;
  description: string;
  assistant_id: number;
  assistant_name: string;
  lecturer_name: string;
  enrolled_count: number;
  modules_count: number;
  is_enrolled: boolean;
}

export interface PracticumModule {
  id: number;
  class_id: number;
  class_name: string;
  course_code: string;
  title: string;
  meeting_number: number;
  description: string;
  instructions: string;
  allowed_extensions: string;
  max_size_mb: number;
  deadline: string;
  status: "active" | "closed" | "draft";
  submissions_count: number;
}

export interface Submission {
  id: number;
  module_id: number;
  module_title: string;
  class_id: number;
  class_name: string;
  student_id: number;
  student_name: string;
  student_nim: string;
  file_name: string;
  file_size_bytes: number;
  notes: string;
  status: "submitted" | "graded";
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

export interface SystemLog {
  id: number;
  level: string;
  service: string;
  message: string;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database: string;
  db_latency_ms: number;
  uptime_seconds: number;
  storage: {
    file_count: number;
    used_bytes: number;
    used_mb: number;
    quota_mb: number;
  };
  timestamp: string;
}
