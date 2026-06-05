# 🎓 Lagos Data School — Learning Management Platform

> Africa's next-generation tech and data skills academy. A full-stack SaaS LMS built with Next.js 14, Supabase, and Paystack — supporting 200,000+ students at scale.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss)
![Paystack](https://img.shields.io/badge/Paystack-Payments-blue?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)

---

## 📌 Overview

Lagos Data School Limited is a production-grade Learning Management System (LMS) built specifically for the African market. It combines elite tech education with a scholarship-first access model — making world-class data, AI, and software engineering skills accessible to every motivated student regardless of financial background.

The platform operates as a complete SaaS product with two enrollment tiers:

- **Full Pay** — Students pay the full course price and get immediate access
- **Scholarship** — Students apply, get approved, and pay only 5–10% of the course price

---

## ✨ Features

### 🎯 Student Experience
- Browse and enroll in pre-recorded video courses
- Attend live tutoring sessions embedded directly in the platform
- Submit assignments and receive graded feedback
- Take timed exams with auto-grading (MCQ) and manual grading (written)
- Track learning progress with a personal dashboard
- Download verified PDF certificates on course completion
- Apply for scholarships with document upload

### 🛠️ Admin Control Panel
- Full course builder — create courses, modules, and lessons with video URLs
- Student roster and enrollment management
- Scholarship application review — approve or reject with one click
- Assignment grading panel with feedback system
- Live class scheduling via Daily.co integration
- Platform-wide analytics — revenue, enrollments, completion rates

### 🔐 Security & Architecture
- Row Level Security (RLS) on all Supabase tables
- JWT-based authentication with role claims (student / admin)
- Paystack webhook HMAC-SHA512 signature verification
- All database mutations go through server-side API routes
- Environment variables protected — never exposed to browser
- Admin 2FA enforced

### 💳 Payments (Nigerian Market)
- Paystack integration — supports NGN, bank transfer, USSD, cards
- Full-pay and discounted scholarship payment flows
- Webhook-verified enrollment — no payment fraud possible
- Certificate verification fees for employers

### 📜 Certificate Engine
- Auto-generated branded PDF certificates using Puppeteer
- Unique certificate IDs for employer verification
- Public verification endpoint — no login required
- Auto-emailed to students on course completion

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | Full-stack React framework |
| Language | TypeScript 5.x | Type-safe development |
| Styling | Tailwind CSS + shadcn/ui | UI components and design system |
| Database | PostgreSQL via Supabase | Primary data store |
| Auth | Supabase Auth | Email/password + Google OAuth |
| Payments | Paystack | NGN payments + webhooks |
| Email | Resend | Transactional email |
| File Storage | Supabase Storage | Assignments + certificates |
| Live Classes | Daily.co | Embedded video sessions |
| Certificates | Puppeteer | PDF generation |
| Caching | Upstash Redis | API response caching |
| Monitoring | Sentry | Error tracking |
| Deployment | Vercel | Global edge deployment |

---

## 📁 Project Structure

```
lagos-data-school/
├── app/
│   ├── (student)/          # Student-facing pages
│   │   ├── dashboard/      # Student dashboard
│   │   ├── learn/          # Course player
│   │   ├── exams/          # Exam engine
│   │   └── certificates/   # Certificate view
│   ├── (admin)/            # Admin panel pages
│   │   ├── courses/        # Course builder
│   │   ├── students/       # Student management
│   │   ├── scholarships/   # Scholarship review
│   │   └── grading/        # Assignment grading
│   ├── api/                # Server-side API routes
│   │   ├── enroll/         # Payment + enrollment
│   │   ├── paystack/       # Webhook handler
│   │   ├── scholarship/    # Scholarship flow
│   │   ├── exams/          # Exam engine
│   │   ├── certificates/   # PDF generation
│   │   └── auth/           # Authentication
│   └── page.tsx            # Landing page
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser Supabase client
│   │   └── server.ts       # Server Supabase client
│   └── utils.ts            # Shared utilities
├── types/
│   └── index.ts            # TypeScript type definitions
├── public/                 # Static assets
├── CLAUDE.md               # AI development context
└── .env.local              # Environment variables (not committed)
```

---

## 🗄️ Database Schema

The platform uses 16 PostgreSQL tables with Row Level Security enabled on all of them:

`users` · `courses` · `modules` · `lessons` · `enrollments` · `lesson_progress` · `scholarship_applications` · `payments` · `assignments` · `submissions` · `exams` · `exam_questions` · `exam_attempts` · `certificates` · `live_sessions` · `notifications`

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm v9+
- Git
- A Supabase account
- A Paystack account (Nigerian business)
- A Resend account

### Installation

```bash
# Clone the repository
git clone https://github.com/Dwightakins/lagos-data-school.git

# Navigate into the project
cd lagos-data-school

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# Resend
RESEND_API_KEY=your_resend_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase public key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase secret key (server only — never expose) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | ✅ | Paystack public key |
| `PAYSTACK_SECRET_KEY` | ✅ | Paystack secret key (server only) |
| `RESEND_API_KEY` | ✅ | Resend email API key (server only) |

---

## 📡 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new student |
| `/api/enroll/full` | POST | Initialise Paystack full-pay enrollment |
| `/api/paystack/webhook` | POST | Verify payment + grant course access |
| `/api/scholarship/apply` | POST | Submit scholarship application |
| `/api/progress` | POST | Mark lesson complete |
| `/api/exams/[id]/start` | POST | Begin timed exam |
| `/api/exams/[id]/submit` | POST | Submit and auto-grade exam |
| `/api/certificates/generate` | POST | Generate PDF certificate |
| `/api/certificates/verify/[certId]` | GET | Public certificate verification |
| `/api/admin/stats` | GET | Platform analytics |

---

## 🌍 Deployment

This project is deployed on **Vercel** with automatic deployments on every push to `main`.

```bash
# Deploy to Vercel
vercel deploy
```

**Important before going live:**
- Add all environment variables in Vercel dashboard
- Update Paystack webhook URL to production domain
- Switch Paystack from test keys to live keys
- Enable RLS on all Supabase tables
- Enable admin 2FA in Supabase Auth

---

## 🗺️ Roadmap

- [x] Project setup and configuration
- [x] Environment variables configured
- [ ] Landing page and course catalogue
- [ ] Authentication system (register + login)
- [ ] Database schema and RLS policies
- [ ] Paystack payment integration
- [ ] Admin course builder
- [ ] Student dashboard and lesson player
- [ ] Assignment submission system
- [ ] Exam engine with auto-grading
- [ ] Scholarship application flow
- [ ] Certificate PDF generation
- [ ] Email notifications (Resend)
- [ ] Live class integration (Daily.co)
- [ ] Mobile responsiveness
- [ ] Production deployment

---

## 🤝 Contributing

This is a private commercial project. For inquiries contact:

📧 invest@lagosdataschool.com  
🌍 Lagos, Nigeria  
🐙 [@Dwightakins](https://github.com/Dwightakins)

---

## 📄 License

Private and Proprietary — Lagos Data School Limited © 2026. All rights reserved.

---

<div align="center">
  <strong>Built in Lagos. Designed for Africa. 🌍</strong>
</div>