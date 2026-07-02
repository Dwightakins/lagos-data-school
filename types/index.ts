export type UserRole = "student" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  student_id?: string;
  notification_prefs?: NotificationPrefs;
  created_at: string;
  updated_at: string;
}

export interface NotificationPrefs {
  new_lessons: boolean;
  course_updates: boolean;
  assignment_deadlines: boolean;
  scholarship_updates: boolean;
  weekly_report: boolean;
  marketing: boolean;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  duration?: string;
  cover_image_url?: string;
  thumbnail_url?: string;
  published: boolean;
  created_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content?: string;
  video_url?: string;
  duration_minutes?: number;
  order_index: number;
  is_preview: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  payment_reference?: string;
  payment_status: "pending" | "paid" | "failed";
  status: string;
  type: string;
  enrolled_at: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  certificate_number?: string;
  issued_at: string;
  pdf_url?: string;
}

export interface ScholarshipApplication {
  id: string;
  user_id: string;
  course_id: string;
  course_name: string;
  status: "pending" | "approved" | "rejected";
  payment_reference?: string;
  amount_paid?: number;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  reference: string;
  status: string;
  provider: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface LessonBookmark {
  id: string;
  user_id: string;
  lesson_id: string;
  created_at: string;
}

export interface CourseNote {
  id: string;
  user_id: string;
  lesson_id: string;
  note_text: string;
  video_timestamp?: number;
  created_at: string;
  updated_at: string;
}

export interface LessonMaterial {
  id: string;
  lesson_id?: string;
  course_id?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  visible_to_all?: boolean;
  created_at: string;
  lessons?: { title: string } | null;
}

export interface LessonComment {
  id: string;
  lesson_id: string;
  user_id: string;
  parent_id?: string;
  comment_text: string;
  upvotes: number;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  course_id?: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses?: number;
  used_count: number;
  applies_to: string;
  course_id?: string;
  expires_at?: string;
  active: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  target: string;
  course_id?: string;
  send_email: boolean;
  send_notif: boolean;
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface Quiz {
  id: string;
  module_id?: string;
  course_id: string;
  title: string;
  passing_score: number;
  time_limit?: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer";
  options?: Array<{ text: string; correct: boolean }>;
  correct_answer?: string;
  points: number;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: unknown[];
  score?: number;
  passed?: boolean;
  completed_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  lesson_id?: string;
  module_id?: string;
  title: string;
  instructions: string;
  due_date?: string;
  points_possible: number;
  submission_type: "file" | "text" | "url";
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  file_url?: string;
  text_content?: string;
  url_content?: string;
  score?: number;
  feedback?: string;
  graded_at?: string;
  submitted_at: string;
}

export interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  html_body: string;
  updated_at: string;
}

export interface EnrolledCourse {
  enrollmentId: string;
  courseId: string;
  title: string;
  coverImage: string | null;
  slug: string;
  enrolledAt: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export interface ActivityItem {
  id: string;
  lessonTitle: string;
  courseName: string;
  completedAt: string;
}

