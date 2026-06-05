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
