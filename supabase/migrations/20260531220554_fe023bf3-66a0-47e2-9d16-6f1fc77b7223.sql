-- Auto-grant admin role to the platform owner on signup
create or replace function public.handle_new_admin_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email = 'umwizerwaedvin@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_admin_role on auth.users;
create trigger on_auth_user_created_admin_role
  after insert on auth.users
  for each row execute procedure public.handle_new_admin_role();

-- If the owner already exists, grant admin now
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where email = 'umwizerwaedvin@gmail.com'
on conflict (user_id, role) do nothing;

-- Avatars storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);