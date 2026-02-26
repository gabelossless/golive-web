-- Enable the "public" schema for Supabase
create schema if not exists public;

-- 1. PROFILES & AUTH SETUP
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  is_verified boolean default false,

  constraint username_length check (char_length(username) >= 3)
);

-- Index for username lookups
create index if not exists profiles_username_idx on public.profiles (username);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. VIDEOS SETUP
create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  view_count bigint default 0,
  duration text default '0:00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_live boolean default false,
  category text default 'Gaming'
);

-- Index for trending/latest queries
create index if not exists videos_view_count_idx on public.videos (view_count desc);
create index if not exists videos_created_at_idx on public.videos (created_at desc);

-- Enable RLS on videos
alter table public.videos enable row level security;

-- Policies for Videos
drop policy if exists "Videos are viewable by everyone." on videos;
create policy "Videos are viewable by everyone."
  on videos for select
  using ( true );

drop policy if exists "Users can insert their own videos." on videos;
create policy "Users can insert their own videos."
  on videos for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own videos." on videos;
create policy "Users can update their own videos."
  on videos for update
  using ( auth.uid() = user_id );

drop policy if exists "Users can delete their own videos." on videos;
create policy "Users can delete their own videos."
  on videos for delete
  using ( auth.uid() = user_id );

-- 3. STORAGE SETUP
-- Note: Buckets often need to be created via the Dashboard, but inserting into storage.buckets works in some Supabase versions.
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

-- Storage Policies (Allow public read, auth upload)
-- Videos Bucket Policies
drop policy if exists "Videos are publicly accessible." on storage.objects;
create policy "Videos are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'videos' );

drop policy if exists "Users can upload videos." on storage.objects;
create policy "Users can upload videos."
  on storage.objects for insert
  with check ( bucket_id = 'videos' and auth.role() = 'authenticated' );

drop policy if exists "Users can update their own videos." on storage.objects;
create policy "Users can update their own videos."
  on storage.objects for update
  using ( bucket_id = 'videos' and auth.uid() = owner )
  with check ( bucket_id = 'videos' and auth.uid() = owner );

-- Thumbnails Bucket Policies
drop policy if exists "Thumbnails are publicly accessible." on storage.objects;
create policy "Thumbnails are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'thumbnails' );

drop policy if exists "Users can upload thumbnails." on storage.objects;
create policy "Users can upload thumbnails."
  on storage.objects for insert
  with check ( bucket_id = 'thumbnails' and auth.role() = 'authenticated' );

drop policy if exists "Users can update their own thumbnails." on storage.objects;
create policy "Users can update their own thumbnails."
  on storage.objects for update
  using ( bucket_id = 'thumbnails' and auth.uid() = owner )
  with check ( bucket_id = 'thumbnails' and auth.uid() = owner );
