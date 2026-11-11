-- FORM Gym — Supabase PostgreSQL schema
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor > New query.
-- Kebijakan RLS menjaga data planner dan workout tetap milik pengguna yang login.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.muscle_groups (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  function text not null default '',
  focus text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group_id text references public.muscle_groups(id) on delete set null,
  description text not null default '',
  instructions jsonb not null default '[]'::jsonb,
  equipment text not null default 'Berat badan',
  difficulty text not null default 'Pemula',
  video_url text,
  video_provider text,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_secondary_muscles (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_group_id text not null references public.muscle_groups(id) on delete cascade,
  primary key (exercise_id, muscle_group_id)
);

create table if not exists public.workout_plan_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  is_rest_day boolean not null default false,
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day_of_week)
);

create table if not exists public.workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.workout_plan_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  order_index integer not null default 0,
  target_sets integer not null default 3 check (target_sets > 0),
  target_reps text not null default '8-12'
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  performed_at timestamptz not null default now(),
  notes text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  order_index integer not null default 0
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.workout_session_exercises(id) on delete cascade,
  set_number integer not null check (set_number > 0),
  weight_kg numeric(7,2) not null default 0 check (weight_kg >= 0),
  reps integer not null check (reps > 0),
  created_at timestamptz not null default now(),
  unique (session_exercise_id, set_number)
);

create index if not exists workout_sessions_user_date_idx on public.workout_sessions(user_id, performed_at desc);
create index if not exists plan_days_user_idx on public.workout_plan_days(user_id);
create index if not exists session_exercises_session_idx on public.workout_session_exercises(session_id);
create index if not exists workout_sets_session_exercise_idx on public.workout_sets(session_exercise_id);

-- RLS enabled on every table.
alter table public.profiles enable row level security;
alter table public.muscle_groups enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_secondary_muscles enable row level security;
alter table public.workout_plan_days enable row level security;
alter table public.workout_plan_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.workout_sets enable row level security;

drop policy if exists "profile read own" on public.profiles;
create policy "profile read own" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "muscles readable by everyone" on public.muscle_groups;
create policy "muscles readable by everyone" on public.muscle_groups for select to anon, authenticated using (true);
drop policy if exists "exercises readable by everyone" on public.exercises;
create policy "exercises readable by everyone" on public.exercises for select to anon, authenticated using (true);
drop policy if exists "secondary muscles readable by everyone" on public.exercise_secondary_muscles;
create policy "secondary muscles readable by everyone" on public.exercise_secondary_muscles for select to anon, authenticated using (true);

drop policy if exists "plan days own rows" on public.workout_plan_days;
create policy "plan days own rows" on public.workout_plan_days for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "plan exercises own rows" on public.workout_plan_exercises;
create policy "plan exercises own rows" on public.workout_plan_exercises for all to authenticated
using (exists (select 1 from public.workout_plan_days d where d.id = plan_day_id and d.user_id = (select auth.uid())))
with check (exists (select 1 from public.workout_plan_days d where d.id = plan_day_id and d.user_id = (select auth.uid())));

drop policy if exists "sessions own rows" on public.workout_sessions;
create policy "sessions own rows" on public.workout_sessions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "session exercises own rows" on public.workout_session_exercises;
create policy "session exercises own rows" on public.workout_session_exercises for all to authenticated
using (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = (select auth.uid())))
with check (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
drop policy if exists "sets own rows" on public.workout_sets;
create policy "sets own rows" on public.workout_sets for all to authenticated
using (exists (
  select 1 from public.workout_session_exercises se
  join public.workout_sessions s on s.id = se.session_id
  where se.id = session_exercise_id and s.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.workout_session_exercises se
  join public.workout_sessions s on s.id = se.session_id
  where se.id = session_exercise_id and s.user_id = (select auth.uid())
));

-- Seed katalog awal. ID gerakan dibuat tetap agar aman dijalankan ulang.
insert into public.muscle_groups (id,name,slug,description,function,focus) values
('chest','Dada','dada','Kelompok otot pectoralis yang membantu gerakan mendorong dan membawa lengan ke depan.','Horizontal adduction dan internal rotation bahu; membantu gerakan pushing.','Chest press, push-up, cable fly'),
('back','Punggung','punggung','Kelompok otot luas di bagian belakang torso, termasuk latissimus dorsi dan trapezius.','Menarik lengan, mengontrol tulang belikat, dan menjaga postur.','Row, pull-down, pull-up'),
('shoulders','Bahu','bahu','Deltoid memiliki bagian anterior, lateral, dan posterior dengan arah gerak berbeda.','Mengangkat dan menggerakkan lengan ke berbagai arah.','Overhead press, lateral raise, rear-delt fly'),
('arms','Lengan','lengan','Biceps, triceps, dan otot lengan bawah membantu fleksi serta ekstensi siku dan pergelangan.','Menekuk siku, meluruskan siku, dan menggenggam.','Curl, triceps pushdown, hammer curl'),
('legs','Kaki','kaki','Quadriceps, hamstrings, glutes, dan betis berkontribusi pada gerak tungkai.','Squat, hip extension, knee flexion, dan plantar flexion.','Squat, Romanian deadlift, calf raise'),
('core','Core','core','Otot perut dan batang tubuh membantu menstabilkan tulang belakang dan panggul.','Stabilitas, anti-extension, anti-rotation, dan kontrol torso.','Plank, dead bug, Pallof press')
on conflict (id) do update set name=excluded.name,slug=excluded.slug,description=excluded.description,function=excluded.function,focus=excluded.focus;

insert into public.exercises (name,muscle_group_id,description,instructions,equipment,difficulty,video_url,video_provider)
select v.name,v.muscle_group_id,v.description,v.instructions::jsonb,v.equipment,v.difficulty,null,null
from (values
('Bench Press','chest','Gerakan dorong horizontal untuk melatih dada, dengan kontribusi triceps dan deltoid anterior.','["Atur bangku datar dan pegang dumbbell di sisi dada.","Kencangkan core dan jaga kaki stabil di lantai.","Dorong beban ke atas tanpa membenturkan dumbbell.","Turunkan perlahan dengan kontrol dan rentang nyaman."]','Dumbbell, bangku','Pemula'),
('Seated Cable Row','back','Gerakan menarik horizontal yang melatih otot punggung dan membantu kontrol tulang belikat.','["Duduk tegak dengan lutut sedikit menekuk.","Tarik pegangan ke arah torso tanpa mengayun.","Tarik tulang belikat dengan kontrol.","Kembalikan pegangan perlahan."]','Cable machine','Pemula'),
('Dumbbell Shoulder Press','shoulders','Gerakan dorong vertikal untuk deltoid dan triceps.','["Mulai dengan dumbbell setinggi bahu.","Kencangkan core dan hindari melengkungkan punggung berlebihan.","Dorong beban ke atas dengan kontrol.","Turunkan sampai posisi awal yang nyaman."]','Dumbbell','Pemula'),
('Dumbbell Biceps Curl','arms','Latihan isolasi untuk biceps melalui fleksi siku.','["Berdiri tegak dengan siku dekat sisi badan.","Tekuk siku tanpa mengayun torso.","Tahan singkat di atas jika nyaman.","Turunkan beban perlahan."]','Dumbbell','Pemula'),
('Goblet Squat','legs','Variasi squat dengan beban di depan dada untuk melatih tungkai dan glutes.','["Pegang dumbbell di depan dada.","Berdiri dengan stance yang nyaman.","Turun dengan lutut mengikuti arah jari kaki.","Dorong lantai untuk kembali berdiri."]','Dumbbell','Pemula'),
('Forearm Plank','core','Latihan stabilitas anti-extension untuk otot core.','["Letakkan siku di bawah bahu.","Buat garis tubuh yang stabil dari kepala hingga tumit.","Kencangkan perut dan bernapas normal.","Berhenti jika bentuk tubuh tidak dapat dipertahankan."]','Berat badan','Pemula')
) as v(name,muscle_group_id,description,instructions,equipment,difficulty)
where not exists (select 1 from public.exercises e where e.name=v.name and e.muscle_group_id=v.muscle_group_id);

-- Catatan video:
-- Isi video_url hanya dengan video milik sendiri, berlisensi, atau embed yang diizinkan.
-- video_provider='youtube' mendukung YouTube embed; URL lain dibuka sebagai tautan eksternal.
