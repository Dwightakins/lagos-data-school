# Lagos Data School Limited (LDSL) — Project Context

## Project Overview
Lagos Data School Limited is a Nigerian EdTech LMS platform targeting the Nigerian market.
Live at: https://lagosdataschoolltd.com
GitHub: github.com/Dwightakins/lagos-data-school
Local path: C:\Users\USER\Desktop\lagos-data-school

---

## Tech Stack
- Next.js 14 App Router (NOT Pages Router — never use pages/)
- TypeScript (strict mode — no 'any' without a comment)
- Tailwind CSS + shadcn/ui for all UI components
- Supabase (database + auth + storage) — project ID: bsykjkgmlghikcvcsxud
- Paystack (Nigerian payments in Naira)
- Resend (transactional email) — from: noreply@lagosdataschoolltd.com
- jsPDF (PDF certificate and receipt generation)
- Vercel (deployment)

---

## Folder Structure
```
app/
  api/              → All API routes (server-side only)
  (auth)/           → Login, register, forgot-password pages
  (student)/        → Student dashboard pages
  (admin)/          → Admin panel pages
  learn/            → LMS learning pages
  courses/          → Public course pages
  verify/           → Certificate verification
components/
  layout/           → Navbar, footer, logo
  home/             → Homepage sections
  ui/               → shadcn/ui components
lib/
  supabase/         → Supabase client files (server.ts, client.ts, admin.ts)
  emails/           → Resend email templates
  api-auth.ts       → requireAdmin() helper
types/
  index.ts          → All TypeScript types
public/
  images/           → All images (logo.png, hero.jpg, community.jpg, etc.)
supabase/
  migrations/       → All SQL migration files
```

---

## Critical Database Rules

### Column Names (NEVER get these wrong):
- courses table uses `published` NOT `is_published`
- enrollments table uses `user_id` NOT `student_id`
- payments table: check actual column names before querying
- certificates table has: id, user_id, course_id, certificate_number, status, pdf_url, student_id

### Courses Table Columns (ONLY these exist):
id, title, description, price, thumbnail_url, published,
created_by, created_at, slug, cover_image_url, duration

### DO NOT query these columns on courses (they don't exist):
- updated_at ❌
- instructor ❌
- instructor_name ❌
- category ❌
- is_published ❌
- enrollment_count ❌

### Enrollment Queries (always handle NULL status):
```typescript
// CORRECT - handles old enrollments with NULL status
.or('status.eq.active,status.is.null')
.or('payment_status.eq.paid,payment_status.is.null')

// WRONG - misses old enrollments
.eq('status', 'active')
```

---

## Database Tables
```
users                   → id, email, full_name, role, student_id, phone, avatar_url
courses                 → id, title, slug, description, price, published, duration, cover_image_url, thumbnail_url
modules                 → id, course_id, title, description, order_index
lessons                 → id, module_id, title, description, video_url, duration, is_preview, order_index
enrollments             → id, user_id, course_id, payment_status, status, type, enrolled_at
payments                → id, user_id, course_id, amount, status, paystack_reference, created_at
scholarship_applications → id, user_id, course_id, full_name, email, phone, reason, status, payment_token, token_expires_at, payment_completed
lesson_progress         → id, user_id, lesson_id, completed, watch_position, last_watched_at
certificates            → id, user_id, course_id, certificate_number, student_id, status, pdf_url, issued_at
notifications           → id, user_id, type, title, message, read, created_at
messages                → id, sender_id, recipient_id, subject, body, read, created_at
contact_messages        → id, name, email, phone, subject, message, status, created_at
course_notes            → id, user_id, lesson_id, note_text, video_timestamp, created_at
lesson_bookmarks        → id, user_id, lesson_id, created_at
lesson_materials        → id, lesson_id, course_id, file_name, file_url, file_type, file_size
lesson_comments         → id, lesson_id, user_id, parent_id, comment_text, upvotes, created_at
coupons                 → id, code, discount_type, discount_value, max_uses, used_count, expires_at, active
announcements           → id, title, message, target, course_id, send_email, send_notif, created_at
support_tickets         → id, user_id, course_id, subject, message, status, created_at
```

---

## Pricing & Business Rules
- Full course price: ₦250,000
- Scholarship fee: ₦15,000
- Scholarship discount: 94% off (show percentage publicly, NOT the ₦15,000 amount)
- Students can only enroll in ONE course at a time
- Student ID format: LDSL/DA/001 (LDSL/[COURSE_CODE]/[SEQUENTIAL_NUMBER])
- Course codes: DA=Data Analysis, DS=Data Science, CY=Cybersecurity, ML=Machine Learning, etc.

---

## Branding & Design
- Primary brand color: GREEN (NOT wine, NOT red, NOT purple)
- Logo file: /public/images/logo.png (official LDSL logo with bar chart and open book)
- Fonts: Space Grotesk (headings), Plus Jakarta Sans (body), JetBrains Mono (code)
- Dark mode and light mode must work on ALL pages
- Mobile responsive on ALL pages (minimum 390px width)
- Touch targets minimum 44px on mobile

---

## Key Routes
```
Public:
/ → Homepage
/courses → Course catalogue
/courses/[slug] → Course detail page
/apply-scholarship → Scholarship application (public, no login required)
/verify/[certId] → Certificate verification (public)
/login → Login page
/register → Registration wizard (4 steps)
/about → About us
/contact → Contact page
/pricing → Pricing page

Student (requires login):
/dashboard → Student dashboard
/dashboard/courses → Enrolled courses
/dashboard/settings → Profile settings
/dashboard/certificates → Student certificates
/dashboard/payments → Payment history
/dashboard/notifications → Notifications
/dashboard/progress → Progress reports
/dashboard/materials → Course materials
/dashboard/bookmarks → Saved lessons
/dashboard/notes → Course notes
/dashboard/support → Support tickets
/dashboard/messages → Messages from admin
/learn/[courseId] → LMS learning page

Admin (requires role='admin'):
/admin → Admin dashboard
/admin/courses → Course management
/admin/courses/[id]/content → Module and lesson builder
/admin/courses/[id]/materials → File uploads
/admin/courses/[id]/quizzes → Quiz builder
/admin/courses/[id]/assignments → Assignments
/admin/students → Student management
/admin/students/[id] → Student detail
/admin/scholarships → Scholarship applications
/admin/revenue → Revenue reports
/admin/certificates → Certificate management
/admin/announcements → Send announcements
/admin/coupons → Discount codes
/admin/email-templates → Email template editor
/admin/instructors → Instructor management
/admin/messages → Contact form messages
/admin/support → Support tickets
/admin/settings → Platform settings

Scholarship:
/scholarship-payment/[token] → Scholarship payment page (unique token link)
```

---

## Authentication & Security Rules
- ALL database mutations go through API routes (never direct from client)
- NEVER expose SUPABASE_SERVICE_ROLE_KEY to browser
- Admin routes MUST use requireAdmin() from lib/api-auth.ts
- Student routes must verify user owns the data they're accessing
- Middleware protects /dashboard, /admin, /learn routes
- Email must be verified before accessing /dashboard
- Scholarship payment only allowed via approved unique token

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://bsykjkgmlghikcvcsxud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key]
SUPABASE_SERVICE_ROLE_KEY=[service role key]
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=[paystack public key]
PAYSTACK_SECRET_KEY=[paystack secret key]
RESEND_API_KEY=[resend api key]
RESEND_FROM_EMAIL=noreply@lagosdataschoolltd.com
SUPPORT_EMAIL=support@lagosdataschoolltd.com
NEXT_PUBLIC_APP_URL=https://lagosdataschoolltd.com
```

---

## Email System (Resend)
- All emails sent via Resend API
- From: noreply@lagosdataschoolltd.com
- Reply-To: support@lagosdataschoolltd.com
- Always personalize with student name, Student ID, course name
- Email templates in lib/emails/ folder
- Trigger emails for: registration, enrollment, scholarship approval/rejection, certificate earned, password reset

---

## Payment System (Paystack)
- All payments in Nigerian Naira (NGN)
- Amounts stored in kobo (multiply by 100 before sending to Paystack)
- Webhook endpoint: /api/paystack/webhook
- Verify payments server-side before creating enrollment
- Prevent duplicate enrollments with unique constraint
- Scholarship payments only via approved token link

---                                                                                                                                             

## Contact Information
- WhatsApp: +2348082845543
- Support email: support@lagosdataschoolltd.com
- Admin email: dwightakinyanju@lagosdataschoolltd.com
- Address: 125 Ijegun Road, Isheri Osun, Almaroof Gate Bus Stop, Lagos, Nigeria
- Website: https://lagosdataschoolltd.com

---

## Common Mistakes to AVOID
1. Never add 'updated_at' to courses queries — column does not exist
2. Never filter enrollments with .eq('status', 'active') alone — use .or() to include NULL
3. Never show ₦15,000 scholarship price publicly — show 94% only
4. Never allow multi-course enrollment — one course per student
5. Never redirect "Go to Dashboard" links directly to /dashboard — go to /login first
6. Never hardcode colors as wine/red — always use green as primary
7. Never skip mobile responsive check — test at 390px
8. Never expose service role key in client components
9. Never use pages/ router — always use app/ router
10. Never query courses for columns that don't exist (see list above)

---

## Supabase Storage Buckets
- course-materials → For lesson files (PDFs, videos, datasets)
- certificates → For generated certificate PDFs

---

## PDF Generation
- Use jsPDF for certificates and payment receipts
- Certificate includes: student name, course, date, Student ID, LDSL logo
- Receipt includes: transaction ID, student name, course, amount, date

---

## Key Helper Functions
- lib/api-auth.ts → requireAdmin() for protecting admin API routes
- lib/supabase/server.ts → createClient() for server components
- lib/supabase/client.ts → createClient() for client components  
- lib/supabase/admin.ts → createAdminClient() for admin operations
- lib/emails/ → All email sending functions

---

## Workflow
1. Make changes locally (npm run dev on localhost:3000)
2. Test thoroughly on desktop AND mobile
3. Push to GitHub: git add . && git commit -m "message" && git push origin master
4. Vercel auto-deploys from master branch
5. Run any new SQL migrations in Supabase SQL Editor
