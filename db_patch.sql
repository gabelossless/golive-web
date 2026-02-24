-- DB Patch: Automate Profile Creation and Optimize Foreign Keys

-- 1. Create a robust function to handle new user signups (Email & OAuth)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  base_username text;
  final_username text;
  counter integer := 1;
begin
  -- Try to get username from metadata, or fallback to email prefix
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  
  -- Ensure minimum length of 3 (per our table constraint)
  if base_username is null or length(base_username) < 3 then
    base_username := base_username || 'user' || floor(random() * 1000)::text;
  end if;
  
  -- Remove spaces or special chars if needed, but basic alphanumeric is safer
  base_username := regexp_replace(base_username, '\W+', '', 'g');
  
  final_username := base_username;
  
  -- Handle potential uniqueness collisions
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := base_username || counter::text;
    counter := counter + 1;
  end loop;

  -- Insert the new profile
  insert into public.profiles (id, username, avatar_url, updated_at)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id),
    now()
  );
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to allow re-running
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Add performance indexes that were missing
-- Index on foreign key: Videos -> User
create index if not exists idx_videos_user_id on public.videos(user_id);

-- Index on category for faster homepage filtering
create index if not exists idx_videos_category on public.videos(category);
