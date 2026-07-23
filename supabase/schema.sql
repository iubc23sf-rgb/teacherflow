-- TeacherFlow β版 スキーマ（Supabase / PostgreSQL）
-- Supabase の SQL Editor にそのまま貼り付けて実行してください。

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  school_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text default '#3B82F6',
  weekly_periods smallint default 0, -- 時間割の自動生成で使う週あたりのコマ数
  created_at timestamptz default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  grade text,
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  subject_id uuid references public.subjects(id) on delete set null,
  due_date date,
  priority smallint default 2,
  status text default 'open',
  source text default 'manual',
  google_event_id text,
  time_slot text check (time_slot in ('morning', 'noon', 'afterschool')), -- 自分の時間割上の朝/昼/放課後レーン表示用
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  google_event_id text not null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  location text,
  synced_at timestamptz default now(),
  unique (user_id, google_event_id)
);

create table if not exists public.google_oauth_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expiry timestamptz not null,
  scope text,
  updated_at timestamptz default now()
);

create table if not exists public.timetables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default '通常時間割',
  kind text not null default 'personal' check (kind in ('personal', 'homeroom')),
  academic_year text,
  created_at timestamptz default now(),
  unique (user_id, kind)
);

create table if not exists public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null references public.timetables(id) on delete cascade,
  day_of_week smallint not null,
  period smallint not null,
  subject_id uuid references public.subjects(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  room text,
  created_at timestamptz default now(),
  unique (timetable_id, day_of_week, period)
);

-- 特定の日だけ通常の時間割（曜日テンプレート）を上書きする（特別時間割・行事による変更など）。
-- 行が無ければ通常のtimetable_slotsどおり。subject_id/custom_labelが両方nullの行は「その日は空コマ」を意味する。
create table if not exists public.timetable_overrides (
  id uuid primary key default gen_random_uuid(),
  timetable_id uuid not null references public.timetables(id) on delete cascade,
  override_date date not null,
  period smallint not null,
  subject_id uuid references public.subjects(id) on delete set null,
  custom_label text,
  class_id uuid references public.classes(id) on delete set null,
  room text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (timetable_id, override_date, period)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  unit_name text not null,
  planned_hours numeric default 0,
  completed_hours numeric default 0,
  target_test_date date,
  notes text,
  updated_at timestamptz default now()
);

create table if not exists public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  created_at timestamptz default now()
);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_chat_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists public.pdf_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  status text default 'processing',
  extracted_task_count int default 0,
  created_at timestamptz default now()
);

create table if not exists public.interview_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  student_name text not null,
  class_id uuid references public.classes(id) on delete set null,
  interview_date date not null,
  interview_type text default 'other', -- sanja(三者面談) / hogosha(保護者面談) / other
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 授業以外の予定（部活・校務分掌・学校行事など）。月表示カレンダーに表示する
create table if not exists public.school_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  event_date date not null,
  category text not null default 'other' check (category in ('club', 'duty', 'event', 'other')), -- club(部活) / duty(校務分掌) / event(学校行事) / other
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 資料・ファイル管理。実体は Storage の "documents" バケットに保存し、ここではメタデータのみ持つ
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  size_bytes bigint,
  created_at timestamptz default now()
);

-- profiles を auth.users 作成時に自動生成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS 有効化
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.google_oauth_tokens enable row level security;
alter table public.timetables enable row level security;
alter table public.timetable_slots enable row level security;
alter table public.timetable_overrides enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.ai_chat_sessions enable row level security;
alter table public.ai_chat_messages enable row level security;
alter table public.pdf_imports enable row level security;
alter table public.interview_records enable row level security;
alter table public.school_events enable row level security;
alter table public.documents enable row level security;

-- 本人のデータのみ CRUD 可能にする標準ポリシー
create policy "Individual access" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Individual access" on public.subjects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.classes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.calendar_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.google_oauth_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.timetables for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.ai_chat_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.pdf_imports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.interview_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.school_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Individual access" on public.documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Individual access via timetable" on public.timetable_slots for all using (
  exists (select 1 from public.timetables t where t.id = timetable_id and t.user_id = auth.uid())
) with check (
  exists (select 1 from public.timetables t where t.id = timetable_id and t.user_id = auth.uid())
);

create policy "Individual access via timetable" on public.timetable_overrides for all using (
  exists (select 1 from public.timetables t where t.id = timetable_id and t.user_id = auth.uid())
) with check (
  exists (select 1 from public.timetables t where t.id = timetable_id and t.user_id = auth.uid())
);

create policy "Individual access via session" on public.ai_chat_messages for all using (
  exists (select 1 from public.ai_chat_sessions s where s.id = session_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.ai_chat_sessions s where s.id = session_id and s.user_id = auth.uid())
);

-- 権限付与（重要）
-- RLS ポリシーはテーブルへの GRANT があって初めて機能する。GRANT がないと
-- authenticated ロールからのアクセスは RLS を評価する前に 42501 (permission
-- denied) で拒否される。SQL Editor でテーブルを作成した場合は自動付与され
-- ないため明示的に grant する。
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.subjects,
  public.classes,
  public.tasks,
  public.calendar_events,
  public.google_oauth_tokens,
  public.timetables,
  public.timetable_slots,
  public.timetable_overrides,
  public.lesson_progress,
  public.ai_chat_sessions,
  public.ai_chat_messages,
  public.pdf_imports,
  public.interview_records,
  public.school_events,
  public.documents
to authenticated;
