export type UserRole = "student" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number; // in Naira (kobo for Paystack)
  cover_image_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  payment_reference?: string;
  payment_status: "pending" | "paid" | "failed";
  enrolled_at: string;
}

export interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  issued_at: string;
  pdf_url?: string;
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
  created_at: string;
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
