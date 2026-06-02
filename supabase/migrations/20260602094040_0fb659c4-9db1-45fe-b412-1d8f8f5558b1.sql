-- Wire up the signup triggers (functions already exist, but no trigger was firing them)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists on_auth_user_created_admin on auth.users;
create trigger on_auth_user_created_admin
  after insert on auth.users
  for each row execute procedure public.handle_new_admin_role();

-- Backfill: give 'client' role to any existing user with no roles at all
insert into public.user_roles (user_id, role)
select u.id, 'client'::app_role
from auth.users u
where not exists (select 1 from public.user_roles r where r.user_id = u.id)
on conflict (user_id, role) do nothing;

-- Backfill admin role for the platform owner
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role
from auth.users
where email = 'umwizerwaedvin@gmail.com'
on conflict (user_id, role) do nothing;

-- Ensure the admin also has a profile row (in case they signed up before profile trigger ran)
insert into public.profiles (id, full_name)
select id, coalesce(raw_user_meta_data->>'full_name', email)
from auth.users
where email = 'umwizerwaedvin@gmail.com'
on conflict (id) do nothing;