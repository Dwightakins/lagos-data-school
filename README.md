# 🎓 Lagos Data School Limited — Learning Management Platform

> Nigeria's professional tech and data skills academy. A full-stack LMS built with Next.js 14, Supabase, and ALAT Pay — training the next generation of Nigerian tech professionals.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss)
![ALAT Pay](https://img.shields.io/badge/ALATPay-Payments-red?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)

---

## 📌 Overview

Lagos Data School Limited is a production-grade Learning Management System (LMS) built specifically for the Nigerian market. It combines professional tech education with a scholarship-first access model — making world-class data, AI, and software engineering training accessible to every motivated student regardless of financial background.

The platform operates as a complete product with two enrollment paths:

- **Full Enrollment** — Students pay the full course fee (₦250,000) and get immediate access
- **Scholarship Programme** — Students apply, get approved by admin, and pay only ₦15,000 (94% off)

---

## ✨ Features

### 🎯 Student Experience
- Browse and enroll in professional tech courses
- Attend live instructor-led Zoom sessions
- Watch pre-recorded lessons 24/7 from their dashboard
- Track learning progress with visual progress bars
- Submit assignments and receive graded feedback
- Take module quizzes with instant results
- Download verified PDF certificates on course completion
- Apply for 94% scholarship with a simple online form
- Manage profile, payment history, and course materials
- In-app messaging with the admin team
- Downloadable receipts for all payments

### 🛠️ Admin Control Panel
- Full course builder — create courses, modules, lessons, quizzes, and assignments
- Student roster with search, filter, and bulk action support
- Scholarship application review — approve or reject with automated emails
- Revenue reports with charts, breakdowns, and CSV export
- Announcement system for broadcasting to all students or specific courses
- Certificate issuance and revocation management
- Customizable email templates
- Coupon and discount code management
- Instructor role management
- Contact form message inbox
- Real-time dashboard with live stats and activity feed

### 🔐 Security and Architecture
- Row Level Security (RLS) on all Supabase tables
- Middleware protection for student and admin routes
- Email verification required before dashboard access
- Login rate limiting — 5 attempts, 5-minute lockout
- HMAC webhook signature verification for payments
- All database mutations through server-side API routes
- Environment variables never exposed to the browser
- Duplicate payment prevention with idempotency checks
- Unique scholarship payment tokens that expire after 7 days

### 💳 Payments — Nigerian Market
- ALAT Pay integration by Wema Bank
- Supports NGN payments via card, bank transfer, and USSD
- Full-pay and scholarship payment flows
- Webhook-verified enrollment — no payment fraud possible
- Automated enrollment after confirmed payment
- Professional payment receipts generated as PDF

### 📜 Certificate Engine
- Auto-generated branded PDF certificates using jsPDF
- Unique Student ID format — LDSL/DA/001
- Public verification endpoint — no login required
- Auto-emailed to students on course completion
- Admin can manually issue or revoke certificates

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | Full-stack React framework |
| Language | TypeScript 5.x | Type-safe development |
| Styling | Tailwind CSS + shadcn/ui | UI components and design system |
| Animations | Framer Motion + Aceternity UI | Page and component animations |
| Database | PostgreSQL via Supabase | Primary data store |
| Auth | Supabase Auth | Email/password authentication |
| Payments | ALAT Pay by Wema Bank | NGN payments and webhooks |
| Email | Resend | Transactional email delivery |
| File Storage | Supabase Storage | Course materials and certificates |
| PDF Generation | jsPDF | Certificates and payment receipts |
| Deployment | Vercel | Global edge deployment |

---

## 📁 Project Structure

```
lagos-data-school/
├── app/
│   ├── (auth)/              # Login, register, password reset
│   ├── (admin)/             # Admin panel pages
│   │   └── admin/
│   │       ├── page.tsx     # Admin dashboard with live stats
│   │       ├── courses/     # Course builder and management
│   │       ├── students/    # Student roster and management
│   │       ├── scholarships/# Scholarship review and approval
│   │       ├── revenue/     # Revenue reports and analytics
│   │       ├── certificates/# Certificate issuance and revocation
│   │       ├── announcements/
│   │       ├── coupons/
│   │       ├── email-templates/
│   │       ├── instructors/
│   │       ├── messages/
│   │       └── settings/
│   ├── (student)/           # Student dashboard pages
│   │   └── dashboard/
│   │       ├── page.tsx     # Student home
│   │       ├── courses/     # Enrolled courses
│   │       ├── settings/    # Profile management
│   │       ├── certificates/# Earned certificates
│   │       ├── payments/    # Payment history and receipts
│   │       ├── notifications/
│   │       ├── progress/
│   │       ├── materials/
│   │       ├── bookmarks/
│   │       ├── notes/
│   │       ├── messages/
│   │       └── support/
│   ├── api/                 # Server-side API routes
│   │   ├── alatpay/        # Payment initialization and webhook
│   │   ├── admin/          # Admin-only routes
│   │   ├── certificates/   # Certificate generation
│   │   ├── contact/        # Contact form handler
│   │   ├── materials/      # File management
│   │   ├── messages/       # Messaging system
│   │   ├── profile/        # Profile updates
│   │   └── scholarship/    # Scholarship application and approval
│   ├── apply-scholarship/   # Public scholarship application
│   ├── courses/             # Public course catalogue
│   ├── learn/               # LMS learning interface
│   ├── verify/              # Public certificate verification
│   ├── contact/             # Contact page
│   ├── about/               # About page
│   └── pricing/             # Pricing page
├── components/
│   ├── layout/              # Navbar, footer, logo
│   ├── home/                # Homepage sections
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── supabase/            # Supabase client files
│   ├── emails/              # Resend email templates
│   └── api-auth.ts          # requireAdmin() helper
├── types/
│   └── index.ts             # TypeScript type definitions
├── public/
│   └── images/              # Logo, hero, course images
├── supabase/
│   └── migrations/          # SQL migration files
└── CLAUDE.md                # AI development context
```

---

## 🗄️ Database Schema

The platform uses 20+ PostgreSQL tables with Row Level Security on all of them:

`users` · `courses` · `modules` · `lessons` · `enrollments` · `payments` · `scholarship_applications` · `lesson_progress` · `certificates` · `notifications` · `messages` · `contact_messages` · `course_notes` · `lesson_bookmarks` · `lesson_materials` · `lesson_comments` · `coupons` · `announcements` · `support_tickets` · `exams` · `exam_questions` · `exam_attempts` · `assignments` · `submissions`

---

## 📡 Key API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new student |
| `/api/alatpay/initialize` | POST | Initialize payment |
| `/api/alatpay/webhook` | POST | Verify payment and grant access |
| `/api/scholarship/apply` | POST | Submit scholarship application |
| `/api/scholarship/decision` | POST | Approve or reject application |
| `/api/progress` | POST | Mark lesson complete |
| `/api/certificates/generate` | POST | Generate PDF certificate |
| `/api/admin/stats` | GET | Platform analytics |
| `/api/contact` | POST | Contact form submission |
| `/api/messages` | GET/POST | Messaging system |

---

## 🗺️ Key Routes

### Public
| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/courses` | Course catalogue |
| `/courses/[slug]` | Course detail page |
| `/apply-scholarship` | Scholarship application |
| `/verify/[certId]` | Certificate verification |
| `/pricing` | Pricing page |
| `/about` | About us |
| `/contact` | Contact form |

### Student (Login Required)
| Route | Description |
|-------|-------------|
| `/dashboard` | Student home |
| `/dashboard/courses` | Enrolled courses |
| `/learn/[courseId]` | LMS learning interface |
| `/dashboard/certificates` | Earned certificates |
| `/dashboard/payments` | Payment history |

### Admin (Admin Role Required)
| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard |
| `/admin/courses` | Course management |
| `/admin/students` | Student management |
| `/admin/scholarships` | Scholarship applications |
| `/admin/revenue` | Revenue and analytics |

---

## 🌍 Deployment

This project is deployed on **Vercel** with automatic deployments on every push to `master`.

Live at: **[lagosdataschoolltd.com](https://lagosdataschoolltd.com)**

---

## 🗺️ Roadmap

- [x] Landing page and course catalogue
- [x] Authentication system with email verification
- [x] Database schema and RLS policies
- [x] ALAT Pay payment integration
- [x] Admin course builder with module and lesson management
- [x] Student dashboard with progress tracking
- [x] Assignment submission system
- [x] Quiz and exam engine
- [x] Scholarship application and approval flow
- [x] Certificate PDF generation and verification
- [x] Email notifications via Resend
- [x] Messaging system between students and admin
- [x] Mobile-responsive design
- [x] Production deployment
- [ ] Instructor dashboard
- [ ] Mobile app (iOS and Android)
- [ ] Advanced analytics and reporting
- [ ] API for third-party integrations

---

## 🤝 Contact and Enquiries

📧 support@lagosdataschoolltd.com
💬 WhatsApp: [+2348082845543](https://wa.me/2348082845543)
📍 125 Ijegun Road, Isheri Osun, Almaroof Gate Bus Stop, Lagos, Nigeria
🐙 [@Dwightakins](https://github.com/Dwightakins)

---

## 📄 License

Private and Proprietary — Lagos Data School Limited © 2026. All rights reserved.

---

<div align="center">
  <strong>Built in Lagos. Designed for Nigeria. 🌍</strong>
</div>
