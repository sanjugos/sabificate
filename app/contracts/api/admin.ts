export interface BulkEnrollmentRequest {
  file: File;
  org_id: string;
}

export interface BulkEnrollmentResponse {
  job_id: string;
  status: 'processing';
  total_rows: number;
}

export interface BulkEnrollmentStatus {
  job_id: string;
  status: 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: BulkEnrollmentError[];
}

export interface BulkEnrollmentError {
  row: number;
  email: string;
  error: string;
}

export interface AdminDashboardOverview {
  total_learners: number;
  active_learners_30d: number;
  completion_rate: number;
  avg_assessment_score: number;
  total_learning_hours: number;
  courses_assigned: number;
}

export interface AdminLearnerRow {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  department: string | null;
  courses_enrolled: number;
  courses_completed: number;
  avg_score: number;
  total_hours: number;
  last_active_at: string | null;
}

export interface AdminCourseRow {
  course_id: string;
  title: string;
  enrolled: number;
  completed: number;
  completion_rate: number;
  avg_score: number;
}

export interface SeatOverview {
  plan_name: string;
  total_seats: number;
  used_seats: number;
  available_seats: number;
  departments: {
    department_id: string;
    name: string;
    allocated: number;
    used: number;
  }[];
}

export interface ITFReportRequest {
  start_date: string;
  end_date: string;
  department_id?: string;
}

export interface CPDReportRequest {
  start_date: string;
  end_date: string;
  professional_body: string;
}
