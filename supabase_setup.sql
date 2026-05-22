-- SUPABASE SETUP SCRIPT FOR BINGE BUDDY
-- Paste this script into the Supabase SQL Editor and run it.

-- Enable uuid-ossp extension
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  top_favorites integer[] default '{-1,-1,-1,-1}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Allow users to update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Create User Movies Table (Isolated per user)
create table public.user_movies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tmdb_id integer not null,
  imdb_id text,
  title text not null,
  original_title text,
  poster_path text,
  backdrop_path text,
  release_date text,
  overview text,
  runtime integer,
  genres text[] default '{}',
  directors text[] default '{}',
  "cast" jsonb default '[]',
  origin_country text[] default '{}',
  spoken_languages text[] default '{}',
  vote_average numeric,
  vote_count integer,
  status text check (status in ('watchlist', 'watched', 'none')) not null,
  user_rating numeric,
  user_review text,
  media_type text check (media_type in ('movie', 'tv')) not null,
  tagline text,
  number_of_seasons integer,
  number_of_episodes integer,
  date_added timestamp with time zone default timezone('utc'::text, now()),
  date_watched timestamp with time zone,
  unique (user_id, tmdb_id)
);

-- Enable RLS for user_movies
alter table public.user_movies enable row level security;

-- User Movies Policies (Strictly isolated - user can only see/edit their own lists)
create policy "Users can see only their own movies" on public.user_movies
  for select using (auth.uid() = user_id);

create policy "Users can insert their own movies" on public.user_movies
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own movies" on public.user_movies
  for update using (auth.uid() = user_id);

create policy "Users can delete their own movies" on public.user_movies
  for delete using (auth.uid() = user_id);

-- 3. Create Custom Lists Table (Isolated per user)
create table public.custom_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  movie_ids integer[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for custom_lists
alter table public.custom_lists enable row level security;

-- Custom Lists Policies
create policy "Users can see only their own custom lists" on public.custom_lists
  for select using (auth.uid() = user_id);

create policy "Users can insert their own custom lists" on public.custom_lists
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own custom lists" on public.custom_lists
  for update using (auth.uid() = user_id);

create policy "Users can delete their own custom lists" on public.custom_lists
  for delete using (auth.uid() = user_id);

-- 4. Create Watch Logs Table (Isolated per user)
create table public.watch_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  movie_id integer not null,
  movie_title text not null,
  poster_path text,
  media_type text not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  rating numeric not null,
  review text,
  rewatch boolean default false not null
);

-- Enable RLS for watch_logs
alter table public.watch_logs enable row level security;

-- Watch Logs Policies
create policy "Users can see only their own watch logs" on public.watch_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own watch logs" on public.watch_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own watch logs" on public.watch_logs
  for update using (auth.uid() = user_id);

create policy "Users can delete their own watch logs" on public.watch_logs
  for delete using (auth.uid() = user_id);

-- 5. Create Community Threads Table (Shared)
create table public.community_threads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  username text not null,
  avatar_url text,
  title text not null,
  content text not null,
  movie_title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for community_threads
alter table public.community_threads enable row level security;

-- Community Threads Policies (Read by anyone, write by authenticated, edit own)
create policy "Anyone can view community threads" on public.community_threads
  for select using (true);

create policy "Authenticated users can create threads" on public.community_threads
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Users can update their own threads" on public.community_threads
  for update using (auth.uid() = user_id);

create policy "Users can delete their own threads" on public.community_threads
  for delete using (auth.uid() = user_id);

-- 6. Create Community Replies Table (Shared)
create table public.community_replies (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.community_threads on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  username text not null,
  avatar_url text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for community_replies
alter table public.community_replies enable row level security;

-- Community Replies Policies (Read by anyone, write by authenticated, edit own)
create policy "Anyone can view community replies" on public.community_replies
  for select using (true);

create policy "Authenticated users can post replies" on public.community_replies
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Users can update their own replies" on public.community_replies
  for update using (auth.uid() = user_id);

create policy "Users can delete their own replies" on public.community_replies
  for delete using (auth.uid() = user_id);

-- 7. Trigger to automatically create a public Profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Cinephile_' || substr(new.id::text, 1, 6)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
