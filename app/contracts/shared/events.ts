export interface EnrollmentCreatedEvent {
  user_id: string;
  course_id: string;
  org_id: string | null;
  enrollment_type: 'individual' | 'corporate' | 'invitation';
}

export interface LessonCompletedEvent {
  user_id: string;
  lesson_id: string;
  course_id: string;
  completion_percent: number;
}

export interface CourseCompletedEvent {
  user_id: string;
  course_id: string;
  final_score: number;
}

export interface PaymentSucceededEvent {
  user_id: string;
  subscription_id: string;
  plan_id: string;
}

export interface CredentialIssuedEvent {
  user_id: string;
  credential_id: string;
  course_title: string;
}

export interface PipelineCourseReadyEvent {
  course_package_path: string;
  validation_report: {
    passed: boolean;
    issues: string[];
    bloom_distribution: Record<string, number>;
  };
}

export interface CsvEnrollmentUploadedEvent {
  job_id: string;
  file_path: string;
  org_id: string;
  admin_user_id: string;
}

export const QUEUE_NAMES = {
  ENROLLMENT_CREATED: 'enrollment.created',
  LESSON_COMPLETED: 'lesson.completed',
  COURSE_COMPLETED: 'course.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  CREDENTIAL_ISSUED: 'credential.issued',
  WHATSAPP_QUIZ_COMPLETED: 'whatsapp.quiz.completed',
  PIPELINE_COURSE_READY: 'pipeline.course.ready',
  CSV_ENROLLMENT_UPLOADED: 'csv.enrollment.uploaded',
} as const;
