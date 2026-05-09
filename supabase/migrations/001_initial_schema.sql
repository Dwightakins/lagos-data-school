-- ============================================================
-- Lagos Data School — Initial Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- or via: supabase db push
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Tables ───────────────────────────────────────────────────

-- Public user profiles (mirrors auth.users)
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'student' check (role in ('student', 'admin')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Courses catalog
create table if not exists public.courses (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  description     text not null default '',
  price           integer not null default 0,  -- in Naira
  cover_image_url text,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Course modules (ordered sections)
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  description text not null default '',
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Lessons within modules
create table if not exists public.lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references public.modules(id) on delete cascade,
  title            text not null,
  content          text,
  video_url        text,
  duration_minutes integer,
  order_index      integer not null default 0,
  created_at       timestamptz not null default now()
);

-- Student enrollments
create table if not exists public.enrollments (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references public.users(id) on delete cascade,
  course_id          uuid not null references public.courses(id) on delete cascade,
  payment_reference  text,
  payment_status     text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  enrolled_at        timestamptz not null default now(),
  unique (student_id, course_id)
);

-- Lesson completion tracking
create table if not exists public.lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.users(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  completed    boolean not null default false,
  completed_at timestamptz,
  unique (student_id, lesson_id)
);

-- Certificates of completion
create table if not exists public.certificates (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  issued_at  timestamptz not null default now(),
  pdf_url    text,
  unique (student_id, course_id)
);

-- Scholarship applications
create table if not exists public.scholarship_applications (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.users(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  course_name text not null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────

create index if not exists enrollments_student_id_idx     on public.enrollments(student_id);
create index if not exists enrollments_course_id_idx      on public.enrollments(course_id);
create index if not exists lesson_progress_student_id_idx on public.lesson_progress(student_id);
create index if not exists lesson_progress_lesson_id_idx  on public.lesson_progress(lesson_id);
create index if not exists modules_course_id_idx          on public.modules(course_id);
create index if not exists lessons_module_id_idx          on public.lessons(module_id);
create index if not exists certificates_student_id_idx    on public.certificates(student_id);

-- ── Trigger: auto-create public.users on signup ──────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Trigger: keep updated_at current ────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

create trigger courses_updated_at
  before update on public.courses
  for each row execute procedure public.set_updated_at();

-- ── Row-Level Security ───────────────────────────────────────

alter table public.users                  enable row level security;
alter table public.courses                enable row level security;
alter table public.modules                enable row level security;
alter table public.lessons                enable row level security;
alter table public.enrollments            enable row level security;
alter table public.lesson_progress        enable row level security;
alter table public.certificates           enable row level security;
alter table public.scholarship_applications enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable
security definer
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── users ────────────────────────────────────────────────────
create policy "users: own row read"
  on public.users for select
  using (id = auth.uid() or public.is_admin());

create policy "users: own row update"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'student');  -- cannot self-promote to admin

create policy "users: admin full access"
  on public.users for all
  using (public.is_admin());

-- ── courses ──────────────────────────────────────────────────
create policy "courses: published readable by all auth users"
  on public.courses for select
  using (is_published = true and auth.uid() is not null);

create policy "courses: admin full access"
  on public.courses for all
  using (public.is_admin());

-- ── modules ──────────────────────────────────────────────────
create policy "modules: readable by enrolled students"
  on public.modules for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.course_id = modules.course_id
        and e.student_id = auth.uid()
        and e.payment_status = 'paid'
    )
  );

create policy "modules: admin full access"
  on public.modules for all
  using (public.is_admin());

-- ── lessons ──────────────────────────────────────────────────
create policy "lessons: readable by enrolled students"
  on public.lessons for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.modules m
      join public.enrollments e on e.course_id = m.course_id
      where m.id = lessons.module_id
        and e.student_id = auth.uid()
        and e.payment_status = 'paid'
    )
  );

create policy "lessons: admin full access"
  on public.lessons for all
  using (public.is_admin());

-- ── enrollments ──────────────────────────────────────────────
create policy "enrollments: student reads own"
  on public.enrollments for select
  using (student_id = auth.uid() or public.is_admin());

create policy "enrollments: admin full access"
  on public.enrollments for all
  using (public.is_admin());

-- ── lesson_progress ──────────────────────────────────────────
create policy "progress: student reads own"
  on public.lesson_progress for select
  using (student_id = auth.uid() or public.is_admin());

create policy "progress: student writes own"
  on public.lesson_progress for insert
  with check (student_id = auth.uid());

create policy "progress: student updates own"
  on public.lesson_progress for update
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ── certificates ─────────────────────────────────────────────
create policy "certificates: student reads own"
  on public.certificates for select
  using (student_id = auth.uid() or public.is_admin());

create policy "certificates: admin inserts"
  on public.certificates for insert
  with check (public.is_admin());

-- ── scholarship_applications ─────────────────────────────────
create policy "scholarships: student reads own"
  on public.scholarship_applications for select
  using (student_id = auth.uid() or public.is_admin());

create policy "scholarships: student inserts own"
  on public.scholarship_applications for insert
  with check (student_id = auth.uid());

create policy "scholarships: admin update status"
  on public.scholarship_applications for update
  using (public.is_admin());
